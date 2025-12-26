import axios from 'axios';
import dotenv from 'dotenv';
import { getWbiParams } from '../utils/wbi';
import { downloadWithHeaders } from '../utils/download';
import { extractAudio } from '../utils/media';
import { transcribeAudio } from '../utils/transcribe';
import { tool } from 'langchain';
import z from 'zod';

dotenv.config();


const getVideoBaseInfo = async (params: { avid: string }) => {
  const { avid } = params;
  if (!avid) {
    throw new Error('avid is required');
  }

  console.log('avid:', avid);


  const response = await axios.get(
    `https://api.bilibili.com/x/web-interface/view?aid=${avid}`,
    {
      headers: {
        Cookie: `SESSDATA=${process.env.SESSDATA}`,
      },
    }
  );
  console.log(response.data);
  const baseData = response.data?.data;
  return {
    cid: baseData?.cid,
    title: baseData?.title,
    pubdate: baseData?.pubdate,
    desc: baseData?.desc,
    owner: baseData?.owner?.name || '',
  };
};

export const getVideoTextContent = async (avid: string) => {
  if (!avid) {
    throw new Error('avid is required');
  }
  const { cid, title, pubdate, desc, owner } = await getVideoBaseInfo({ avid });
  if (cid) {
    const wbiParams = await getWbiParams({
      avid,
      cid,
      qn: 16,
    });
    console.log(wbiParams);
    // 这个接口家了其他header反而被风控了
    const response = await axios.get(
      `https://api.bilibili.com/x/player/wbi/playurl?${wbiParams}`,
      {
        headers: {
          Cookie: `SESSDATA=${process.env.SESSDATA}`,
        },
      }
    );
    const videoUrl = response.data?.data?.durl?.[0]?.url;
    if (!videoUrl) {
      throw new Error('No video url');
    }
    const videoPath = await downloadWithHeaders(
      videoUrl,
      `downloads/${avid}.mp4`
    );
    const audioPath = await extractAudio(videoPath, `downloads/${avid}.m4a`);
    const transcript = await transcribeAudio(audioPath);
    console.log(
      `视频内容提取工具调用结束，视频UP主名：${owner}\n视频标题：${title}\n发布时间：${new Date(
        pubdate * 1000
      ).toLocaleString()}\n视频简介：${desc}\n视频文本内容：${transcript}`
    );
    return `视频UP主名：${owner}\n视频标题：${title}\n发布时间：${new Date(
      pubdate * 1000
    ).toLocaleString()}\n视频简介：${desc}\n视频文本内容：${transcript}`;
  }
};

export const getVideoTextContentTool = tool(getVideoTextContent, {
  name: 'get_video_text_content',
  description:
    '提取视频文本内容的工具，输入视频的avid，输出视频的内容（包括视频标题、发布时间、视频简介和视频文本内容），参数必须要传入视频的avid（oid）',
  schema: z.string().describe('视频的avid'),
});
