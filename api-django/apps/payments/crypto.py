import base64
import os
from typing import Optional

from django.conf import settings
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _get_key() -> bytes:
    key_b64 = getattr(settings, 'REBILL_ENC_KEY', None)
    if not key_b64:
        raise RuntimeError('REBILL_ENC_KEY is not configured')
    try:
        key = base64.b64decode(key_b64)
    except Exception as exc:
        raise RuntimeError('REBILL_ENC_KEY must be base64-encoded') from exc
    if len(key) != 32:
        raise RuntimeError('REBILL_ENC_KEY must decode to 32 bytes (AES-256)')
    return key


def encrypt_string(plain_text: str, aad: Optional[bytes] = None) -> str:
    key = _get_key()
    aesgcm = AESGCM(key)
    iv = os.urandom(12)
    cipher_text = aesgcm.encrypt(iv, plain_text.encode('utf-8'), aad or b'')
    payload = iv + cipher_text
    return base64.b64encode(payload).decode('utf-8')


def decrypt_string(enc_b64: str, aad: Optional[bytes] = None) -> str:
    key = _get_key()
    data = base64.b64decode(enc_b64)
    iv, ct = data[:12], data[12:]
    aesgcm = AESGCM(key)
    plain = aesgcm.decrypt(iv, ct, aad or b'')
    return plain.decode('utf-8')







