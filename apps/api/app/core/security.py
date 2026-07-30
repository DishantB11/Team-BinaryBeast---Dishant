from datetime import datetime, timedelta, timezone
from uuid import uuid4

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings


password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Simple in-memory token blacklist for logout (use Redis in production)
_blacklisted_tokens: set[str] = set()


def hash_password(password: str) -> str:
    """Return a secure password hash."""
    return password_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against its hash."""
    return password_context.verify(plain_password, hashed_password)


def create_access_token(subject: str) -> str:
    """Create a short-lived JWT access token."""
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "exp": expires_at, "type": "access", "jti": str(uuid4())}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(subject: str) -> str:
    """Create a longer-lived JWT refresh token."""
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    payload = {"sub": subject, "exp": expires_at, "type": "refresh", "jti": str(uuid4())}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """Decode a JWT token and return its payload."""
    if token in _blacklisted_tokens:
        raise JWTError("Token has been revoked.")
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])


def is_token_invalid(token: str) -> bool:
    """Return whether a token is malformed or expired."""
    try:
        decode_access_token(token)
        return False
    except JWTError:
        return True


def blacklist_token(token: str) -> None:
    """Add a token to the blacklist."""
    _blacklisted_tokens.add(token)
