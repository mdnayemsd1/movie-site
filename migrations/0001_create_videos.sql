CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK(length(title) <= 120),
  url TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ','now')
  )
);

CREATE INDEX IF NOT EXISTS idx_videos_created_at
ON videos(created_at DESC);
