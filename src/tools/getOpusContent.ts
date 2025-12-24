import axios from "axios";
import { tool } from "langchain";
import z from "zod";

export async function getOpusContent({
  dynamic_id,
}: {
  dynamic_id: string;
}) {
  const res = await axios.get('https://api.bilibili.com/x/polymer/web-dynamic/v1/detail', {
    params: {
      id: dynamic_id,
    },
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      Referer: "https://www.bilibili.com",
      Cookie: `SESSDATA=${process.env.SESSDATA || ""}`,
    },
  })
  if(res.data?.data?.item?.type !== 'DYNAMIC_TYPE_WORD') {
    return "该动态不是文字动态";
  }
  console.log(JSON.stringify(res.data?.data?.item, null, 2))
  return res.data?.data?.item?.modules?.module_dynamic?.desc?.text || "该动态暂无文字内容";
}

export const getOpusContentTool = tool(getOpusContent, {
  name: "get_opus_content",
  description: `根据动态的ID获取动态的文字内容，如果动态不是文字动态，则会返回"该动态不是文字动态"，如果动态没有文字内容，则会返回"该动态暂无文字内容"`,
  schema: z.object({
    dynamic_id: z.string().describe("动态的ID"),
  }),
})
