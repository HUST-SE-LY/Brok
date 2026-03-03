import dotenv from 'dotenv';

dotenv.config();

import { getUnreadAts, getUnreadReplyAndAts } from './utils/getUnreadAts';
import { createDeepseekAgent } from './agent';
import { FileCallbackHandler } from './utils/logging';
import fs from 'fs/promises';
import path from 'path';
import { getBuvid } from './utils/getBuvid';
import { setBuvids } from './utils/axios';
import { getVideoTextContent } from './tools/getVideoContent';
import { qwenModel } from './model/tongyi';
import { getOpusContent } from './tools/getOpusContent';
import { getCommentChain } from './tools/getCommentChain';
import { Type } from './tools/replyComment';

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || '10000');
let timer: ReturnType<typeof setTimeout> | null = null;
let processing = false;
export let buvid3 = '';
export let buvid4 = '';

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
  if (!buvid3 || !buvid4) {
    const buvid = await getBuvid();
    buvid3 = buvid.buvid3;
    buvid4 = buvid.buvid4;
    setBuvids(buvid3, buvid4);
    console.log('获取到新的buvid3和buvid4', buvid3, buvid4);
  }
  const unreads = await getUnreadReplyAndAts();
  if (unreads.length === 0) {
    console.log('没有新的消息');
    timer = setTimeout(tick, POLL_INTERVAL_MS);
    return;
  }
  processing = true;
  try {
    await runBatch(unreads);
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
