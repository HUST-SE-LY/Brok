import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import ffprobeStatic from 'ffprobe-static';
import path from 'path';
import fs from 'fs';

ffmpeg.setFfmpegPath(ffmpegPath as string);
ffmpeg.setFfprobePath((ffprobeStatic as unknown as { path: string }).path);

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

export async function getMediaDuration(inputPath: string) {
  return await new Promise<number>((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      const d: any = data?.format?.duration;
      const val = typeof d === 'number' ? d : Number(d) || 0;
      resolve(val);
    });
  });
}

export async function trimVideo(inputPath: string, outputPath: string, duration: number) {
  const dir = path.dirname(outputPath);
  await fs.promises.mkdir(dir, { recursive: true });
  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(0)
      .setDuration(duration)
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', reject)
      .run();
  });
  return outputPath;
}
