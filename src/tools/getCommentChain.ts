import { axiosInstance } from '../utils/axios';
import { Type } from './replyComment';
import { bvidToAvid } from '../utils/bvidToAvid';
import { tool } from 'langchain';
import z from 'zod';

interface GetReplyChainOptions {
  oid: string;
  type: Type;
  rootId: number;
  targetRpid: number;
}

type ReplyNode = {
  rpid: number;
  parent: number;
  root: number;
  member?: { uname?: string };
  content?: { message?: string };
  ctime?: number;
  replies?: ReplyNode[];
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const PAGE_DELAY_MS = Number(process.env.PAGE_DELAY_MS || '400');

const fetchRootComment = async (params: {
  oid: string | number;
  type: Type;
  rootId: number;
}): Promise<ReplyNode | null> => {
  const { oid, type, rootId } = params;
  let pn = 1;
  const ps = 20;
  let total = Number.POSITIVE_INFINITY;
  while ((pn - 1) * ps < total) {
    const res = await axiosInstance.get('https://api.bilibili.com/x/v2/reply', {
      params: {
        oid,
        type: String(type),
        pn,
        ps,
        sort: 0,
        nohot: 1,
      },
    });
    const page = res.data?.data?.page || {};
    // console.log(page);
    total = Number(page?.count || total);
    const list = (res.data?.data?.replies || []) as ReplyNode[];
    const found = list.find((it) => Number(it?.rpid) === Number(rootId));
    if (found) return found;
    await delay(PAGE_DELAY_MS);
    pn += 1;
    if (!Array.isArray(list) || list.length === 0) break;
  }
  return null;
};

const fetchRepliesUnderRoot = async (params: {
  oid: string | number;
  type: Type;
  rootId: number;
  targetRpid?: number;
}): Promise<{
  root: ReplyNode | null;
  replies: ReplyNode[];
  found: boolean;
}> => {
  const { oid, type, rootId, targetRpid } = params;
  let pn = 1;
  const ps = 20;
  const all: ReplyNode[] = [];
  let root: ReplyNode | null = null;
  let found = false;
  while (true) {
    const res = await axiosInstance.get(
      'https://api.bilibili.com/x/v2/reply/reply',
      {
        params: {
          oid,
          type: String(type),
          root: String(rootId),
          pn,
          ps,
        },
      }
    );
    // console.log(res.data?.data.replies)
    if (!root) root = (res.data?.data?.root || null) as ReplyNode | null;
    const list = (res.data?.data?.replies || []) as ReplyNode[];
    all.push(...list);
    const hasTarget = (items: ReplyNode[]): boolean => {
      for (const it of items) {
        if (Number(it.rpid) === Number(targetRpid)) return true;
        if (Array.isArray(it.replies) && it.replies.length) {
          if (hasTarget(it.replies)) return true;
        }
      }
      return false;
    };
    if (typeof targetRpid === 'number' && hasTarget(list)) {
      found = true;
      break;
    }
    if (!Array.isArray(list) || list.length < ps) break;
    await delay(PAGE_DELAY_MS);
    pn += 1;
    if (pn > 200) break;
  }
  return { root, replies: all, found };
};

export const getCommentChain = async (opts: GetReplyChainOptions) => {
  try {
    const { oid, type, rootId, targetRpid } = opts;
    let targetOid: string | number = oid;
    if (
      type === Type.Video &&
      (String(oid).startsWith('BV') || String(oid).startsWith('bv'))
    ) {
      targetOid = bvidToAvid(String(oid));
    }
    const { root, replies } = await fetchRepliesUnderRoot({
      oid: targetOid,
      type,
      rootId,
      targetRpid,
    });
    const flatten = (items: ReplyNode[]): ReplyNode[] => {
      const out: ReplyNode[] = [];
      for (const it of items) {
        out.push(it);
        if (Array.isArray(it.replies) && it.replies.length) {
          out.push(...flatten(it.replies));
        }
      }
      return out;
    };
    const all = flatten(replies);
    const idx = new Map<number, ReplyNode>();
    for (const it of all) idx.set(Number(it.rpid), it);
    if (root) idx.set(Number(root.rpid), root);

    const chain: ReplyNode[] = [];
    let current = Number(targetRpid);
    let guard = 0;
    while (guard < 500) {
      guard += 1;
      const node = idx.get(current);
      if (!node) break;
      chain.push(node);
      if (Number(node.rpid) === Number(rootId)) break;
      current = Number(node.parent);
      if (!current || current === node.rpid) break;
    }
    if (root && !chain.find((n) => Number(n.rpid) === Number(rootId))) {
      chain.push(root);
    }
    const ordered = chain.reverse();
    return JSON.stringify(
      ordered.map((n) => ({
        uname: n.member?.uname || '',
        message: n.content?.message || '',
      })) || []
    );
  } catch (e) {
    console.error('获取评论链失败', e);
    return '获取评论链失败';
  }
};

export const getCommentChainTool = tool(getCommentChain, {
  name: 'get_comment_chain',
  description: '获取从评论区根评论到指定评论的回复树',
  schema: z.object({
    oid: z.string().describe('视频的avid或动态的ID'),
    type: z
      .enum(Type)
      .describe(
        '评论区类型，视频评论区或动态评论区，视频评论区为1，动态评论区为17'
      ),
    rootId: z.number().describe('根评论的ID'),
    targetRpid: z.number().describe('指定评论的ID'),
  }),
});
