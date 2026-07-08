"""
Nimblize - Redis Token Bucket Rate Limiter
Enforces per-user request limits at the FastAPI gateway layer.

Tiers:
  Free:    30 requests/minute  (capacity=30, refill=30/min)
  Premium: 300 requests/minute (capacity=300, refill=300/min)

Algorithm: Token Bucket with atomic Lua script for race-condition safety.
"""

import os
import time
import redis
from typing import Tuple

# Redis connection
_redis = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    db=0,
    decode_responses=True,
)

# Tier configurations: (capacity, refill_per_second)
TIER_CONFIG = {
    "free":    {"capacity": 30,  "refill_per_second": 30 / 60},
    "premium": {"capacity": 300, "refill_per_second": 300 / 60},
}

# Atomic Lua script: consume 1 token if available, else return remaining + wait_time
_LUA_SCRIPT = """
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(bucket[1]) or capacity
local last_refill = tonumber(bucket[2]) or now

-- Refill tokens based on elapsed time
local elapsed = now - last_refill
local new_tokens = math.min(capacity, tokens + elapsed * refill_rate)

if new_tokens >= 1 then
    new_tokens = new_tokens - 1
    redis.call('HMSET', key, 'tokens', new_tokens, 'last_refill', now)
    redis.call('EXPIRE', key, 120)
    return {1, math.floor(new_tokens)}
else
    -- Return seconds until next token available
    local wait = math.ceil((1 - new_tokens) / refill_rate)
    return {0, wait}
end
"""

_lua_sha = None


def _get_lua_sha() -> str:
    global _lua_sha
    if _lua_sha is None:
        _lua_sha = _redis.script_load(_LUA_SCRIPT)
    return _lua_sha


def check_rate_limit(user_id: str, tier: str = "free") -> Tuple[bool, int]:
    """
    Check and consume one token from the user's rate-limit bucket.

    Args:
        user_id: Unique user identifier (JWT sub or IP hash).
        tier:    'free' or 'premium'.

    Returns:
        (allowed: bool, retry_after_seconds: int)
        - If allowed=True, retry_after=0 (tokens remaining returned for info).
        - If allowed=False, retry_after is seconds until next token.
    """
    config = TIER_CONFIG.get(tier, TIER_CONFIG["free"])
    key = f"ratelimit:{tier}:{user_id}"
    now = time.time()

    try:
        result = _redis.evalsha(
            _get_lua_sha(),
            1,
            key,
            config["capacity"],
            config["refill_per_second"],
            now,
        )
        allowed = result[0] == 1
        value = int(result[1])
        return allowed, (0 if allowed else value)

    except redis.exceptions.NoScriptError:
        # Reload script if Redis flushed it
        global _lua_sha
        _lua_sha = None
        return check_rate_limit(user_id, tier)
    except Exception as e:
        # Fail open: if Redis is unavailable, allow the request
        print(f"[RateLimit] ⚠️  Redis error: {e}. Failing open.")
        return True, 0
