"""Internal trust boundary: verify the shared-secret header on every request.

This is server-to-server auth only (Spring authenticates the end user with JWT and
calls the engine on their behalf). No JWT is plumbed into the engine.
"""
from __future__ import annotations

import hmac

from fastapi import Depends, Header, HTTPException

from .config import Settings, get_settings


def verify_internal_token(
    x_internal_token: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> None:
    expected = settings.internal_token
    # Fail closed if unconfigured, missing, or mismatched. Constant-time compare.
    if (
        not expected
        or x_internal_token is None
        or not hmac.compare_digest(x_internal_token, expected)
    ):
        raise HTTPException(status_code=401, detail="invalid internal token")
