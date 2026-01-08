import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'data');
fs.mkdirSync(dir, { recursive: true });
const dbPath = path.join(dir, 'brok.sqlite');
const db = new Database(dbPath);
db.exec('CREATE TABLE IF NOT EXISTS video_content_cache (avid TEXT PRIMARY KEY, content TEXT NOT NULL, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)');

export function getCachedVideoContent(avid: string) {
  const row = db.prepare('SELECT content FROM video_content_cache WHERE avid = ?').get(avid) as { content: string } | undefined;
  return row?.content || null;
}

export function setCachedVideoContent(avid: string, content: string) {
  if (!content || !content.trim()) return;
  db.prepare('INSERT INTO video_content_cache (avid, content, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(avid) DO UPDATE SET content = excluded.content, updated_at = CURRENT_TIMESTAMP').run(avid, content);
}

