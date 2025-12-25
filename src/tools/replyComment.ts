import { axiosInstance } from '../utils/axios';
import { bvidToAvid } from '../utils/bvidToAvid';
import { tool } from 'langchain';
import z from 'zod';

export enum Type {
  Video = 1,
  Opus = 17,
}

interface ReplyCommentParams {
  type: Type;
  oid: number | string;
  root: number;
  parent: number;
  message: string;
}

export async function replyComment(params: ReplyCommentParams) {
  const { type, oid, root, parent, message } = params;
  const csrf = process.env.CSRF || '';
  let targetOid = oid;
  if (
    type === Type.Video &&
    (String(oid)?.startsWith('BV') || String(oid)?.startsWith('bv'))
  ) {
    targetOid = bvidToAvid(String(oid));
  }
  const res = await axiosInstance.post(
    'https://api.bilibili.com/x/v2/reply/add',
    new URLSearchParams({
      type: String(type),
      oid: String(targetOid),
      root: String(root),
      parent: String(parent),
      message,
      csrf,
      plat: String(1),
    })
  );
  console.log('回复评论的结果:', res.data);
  return res.data?.code === 0 ? '回复成功' : '回复失败';
}

export const replyCommentTool = tool(replyComment, {
  name: 'replyComment',
  description: '用于回复BILIBILI平台上用户at你的消息',
  schema: z.object({
    type: z
      .number()
      .describe(
        '评论区的类型，有两种取值，如果是视频评论区，则为1，如果是动态评论区，则为17'
      ),
    oid: z
      .string()
      .describe(
        '如果是动态评论区，传入动态的id，如果是视频评论区，传入视频的bvid或者avid'
      ),
    root: z.number().describe('根评论的ID'),
    parent: z.number().describe('父评论的ID'),
    message: z.string().describe('回复的消息内容'),
  }),
});
