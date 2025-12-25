import { axiosInstance } from './axios';
import fs from 'fs';
import path from 'path';

export async function downloadWithHeaders(url: string, outputPath: string) {
  const dir = path.dirname(outputPath);
  await fs.promises.mkdir(dir, { recursive: true });
  const response = await axiosInstance.get(url, {
    responseType: 'stream',
  });
  const writer = fs.createWriteStream(outputPath);
  await new Promise<void>((resolve, reject) => {
    response.data.pipe(writer);
    writer.on('finish', () => resolve());
    writer.on('error', reject);
  });
  console.log(`Downloaded ${url} to ${outputPath}`);
  return outputPath;
}
