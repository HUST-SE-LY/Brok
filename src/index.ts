import dotenv from 'dotenv';

dotenv.config();

import { getUnreadAts } from './utils/getUnreadAts';
import { createQwenAgent, createDeepseekAgent } from './agent';
import { FileCallbackHandler } from './utils/logging';
import fs from 'fs/promises';
import path from 'path';

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || '10000');
let timer: ReturnType<typeof setTimeout> | null = null;
let processing = false;

async function getAgent() {
  return await createDeepseekAgent();
}

async function runBatch(ats: string[]) {
  const agent = await getAgent();
  const logger = new FileCallbackHandler(
    process.env.LANGCHAIN_LOG_PATH || 'logs/langchain.log'
  );
  for (const at of ats) {
    const result = await agent.invoke(
      { messages: [{ role: 'user', content: at }] },
      { callbacks: [logger] }
    );
    console.log(result);
    await clearDownloads();
  }
}

async function clearDownloads() {
  try {
    const dir = path.join(process.cwd(), 'downloads');
    const entries = await fs.readdir(dir, { withFileTypes: true });
    await Promise.all(
      entries.map(async (ent) => {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          await fs.rm(full, { recursive: true, force: true });
        } else {
          await fs.unlink(full).catch(() => {});
        }
      })
    );
  } catch (e) {}
}

async function tick() {
  if (processing) return;
  const ats = await getUnreadAts();
  if (ats.length === 0) {
    console.log('没有新的@消息');
    timer = setTimeout(tick, POLL_INTERVAL_MS);
    return;
  }
  processing = true;
  try {
    await runBatch(ats);
  } catch (e) {
    console.error(e);
  } finally {
    processing = false;
    timer = setTimeout(tick, POLL_INTERVAL_MS);
  }
}

async function main() {
  await tick();
}

main().catch((error) => {
  console.error('Error running agent:', error);
});
