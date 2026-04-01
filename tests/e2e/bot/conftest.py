"""
Shared pytest fixtures and helpers for Telethon bot e2e tests.

Session credentials are read-only — the Telethon session at SESSION_PATH
must already be authorized before running these tests.  If it is not, every
test that depends on the `client` or `bot` fixtures will be skipped with a
clear message rather than failing or hanging.
"""
import asyncio
from datetime import datetime, timezone
from typing import Optional

import pytest
import pytest_asyncio
from telethon import TelegramClient
from telethon.tl.custom import Message

# ─── connection constants ────────────────────────────────────────────────────
API_ID = 23913448
API_HASH = "78d168f985edf365a5cd9679a917a0b2"
SESSION_PATH = "/home/openclaw/.openclaw/workspace/.vilona/sessions/paijo"
BOT_USERNAME = "berkahkarya_saas_bot"
BASE_URL = "http://localhost:3000"

# How long (seconds) to poll for a bot reply before giving up
DEFAULT_TIMEOUT = 20
# How frequently to poll (seconds)
POLL_INTERVAL = 0.5
# "Loading" messages the bot sends while generating — skip these when waiting
LOADING_KEYWORDS = ("Vilona",)


# ─── event loop (session-scoped) ─────────────────────────────────────────────
@pytest.fixture(scope="session")
def event_loop():
    """Single event loop shared by all session-scoped async fixtures."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ─── Telethon client (session-scoped) ────────────────────────────────────────
@pytest_asyncio.fixture(scope="session")
async def client():
    """
    Connect to Telegram using the pre-authorized session file.
    If the session is not authorized the entire session is skipped.
    """
    tc = TelegramClient(SESSION_PATH, API_ID, API_HASH)
    await tc.connect()

    if not await tc.is_user_authorized():
        await tc.disconnect()
        pytest.skip(
            "Telethon session is not authorized. "
            f"Authorize the session at {SESSION_PATH} first."
        )

    yield tc
    await tc.disconnect()


# ─── bot entity (session-scoped) ─────────────────────────────────────────────
@pytest_asyncio.fixture(scope="session")
async def bot(client):
    """
    Resolve the bot entity.  Skips the session if the bot username cannot
    be resolved (bot unreachable / username wrong).
    """
    try:
        entity = await client.get_entity(BOT_USERNAME)
    except Exception as exc:
        pytest.skip(f"Cannot resolve bot @{BOT_USERNAME}: {exc}")
    return entity


# ─── low-level helpers ────────────────────────────────────────────────────────

def _is_loading(text: str) -> bool:
    """Return True for short animation/loading messages sent by the bot."""
    if not text:
        return False
    return any(kw in text for kw in LOADING_KEYWORDS) and len(text) < 60


def _get_button_callbacks(msg) -> list[str]:
    """Return all callback_data strings from a message's inline keyboard."""
    if not msg or not msg.reply_markup:
        return []
    if not hasattr(msg.reply_markup, "rows"):
        return []
    out = []
    for row in msg.reply_markup.rows:
        for btn in row.buttons:
            data = getattr(btn, "data", None)
            if data:
                out.append(data.decode() if isinstance(data, bytes) else data)
    return out


def _get_button_map(msg) -> dict[str, str]:
    """Return {callback_data: label} for every inline button in the message."""
    if not msg or not msg.reply_markup:
        return {}
    if not hasattr(msg.reply_markup, "rows"):
        return {}
    out = {}
    for row in msg.reply_markup.rows:
        for btn in row.buttons:
            data = getattr(btn, "data", None)
            if data:
                key = data.decode() if isinstance(data, bytes) else data
                out[key] = btn.text
    return out


def _has_button(msg, *, callback_data: str = None, text_contains: str = None) -> bool:
    """
    Return True if the message has an inline button matching either
    `callback_data` (exact) or `text_contains` (case-insensitive substring).
    """
    if not msg or not msg.reply_markup:
        return False
    if not hasattr(msg.reply_markup, "rows"):
        return False
    for row in msg.reply_markup.rows:
        for btn in row.buttons:
            if callback_data is not None:
                data = getattr(btn, "data", None)
                if data:
                    d = data.decode() if isinstance(data, bytes) else data
                    if d == callback_data:
                        return True
            if text_contains is not None:
                if text_contains.lower() in btn.text.lower():
                    return True
    return False


