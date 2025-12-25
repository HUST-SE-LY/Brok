import axios from 'axios';
import { Type } from '../tools/replyComment';

async function getUnreadAtNums() {
  const res = await axios.get('https://api.vc.bilibili.com/x/im/web/msgfeed/unread', {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      Referer: 'https://www.bilibili.com',
      Cookie: `SESSDATA=${process.env.SESSDATA || ''}`,
    },
  })
  return res.data?.data?.at || 1;
}

export async function getUnreadAts() {
  const unreadAtNums = await getUnreadAtNums();
  if(unreadAtNums === 0) {
    return [];
  }
  const res = await axios.get('https://api.bilibili.com/x/msgfeed/at', {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      Referer: 'https://www.bilibili.com',
      Cookie: `SESSDATA=${process.env.SESSDATA || ''}`,
    },
  });
  const atItems = res.data?.data?.items?.slice(0, unreadAtNums)?.filter((item: any) => item?.item?.business_id === Type.Video || item?.item?.business_id === Type.Opus) || [];
  
  return atItems.map(getAtInfo);
}

export const getAtInfo = (at: any) => {
  const item = at?.item || {};
  const businessId = item?.business_id || '';
  if(businessId !== Type.Video && businessId !== Type.Opus) {
    return '在既不是视频评论区也不是动态评论区中被at了，无需回复，终止任务';
  }
  const oid = item.subject_id || '';
  const parent = item.source_id || '';
  const root = item.target_id || item.source_id || '';
  const sourceContent = item?.source_content || '';
  const typeText = businessId === Type.Video ? '视频评论区' : '动态评论区';
  return `用户在${typeText}中@了你，内容为:${sourceContent}。这个${typeText}的oid为${oid}，根评论的id(root)为${root}，要回复的评论id(parent)为${parent}`
}
