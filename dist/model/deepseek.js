import { ChatDeepSeek } from "@langchain/deepseek";
import dotenv from 'dotenv';
dotenv.config();
console.log('DEEPSEEK_API_KEY', process.env.DEEPSEEK_API_KEY);
export const deepseekModel = new ChatDeepSeek({
    model: "deepseek-chat",
    temperature: 1.3,
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    // other params...
});
