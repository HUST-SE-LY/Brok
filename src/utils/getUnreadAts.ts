import { axiosInstance } from './axios';
import { Type } from '../tools/replyComment';
import { thumbsUpComment, thumbsUpVideo } from './thumbsUp';

async function getUnreadNums() {
  const res = await axiosInstance.get(
    'https://api.vc.bilibili.com/x/im/web/msgfeed/unread'
  );
  const unreadAtNums = res.data?.data?.at || 0;
  const unreadReplyNums = res.data?.data?.reply || 0;
  return {
    unreadAtNums,
    unreadReplyNums,
  };
}

export async function getUnreadReplyAndAts() {
  const { unreadAtNums, unreadReplyNums } = await getUnreadNums();
  const replyItems = await getUnreadReplys(unreadReplyNums);
  const atItems = await getUnreadAts(unreadAtNums);
  return [...replyItems, ...atItems];
}

export async function getUnreadReplys(unreadReplyNums: number) {
  if (unreadReplyNums === 0) {
    return [];
  }
  const res = await axiosInstance.get(
    'https://api.bilibili.com/x/msgfeed/reply'
  );
  const replyItems =
    res.data?.data?.items
      ?.slice(0, unreadReplyNums)
      ?.filter(
        (item: any) =>
          item?.item?.business_id === Type.Video ||
          item?.item?.business_id === Type.Opus
      ) || [];
  const resText = await Promise.all(replyItems.map(getAtInfo));
  return resText;
}

export async function getUnreadAts(unreadAtNums: number) {
  if (unreadAtNums === 0) {
    return [];
  }
  const res = await axiosInstance.get('https://api.bilibili.com/x/msgfeed/at');
  const atItems =
    res.data?.data?.items
      ?.slice(0, unreadAtNums)
      ?.filter(
        (item: any) =>
          item?.item?.business_id === Type.Video ||
          item?.item?.business_id === Type.Opus
      ) || [];

  const resText = await Promise.all(atItems.map(getAtInfo));
  return resText;
}

export const getAtInfo = async (at: any) => {
  const item = at?.item || {};
  const businessId = item?.business_id || '';
  if (businessId !== Type.Video && businessId !== Type.Opus) {
    return '在既不是视频评论区也不是动态评论区中被at了，无需回复，终止任务';
  }
  let oid;
  if (businessId === Type.Video) {
    oid = item.subject_id || '';
  } else {
    oid = item.uri.split('#')?.[0]?.split('/')?.pop() || '';
  }
  const parent = item.source_id || '';
  const root = item.target_id || item.source_id || '';
  const sourceContent = item?.source_content || '';
  const typeText = businessId === Type.Video ? '视频评论区' : '动态评论区';
  // 点赞评论
  await thumbsUpComment({
    oid,
    rpid: parent,
    type: businessId,
  });
  if (businessId === Type.Video) {
    // 点赞视频
    await thumbsUpVideo({
      aid: oid,
    });
  }
  return `用户在${typeText}中@了你，内容为:${sourceContent}。这个${typeText}的oid为${oid}，根评论的id(root)为${root}，要回复的评论id(parent)为${parent}`;
};
