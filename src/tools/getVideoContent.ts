import axios from 'axios';
import dotenv from 'dotenv';
import { getWbiParams } from '../utils/wbi';
import { downloadWithHeaders } from '../utils/download';
import { extractAudio, getMediaDuration } from '../utils/media';
import { transcribeAudio } from '../utils/transcribe';
import { tool } from 'langchain';
import z from 'zod';
import { readFileSync } from 'fs';
import OpenAI from 'openai';

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
    let duration = Number.POSITIVE_INFINITY;
    try {
      duration = await getMediaDuration(videoPath);
    } catch {}
    if (duration <= 120) {
      const videoSummary = await getAIVideoSummary({ path: videoPath });
      return `视频UP主名：${owner}\n视频标题：${title}\n发布时间：${new Date(
        pubdate * 1000
      ).toLocaleString()}\n视频简介：${desc}\n视频文本内容：${transcript}\n视频AI总结：${videoSummary}`;
    }
    return `视频UP主名：${owner}\n视频标题：${title}\n发布时间：${new Date(
      pubdate * 1000
    ).toLocaleString()}\n视频简介：${desc}\n视频文本内容：${transcript}`;
  }
};

export const getAIVideoSummary = async (params: { path: string }) => {
  try {
    const { path } = params;
    const videoFile = readFileSync(path);
    const base64 = videoFile.toString('base64');
    const openai = new OpenAI({
      // 若没有配置环境变量，请用百炼API Key将下行替换为：apiKey: "sk-xxx"
      // 新加坡和北京地域的API Key不同。获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
      apiKey: process.env.ALI_CLOUD_API_KEY,
      // 以下是北京地域base_url，如果使用新加坡地域的模型，需要将base_url替换为：https://dashscope-intl.aliyuncs.com/compatible-mode/v1
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    });
    const completion = await openai.chat.completions.create({
      model: 'qwen-vl-plus',
      messages: [
        {
          role: 'user',
          content: [
            {
              // 直接传入视频文件时，请将type的值设置为video_url
              // @ts-ignore
              type: 'video_url',
              video_url: { url: `data:video/mp4;base64,${base64}` },
            },
            { type: 'text', text: '请总结视频的主要内容' },
          ],
        },
      ],
    });
    if (completion.choices[0].message.content) {
      console.log(completion.choices[0].message.content);
      return completion.choices[0].message.content;
    } else {
      return '视频内容总结失败';
    }
  } catch (err) {
    console.log('视频内容总结时出错:', err);
    return '视频内容总结失败';
  }
};

export const getVideoTextContentTool = tool(getVideoTextContent, {
  name: 'get_video_text_content',
  description:
    '提取视频文本内容的工具，输入视频的avid，输出视频的内容（包括视频标题、发布时间、视频简介和视频文本内容），参数必须要传入视频的avid（oid）',
  schema: z.string().describe('视频的avid'),
});
