import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
ffmpeg.setFfmpegPath(ffmpegPath);
export async function extractAudio(inputPath, outputPath) {
    const dir = path.dirname(outputPath);
    console.log('dir', dir);
    await fs.promises.mkdir(dir, { recursive: true });
    await new Promise((resolve, reject) => {
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
