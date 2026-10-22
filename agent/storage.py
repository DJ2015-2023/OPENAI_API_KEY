"""Base de datos SQLite: publicaciones, clientes potenciales (leads) y estado del bot."""
import sqlite3
import threading
from datetime import datetime, timezone

SCHEMA = """
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    pillar TEXT,
    hint TEXT,
    media_type TEXT,          -- 'photo', 'video', 'album' o NULL (solo texto)
    media_file_id TEXT,       -- file_id de Telegram; en 'album', JSON [{"type", "file_id"}, ...]
    caption TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',  -- brief, pending, approved, published, failed, rejected
    scheduled_at TEXT,        -- ISO UTC
    published_at TEXT,
    result TEXT
);
CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel TEXT NOT NULL,    -- 'telegram' o 'vk'
    user_id TEXT NOT NULL,
    name TEXT,
    text TEXT,
    keyword TEXT,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT);
"""


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat(timespec="seconds")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Store:
    def __init__(self, path: str):
        self.db = sqlite3.connect(path, check_same_thread=False)
        self.db.row_factory = sqlite3.Row
        self.lock = threading.Lock()
        with self.lock:
            self.db.executescript(SCHEMA)

    def _exec(self, sql: str, params: tuple = ()) -> sqlite3.Cursor:
        with self.lock:
            cur = self.db.execute(sql, params)
            self.db.commit()
            return cur

    def _all(self, sql: str, params: tuple = ()) -> list[dict]:
        with self.lock:
            return [dict(r) for r in self.db.execute(sql, params).fetchall()]

    # --- publicaciones ---
    def add_post(self, caption: str, pillar: str | None = None, hint: str | None = None,
                 media_type: str | None = None, media_file_id: str | None = None) -> int:
        cur = self._exec(
            "INSERT INTO posts (created_at, pillar, hint, media_type, media_file_id, caption)"
            " VALUES (?, ?, ?, ?, ?, ?)",
            (iso(utcnow()), pillar, hint, media_type, media_file_id, caption),
        )
        return cur.lastrowid

    def get_post(self, post_id: int) -> dict | None:
        rows = self._all("SELECT * FROM posts WHERE id = ?", (post_id,))
        return rows[0] if rows else None

    def update_post(self, post_id: int, **fields) -> None:
        cols = ", ".join(f"{k} = ?" for k in fields)
        self._exec(f"UPDATE posts SET {cols} WHERE id = ?", (*fields.values(), post_id))

    def due_posts(self, now: datetime) -> list[dict]:
        return self._all(
            "SELECT * FROM posts WHERE status = 'approved' AND scheduled_at <= ? ORDER BY scheduled_at",
            (iso(now),),
        )

    def open_brief(self, since: datetime, pillar: str | None = None) -> dict | None:
        """Brief pendiente más antiguo desde `since` (opcionalmente de una rúbrica)."""
        sql = "SELECT * FROM posts WHERE status = 'brief' AND created_at >= ?"
        params: tuple = (iso(since),)
        if pillar:
            sql += " AND pillar = ?"
            params += (pillar,)
        rows = self._all(sql + " ORDER BY id LIMIT 1", params)
        return rows[0] if rows else None

    def scheduled_posts(self) -> list[dict]:
        return self._all("SELECT * FROM posts WHERE status = 'approved' ORDER BY scheduled_at")

    def taken_slots(self) -> set[datetime]:
        return {datetime.fromisoformat(p["scheduled_at"]) for p in self.scheduled_posts()}

    # --- leads ---
    def add_lead(self, channel: str, user_id: str, name: str, text: str, keyword: str | None) -> None:
        self._exec(
            "INSERT INTO leads (channel, user_id, name, text, keyword, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (channel, str(user_id), name, text, keyword, iso(utcnow())),
        )

    def has_lead_since(self, channel: str, user_id: str, since: datetime) -> bool:
        return bool(self._all(
            "SELECT 1 FROM leads WHERE channel = ? AND user_id = ? AND created_at >= ? LIMIT 1",
            (channel, str(user_id), iso(since)),
        ))

    def recent_leads(self, limit: int = 10) -> list[dict]:
        return self._all("SELECT * FROM leads ORDER BY id DESC LIMIT ?", (limit,))

    # --- estado ---
    def kv_get(self, key: str) -> str | None:
        rows = self._all("SELECT value FROM kv WHERE key = ?", (key,))
        return rows[0]["value"] if rows else None

    def kv_set(self, key: str, value: str) -> None:
        self._exec("INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)", (key, value))

    def kv_del(self, key: str) -> None:
        self._exec("DELETE FROM kv WHERE key = ?", (key,))