def _is_error_text(text: Optional[str]) -> bool:
    """Return True if the bot message text looks like an error response."""
    if not text:
        return False
    t = text.lower()
    return any(
        kw in t
        for kw in ("error", "gagal", "tidak ditemukan", "failed", "can't parse", "oops")
    )


async def wait_for_response(
    client: TelegramClient,
    bot,
    since: datetime,
    *,
    timeout: float = DEFAULT_TIMEOUT,
    need_buttons: bool = False,
) -> Optional[Message]:
    """
    Poll for the next non-loading bot message sent after `since`.

    Args:
        client: authorized TelegramClient
        bot: resolved bot entity
        since: UTC datetime; only messages after this are considered
        timeout: maximum seconds to wait
        need_buttons: if True, skip messages that have no inline keyboard

    Returns:
        The matching Message, or None if timeout is reached.
    """
    me = await client.get_me()
    iterations = int(timeout / POLL_INTERVAL)
    for _ in range(iterations):
        await asyncio.sleep(POLL_INTERVAL)
        msgs = await client.get_messages(bot, limit=8)
        for m in sorted(msgs, key=lambda x: x.date, reverse=True):
            msg_date = m.date.replace(tzinfo=timezone.utc) if m.date.tzinfo is None else m.date
            if msg_date <= since:
                continue
            if m.sender_id == me.id:
                continue
            if _is_loading(m.text or ""):
                continue
            if need_buttons and not _get_button_callbacks(m):
                continue
            return m
    return None


async def send_and_wait(
    client: TelegramClient,
    bot,
    text: str,
    *,
    timeout: float = DEFAULT_TIMEOUT,
    need_buttons: bool = False,
) -> Optional[Message]:
    """Send `text` to the bot and return the first substantive reply."""
    since = datetime.now(timezone.utc)
    await client.send_message(bot, text)
    return await wait_for_response(client, bot, since, timeout=timeout, need_buttons=need_buttons)


async def click_callback(
    client: TelegramClient,
    bot,
    msg: Message,
    callback_data: str,
    *,
    timeout: float = DEFAULT_TIMEOUT,
) -> Optional[Message]:
    """
    Click the inline button with `callback_data` on `msg` and wait for the
    bot to either edit that message or send a new one.

    Returns the updated/new Message, or None if nothing changed within timeout.
    """
    if not msg or not msg.reply_markup:
        return None

    clicked = False
    for row in msg.reply_markup.rows:
        for btn in row.buttons:
            data = getattr(btn, "data", None)
            if data:
                d = data.decode() if isinstance(data, bytes) else data
                if d == callback_data:
                    await msg.click(data=data)
                    clicked = True
                    break
        if clicked:
            break

    if not clicked:
        return None

    old_text = msg.text or ""
    old_btns = _get_button_callbacks(msg)
    me = await client.get_me()

    iterations = int(timeout / POLL_INTERVAL)
    for _ in range(iterations):
        await asyncio.sleep(POLL_INTERVAL)

        # Check for an edit on the original message
        edited_list = await client.get_messages(bot, ids=[msg.id])
        if edited_list and edited_list[0]:
            edited = edited_list[0]
            new_text = edited.text or ""
            new_btns = _get_button_callbacks(edited)
            if new_text != old_text or new_btns != old_btns:
                if not _is_loading(new_text):
                    return edited

        # Check for a brand-new message
        recent = await client.get_messages(bot, limit=3)
        for m in recent:
            if m.id == msg.id:
                continue
            if m.sender_id == me.id:
                continue
            if _is_loading(m.text or ""):
                continue
            return m

    return None


async def click_button_by_text(
    client: TelegramClient,
    bot,
    msg: Message,
    text_contains: str,
    *,
    timeout: float = DEFAULT_TIMEOUT,
) -> Optional[Message]:
    """
    Click the first inline button whose label contains `text_contains`
    (case-insensitive) and wait for the bot reply.
    """
    if not msg or not msg.reply_markup:
        return None
    for row in msg.reply_markup.rows:
        for btn in row.buttons:
            if text_contains.lower() in btn.text.lower():
                data = getattr(btn, "data", None)
                if data:
                    d = data.decode() if isinstance(data, bytes) else data
                    return await click_callback(client, bot, msg, d, timeout=timeout)
    return None
