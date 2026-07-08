"""
Nimblize - Redis / BullMQ Notification Queue
Replaces the single-point-of-failure Slack webhook with a multi-channel
resilient queue. Background workers drain this queue and attempt delivery
across Slack, SendGrid email, PagerDuty, and the PostgreSQL HITL dashboard.
"""

import os
import json
import time
import uuid
import redis
import requests
from typing import Dict, Any

_redis = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    db=1,
    decode_responses=True,
)

NOTIFICATION_QUEUE = "nimblize:notification_queue"
DEAD_LETTER_QUEUE  = "nimblize:dead_letter_queue"
MAX_RETRIES = 5


# ─────────────────────────────────────────────────────────────────────────────
# Producer: Push jobs to queue
# ─────────────────────────────────────────────────────────────────────────────

def push_notification_job(
    pipeline_id: str,
    score: float,
    payload: Dict[str, Any],
    channels: list = None,
) -> None:
    """
    Push a low-confidence pipeline alert to the Redis notification queue.
    Workers will attempt multi-channel delivery asynchronously.
    """
    if channels is None:
        channels = ["slack", "email", "pagerduty", "dashboard"]

    job = {
        "job_id": str(uuid.uuid4()),
        "pipeline_id": pipeline_id,
        "score": score,
        "payload": payload,
        "channels": channels,
        "attempts": 0,
        "enqueued_at": time.time(),
    }
    _redis.rpush(NOTIFICATION_QUEUE, json.dumps(job))
    print(f"[Queue] 📥 Notification job {job['job_id']} enqueued. Score={score:.2f}")


def push_to_dead_letter(job: Dict[str, Any], reason: str) -> None:
    """Move a permanently failed job to the dead-letter queue for inspection."""
    job["dead_reason"] = reason
    job["dead_at"] = time.time()
    _redis.rpush(DEAD_LETTER_QUEUE, json.dumps(job))
    print(f"[Queue] 💀 Job {job.get('job_id')} moved to dead-letter: {reason}")


# ─────────────────────────────────────────────────────────────────────────────
# Consumer: Background notification worker
# ─────────────────────────────────────────────────────────────────────────────

def process_notification_queue() -> None:
    """
    Blocking worker loop. Pull jobs from the queue and attempt delivery
    across all specified channels with exponential backoff on failure.
    Run this as a separate process/container.
    """
    print("[NotificationWorker] 🚀 Starting. Listening on queue...")

    while True:
        # Blocking pop — waits up to 5s for new jobs
        result = _redis.blpop(NOTIFICATION_QUEUE, timeout=5)
        if not result:
            continue

        _, raw_job = result
        job: Dict[str, Any] = json.loads(raw_job)

        print(
            f"[NotificationWorker] Processing job {job['job_id']} "
            f"(attempt {job['attempts'] + 1}/{MAX_RETRIES})"
        )

        success = _dispatch_all_channels(job)

        if not success:
            job["attempts"] += 1
            if job["attempts"] >= MAX_RETRIES:
                push_to_dead_letter(job, "Max retries exceeded.")
            else:
                # L2 FIX: Exponential backoff: 1s, 2s, 4s, 8s, 16s
                # 2**attempts (not attempts-1) ensures first retry = 1s not 0.5s
                delay = 2 ** job["attempts"]
                time.sleep(delay)
                _redis.rpush(NOTIFICATION_QUEUE, json.dumps(job))
                print(f"[NotificationWorker] ⏳ Requeued job. Next attempt in {delay}s.")


def _dispatch_all_channels(job: Dict[str, Any]) -> bool:
    """Attempt delivery to all configured channels. Returns True if all succeed."""
    results = []
    for channel in job.get("channels", []):
        if channel == "slack":
            results.append(_send_slack(job))
        elif channel == "email":
            results.append(_send_email(job))
        elif channel == "pagerduty":
            results.append(_send_pagerduty(job))
        elif channel == "dashboard":
            results.append(_log_to_dashboard(job))
    return all(results)


def _send_slack(job: Dict[str, Any]) -> bool:
    webhook = os.getenv("SLACK_WEBHOOK_URL")
    if not webhook:
        return True  # Skip if not configured
    try:
        payload = {
            "text": (
                f"⚠️ *NIMBLIZE PIPELINE ALERT*\n"
                f"Pipeline: `{job['pipeline_id']}`\n"
                f"Confidence Score: `{job['score']:.2f}` (threshold: 0.85)\n"
                f"Assigned Reviewer: *Aastha Shukla*\n"
                f"Action Required: Review dashboard → manual_review_queue"
            )
        }
        resp = requests.post(webhook, json=payload, timeout=5)
        resp.raise_for_status()
        print(f"[Slack] ✅ Alert sent for job {job['job_id']}")
        return True
    except Exception as e:
        print(f"[Slack] ❌ Failed: {e}")
        return False


def _send_email(job: Dict[str, Any]) -> bool:
    sendgrid_key = os.getenv("SENDGRID_API_KEY")
    if not sendgrid_key:
        return True
    try:
        resp = requests.post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={"Authorization": f"Bearer {sendgrid_key}", "Content-Type": "application/json"},
            json={
                "personalizations": [{"to": [{"email": "aastha@nimblize.ai"}]}],
                "from": {"email": "pipeline@nimblize.ai"},
                "subject": f"[NIMBLIZE] Pipeline Confidence Alert — Score {job['score']:.2f}",
                "content": [{
                    "type": "text/plain",
                    "value": (
                        f"Pipeline ID: {job['pipeline_id']}\n"
                        f"Confidence Score: {job['score']:.2f}\n"
                        f"Please review the HITL dashboard immediately."
                    )
                }]
            },
            timeout=5,
        )
        resp.raise_for_status()
        print(f"[Email] ✅ Alert sent for job {job['job_id']}")
        return True
    except Exception as e:
        print(f"[Email] ❌ Failed: {e}")
        return False


def _send_pagerduty(job: Dict[str, Any]) -> bool:
    pd_key = os.getenv("PAGERDUTY_ROUTING_KEY")
    if not pd_key:
        return True
    try:
        resp = requests.post(
            "https://events.pagerduty.com/v2/enqueue",
            json={
                "routing_key": pd_key,
                "event_action": "trigger",
                "payload": {
                    "summary": f"Nimblize Pipeline Confidence Failure: {job['score']:.2f}",
                    "severity": "warning",
                    "source": "nimblize-pipeline",
                    "custom_details": {"pipeline_id": job["pipeline_id"]},
                },
            },
            timeout=5,
        )
        resp.raise_for_status()
        print(f"[PagerDuty] ✅ Incident triggered for job {job['job_id']}")
        return True
    except Exception as e:
        print(f"[PagerDuty] ❌ Failed: {e}")
        return False


def _log_to_dashboard(job: Dict[str, Any]) -> bool:
    """Log the HITL review record to PostgreSQL dashboard table."""
    try:
        from backend.db.postgres import log_hitl_review
        log_hitl_review(
            pipeline_id=job["pipeline_id"],
            ragas_scores=job["payload"].get("ragas_scores", {}),
            composite_score=job["score"],
            raw_payload=job["payload"],
        )
        return True
    except Exception as e:
        print(f"[Dashboard] ❌ DB log failed: {e}")
        return False
