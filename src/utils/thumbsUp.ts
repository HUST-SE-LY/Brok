import { axiosInstance } from './axios';
import { Type } from '../tools/replyComment';

interface ThumbsUpCommentParams {
  oid: string;
  type: Type;
  rpid: number;
}

export const thumbsUpComment = async (params: ThumbsUpCommentParams) => {
  const csrf = process.env.CSRF || '';
  try {
    const res = await axiosInstance.post(
      'https://api.bilibili.com/x/v2/reply/action',
      new URLSearchParams({
        oid: params.oid,
        type: String(params.type),
        rpid: String(params.rpid),
        csrf,
        action: '1',
      })
    );
    console.log('点赞评论的结果:', res.data);
    if (res.data?.code === 0) {
      return '点赞成功';
    } else {
      throw new Error(`点赞失败: ${res.data}`);
    }
  } catch (err) {
    console.log('点赞评论时出错:', err);
  }
};

interface ThumbsUpVideoParams {
  aid: string;
}

export const thumbsUpVideo = async (params: ThumbsUpVideoParams) => {
  const csrf = process.env.CSRF || '';
  try {
    const res = await axiosInstance.post(
      'https://api.bilibili.com/x/web-interface/archive/like',
      new URLSearchParams({
        aid: params.aid,
        csrf,
        like: '1',
      })
    );
    console.log('点赞视频的结果:', res.data);
    if (res.data?.code === 0) {
      return '点赞成功';
    } else {
      throw new Error(`点赞失败: ${res.data}`);
    }
  } catch (err) {}
};
