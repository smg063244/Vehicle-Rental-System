from datetime import datetime, timedelta, timezone

from passlib.context import CryptContext

from jose import JWTError, jwt


# =====================================================
# JWT SETTINGS
# =====================================================

SECRET_KEY = "1234"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 30


# =====================================================
# PASSWORD HASHING
# =====================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def verify_password(
    plain_password,
    hashed_password
):

    return pwd_context.verify(
        plain_password,
        hashed_password
    )


def get_password_hash(password):

    return pwd_context.hash(
        password
    )


# =====================================================
# CREATE JWT
# =====================================================

def create_access_token(data: dict):

    to_encode = data.copy()


    expires = (
        datetime.now(timezone.utc)
        +
        timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )


    to_encode.update({
        "exp": expires
    })


    token = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


    return token


# =====================================================
# DECODE JWT
# =====================================================

def decode_access_token(token: str):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload

    except JWTError:

        return None