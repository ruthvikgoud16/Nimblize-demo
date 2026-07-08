"""
Nimblize - Notification Queue Worker
Standalone process that drains the Redis notification queue and dispatches
multi-channel alerts for low-confidence pipeline payloads.

Run independently:
    python workers/notification_worker.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.queues.redis_queue import process_notification_queue

if __name__ == "__main__":
    print("[NotificationWorker] ▶ Starting Nimblize notification queue worker...")
    process_notification_queue()
