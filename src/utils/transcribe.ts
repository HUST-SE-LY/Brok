import axios from 'axios';
import { uploadToOss } from './uploadToOss';

async function submitTranscriptionTask(
  fileUrl: string,
  apiKey: string,
): Promise<string> {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'X-DashScope-Async': 'enable',
  };
  console.log('提交的文件URL:', fileUrl);
  const data = {
    model: 'qwen3-asr-flash-filetrans',
    input: {
      file_url: fileUrl,
    },
    parameters: {
      channel_id: [0],
      language_hints: ['zh', 'en'],
    },
  };

  const url =
    'https://dashscope.aliyuncs.com/api/v1/services/audio/asr/transcription';
  const response = await axios.post(url, data, { headers });
  return response.data.output.task_id;
}

async function pollTaskResult(taskId: string, apiKey: string): Promise<any> {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'X-DashScope-Async': 'enable',
    'Content-Type': 'application/json',
  };

  const url = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;
  const maxRetries = 120;
  let retries = 0;

  while (retries < maxRetries) {
    const response = await axios.post(url, {}, { headers });
    console.log(response.data);
    const taskStatus = response.data.output.task_status;
    console.log('当前任务状态:', taskStatus);

    if (taskStatus === 'SUCCEEDED') {
      console.log('识别成功，res:', response.data);
      return response.data.output.result;
    } else if (taskStatus === 'FAILED') {
      throw new Error('Transcription task failed');
    }

    retries++;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error('Transcription task timed out');
}

async function getTranscriptionText(transcriptionUrl: string): Promise<string> {
  const response = await axios.get(transcriptionUrl);
  const transcripts = response.data.transcripts;
  return transcripts.map((t: any) => t.text).join(' ');
}

export async function transcribeAudio(audioPath: string): Promise<string> {
  try {
    const apiKey = process.env.ALI_CLOUD_API_KEY || '';
    if (!apiKey) {
      console.log('未配置 ALI_CLOUD_API_KEY');
      return '';
    }

    console.log('正在上传音频文件到OSS...');
    const fileUrl = await uploadToOss(audioPath);
    console.log('文件已上传:', fileUrl);

    console.log('正在提交语音识别任务...');
    const taskId = await submitTranscriptionTask(fileUrl, apiKey);
    console.log('任务已提交，task_id:', taskId);

    console.log('正在等待识别结果...');
    const result = await pollTaskResult(taskId, apiKey);

    console.log('正在获取识别文本...');
    const text = await getTranscriptionText(result.transcription_url);
    console.log('识别完成');

    return text || '';
  } catch (err) {
    console.log('语音识别时出错:', err);
    return '';
  }
}
