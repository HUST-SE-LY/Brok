import dotenv from 'dotenv';
dotenv.config();

import { uploadToOss } from './src/utils/uploadToOss';
import path from 'path';

async function testUpload() {
  try {
    const testFilePath = path.join(process.cwd(), 'downloads', '115831274996854.m4a');
    console.log('开始上传文件:', testFilePath);
    
    const url = await uploadToOss(testFilePath);
    console.log('✅ 上传成功！');
    console.log('公网访问URL:', url);
  } catch (error) {
    console.error('❌ 上传失败:', error);
  }
}

testUpload();
