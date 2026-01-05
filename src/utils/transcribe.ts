import fs from 'fs';
import axios from 'axios';
import { randomUUID } from 'crypto';

function toBase64(filePath: string) {
  const buf = fs.readFileSync(filePath);
  return buf.toString('base64');
}

export async function transcribeAudio(audioPath: string) {
  try {
    const appid = process.env.VOLC_APP_ID || '';
    const token = process.env.VOLC_ACCESS_TOKEN || '';
    const resourceId = process.env.VOLC_RESOURCE_ID || 'volc.bigasr.auc_turbo';
    const modelName = process.env.VOLC_MODEL_NAME || 'bigmodel';
    if (!appid || !token) {
      return { text: null };
    }
    const headers = {
      'X-Api-App-Key': appid,
      'X-Api-Access-Key': token,
      'X-Api-Resource-Id': resourceId,
      'X-Api-Request-Id': randomUUID(),
      'X-Api-Sequence': '-1',
    };
    const data = {
      user: { uid: appid },
      audio: { data: toBase64(audioPath) },
      request: { model_name: modelName },
    };
    const url =
      'https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash';
    const res = await axios.post(url, data, { headers });
    const text = res.data?.result?.text || null;
    return text || '';
  } catch (err) {
    console.log('语音识别时出错:', err);
    return '';
  }
}
