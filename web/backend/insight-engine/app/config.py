"""Runtime settings. The engine is stateless — the only config is the shared secret
the Spring backend must present on the internal call."""
from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache


@dataclass(frozen=True)
class Settings:
    # Shared secret expected in the X-Internal-Token header. Empty means "not
    # configured", and the engine then rejects every request (fail closed).
    internal_token: str


@lru_cache
def get_settings() -> Settings:
    return Settings(internal_token=os.getenv("INTERNAL_TOKEN", ""))
