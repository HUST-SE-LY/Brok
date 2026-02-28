import OSS from 'ali-oss';
import fs from 'fs';
import path from 'path';

export async function uploadToOss(filePath: string): Promise<string> {
  const bucket = process.env.OSS_BUCKET || '';
  const client = new OSS({
    region: process.env.OSS_REGION || '',
    accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
    bucket: bucket,
  });

  const fileName = path.basename(filePath);
  const result = await client.put(fileName, filePath, {
    headers: {
      'x-oss-object-acl': 'public-read',
    },
  });

  if(result.url) {
    return result.url;
  } else {
    throw new Error('上传到OSS失败');
  }
}
