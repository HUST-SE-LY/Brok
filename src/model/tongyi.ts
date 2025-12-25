import { ChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';

dotenv.config();
export const qwenModel = new ChatOpenAI({
  // 此处以qwen-plus为例，您可按需更换模型名称。模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
  model: 'qwen-max',
  apiKey: process.env.ALI_CLOUD_API_KEY || '',
  configuration: {
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  },
  modelKwargs: {
    enable_search: true,
    search_options: {
      forced_search: true,
    },
  },
  temperature: 1.3,
  // other params...
});
