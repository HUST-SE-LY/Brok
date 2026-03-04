import dotenv from 'dotenv';
import { generateUuid } from '../utils/generateUuid';
import { axiosInstance } from '../utils/axios';
import { tool } from 'langchain';
import z from 'zod';
dotenv.config();

export async function sendMsgToUser(
  input: {
    mid: string,
    msg: string,
  }
) {
  const { mid, msg } = input;
  let needTip = true;
  // 先确认一下用户是不是自己的粉丝，如果是的话，就不需要额外的说明了
  const res = await axiosInstance.get('https://api.bilibili.com/x/web-interface/relation', {
    params: {
      mid,
    }
  })
  if(res.data?.data?.be_relation?.attribute === 1 || res.data?.data?.be_relation?.attribute === 6) {
    needTip = false;
  }
  const { CSRF: csrf } = process.env;
  if (!csrf) {
    throw new Error('csrf is required');
  }
  const formData = new URLSearchParams();
  formData.append("msg[sender_uid]", String(process.env.SENDER_UID));
  formData.append("msg[receiver_id]", String(mid));
  formData.append("msg[receiver_type]", "1");
  formData.append("msg[msg_type]", "1");
  formData.append("msg[msg_status]", "0");
  formData.append("msg[content]", JSON.stringify({
    content: msg + (needTip ? '\n\n[doge]未关注前只能发送一条消息，如需继续接收消息请回复或关注，如已回复请忽略，暂不支持私信聊天喔～' : ''),
  }));
  formData.append("msg[timestamp]", String(Math.floor(Date.now() / 1000)));
  formData.append("msg[new_face_version]", "0");
  formData.append("msg[dev_id]", generateUuid());
  formData.append("from_firework", "0");
  formData.append("build", "0");
  formData.append("mobi_app", "web");
  formData.append("csrf_token", csrf);
  formData.append("csrf", csrf);

  const response = await axiosInstance.post(
    "https://api.vc.bilibili.com/web_im/v1/web_im/send_msg",
    formData,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  console.log(response.data)

  return response.data;
}

export const sendMsgToUserTool = tool(sendMsgToUser, {
  name: 'send_msg_to_user',
  description: '发送私信给用户',
  schema: z.object({
    mid: z.string().describe('用户的mid'),
    msg: z.string().describe('要发送的消息'),
  }),
});