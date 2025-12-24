import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import dotenv from 'dotenv';

dotenv.config();

export async function getMcpTools() {
  const client = new MultiServerMCPClient({
    web_search: {
      transport: 'http',
      url: 'https://dashscope.aliyuncs.com/api/v1/mcps/WebSearch/mcp',
      headers: {
        Authorization: `Bearer ${process.env.ALI_CLOUD_API_KEY || ''}`,
      },
    },
  });
  const tools = await client.getTools();
  return tools;
}
