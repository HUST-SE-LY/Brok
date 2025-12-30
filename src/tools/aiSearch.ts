import { tool } from 'langchain';
import OpenAI from 'openai';
import z from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  // 若没有配置环境变量，请用百炼API Key将下行替换为：apiKey: "sk-xxx",
  apiKey: process.env.ALI_CLOUD_API_KEY,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

export const aiSearch = async (query: string) => {
  const completion = await openai.chat.completions.create({
    model: 'qwen-max',
    messages: [
      {
        role: 'system',
        content:
          '你是一个专业的搜索助手,请根据用户的问题搜索互联网,并返回你总结过的搜索结果字符串,搜索结果需要保证简洁，准确。如果搜索不到相关内容，直接告诉用户，不要自己推测或者编造',
      },
      { role: 'user', content: query },
    ],
    temperature: 0.6,
    //@ts-ignore
    enable_search: true,
    search_options: {
      forced_search: true, // 强制联网搜索
    },
  });
  return completion.choices[0].message.content;
};

export const aiSearchTool = tool(aiSearch, {
  name: 'web_search',
  description: '根据用户的问题搜索互联网，返回总结过的搜索结果字符串',
  schema: z.string().describe('用户的问题'),
});
