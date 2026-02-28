import dotenv from 'dotenv';
dotenv.config();

import { transcribeAudio } from './src/utils/transcribe';
import path from 'path';

async function testTranscribe() {
  try {
    const testFilePath = path.join(process.cwd(), 'downloads', '115831274996854.m4a');
    console.log('开始语音识别测试...');
    console.log('测试文件:', testFilePath);
    
    const text = await transcribeAudio(testFilePath);
    console.log('\n✅ 语音识别完成！');
    console.log('识别结果:', text);
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testTranscribe();
