import axios from 'axios';
import { bvidToAvid } from '../utils/bvidToAvid';
import { tool } from 'langchain';
import z from 'zod';
export var Type;
(function (Type) {
    Type[Type["Video"] = 1] = "Video";
    Type[Type["Opus"] = 17] = "Opus";
})(Type || (Type = {}));
export async function replyComment(params) {
    const { type, oid, root, parent, message } = params;
    const csrf = process.env.CSRF || '';
    let targetOid = oid;
    if (type === Type.Video &&
        (String(oid)?.startsWith('BV') || String(oid)?.startsWith('bv'))) {
        targetOid = bvidToAvid(String(oid));
    }
    const res = await axios.post('https://api.bilibili.com/x/v2/reply/add', new URLSearchParams({
        type: String(type),
        oid: String(targetOid),
        root: String(root),
        parent: String(parent),
        message,
        csrf,
        plat: String(1),
    }), {
        headers: {
            Cookie: `bili_jct=${csrf};SESSDATA=${process.env.SESSDATA || ''}`,
        },
    });
    console.log('回复评论的结果:', res.data);
    return res.data?.code === 0 ? '回复成功' : '回复失败';
}
export const replyCommentTool = tool(replyComment, {
    name: 'replyComment',
    description: '用于回复BILIBILI平台上用户at你的消息',
    schema: z.object({
        type: z.number().describe('评论区的类型，有两种取值，如果是视频评论区，则为1，如果是动态评论区，则为17'),
        oid: z.string().describe('如果是动态评论区，传入动态的id，如果是视频评论区，传入视频的bvid或者avid'),
        root: z.number().describe('根评论的ID'),
        parent: z.number().describe('父评论的ID'),
        message: z.string().describe('回复的消息内容'),
    }),
});
