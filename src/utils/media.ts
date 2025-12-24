import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

ffmpeg.setFfmpegPath(ffmpegPath as string);

export async function extractAudio(inputPath: string, outputPath: string) {
  const dir = path.dirname(outputPath);
  console.log('dir', dir);
  await fs.promises.mkdir(dir, { recursive: true });
  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec('aac')
      .audioBitrate('128k')
      .save(outputPath)
      .on('end', () => resolve())
      .on('error', reject);
  });
  return outputPath;
}
