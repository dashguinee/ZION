import ffmpeg from 'fluent-ffmpeg';
import config from '../config.js';
import logger from '../utils/logger.js';
import cacheService from './cache.service.js';
import { PassThrough } from 'stream';

class FFmpegService {
  /**
   * Transcode video to MP4 (for VOD)
   * Returns a readable stream of transcoded video
   */
  async transcodeToMP4(sourceUrl, quality = '720p') {
    const qualityConfig = config.qualities[quality];

    if (!qualityConfig) {
      throw new Error(`Invalid quality: ${quality}`);
    }

    logger.info(`Transcoding to MP4: ${quality} from ${sourceUrl.substring(0, 100)}...`);

    const outputStream = new PassThrough();

    ffmpeg(sourceUrl)
      .outputOptions([
        '-c:v libx264',                    // H.264 video codec
        '-preset fast',                     // Fast encoding
        '-crf 23',                          // Quality (lower = better, 23 is good)
        `-b:v ${qualityConfig.bitrate}`,   // Video bitrate
        `-s ${qualityConfig.width}x${qualityConfig.height}`, // Resolution
        '-c:a aac',                         // AAC audio codec
        '-b:a 128k',                        // Audio bitrate
        '-movflags frag_keyframe+empty_moov', // Enable streaming
        '-f mp4'                            // Output format
      ])
      .on('start', (cmd) => {
        logger.debug(`FFmpeg command: ${cmd}`);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          logger.debug(`Transcoding progress: ${progress.percent.toFixed(1)}%`);
        }
      })
      .on('error', (err) => {
        logger.error(`FFmpeg error: ${err.message}`);
        outputStream.destroy(err);
      })
      .on('end', () => {
        logger.info('Transcoding completed');
      })
      .pipe(outputStream, { end: true });

    return outputStream;
  }

  /**
   * Transcode video to HLS (for adaptive streaming)
   * Generates multiple quality levels and master playlist
   */
  async transcodeToHLS(sourceUrl, streamId) {
    const cacheKey = `hls:${streamId}`;

    // Check if already transcoded
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.info(`HLS cache HIT: ${streamId}`);
      return cached;
    }

    logger.info(`Transcoding to HLS: ${streamId}`);

    // Output directory for HLS segments
    const outputDir = `/tmp/hls/${streamId}`;

    return new Promise((resolve, reject) => {
      ffmpeg(sourceUrl)
        .outputOptions([
          '-c:v libx264',
          '-preset fast',
          '-c:a aac',
          '-b:a 128k',
          '-f hls',
          '-hls_time 6',                    // 6-second segments
          '-hls_list_size 0',               // Keep all segments in playlist
          '-hls_segment_filename', `${outputDir}/segment_%03d.ts`,
          // Multi-bitrate variant streams
          '-map 0:v:0', '-map 0:a:0',
          '-b:v:0', '4000k', '-s:v:0', '1920x1080', // 1080p
          '-map 0:v:0', '-map 0:a:0',
          '-b:v:1', '2500k', '-s:v:1', '1280x720',  // 720p
          '-map 0:v:0', '-map 0:a:0',
          '-b:v:2', '1000k', '-s:v:2', '854x480',   // 480p
          '-map 0:v:0', '-map 0:a:0',
          '-b:v:3', '600k', '-s:v:3', '640x360',    // 360p
          '-var_stream_map', 'v:0,a:0 v:1,a:1 v:2,a:2 v:3,a:3',
          '-master_pl_name', 'master.m3u8'
        ])
        .output(`${outputDir}/playlist_%v.m3u8`)
        .on('start', (cmd) => {
          logger.debug(`FFmpeg HLS command: ${cmd}`);
        })
        .on('error', (err) => {
          logger.error(`FFmpeg HLS error: ${err.message}`);
          reject(err);
        })
        .on('end', async () => {
          logger.info('HLS transcoding completed');

          const result = {
            masterPlaylist: `${outputDir}/master.m3u8`,
            outputDir,
            streamId
          };

          // Cache HLS info for 24 hours
          await cacheService.set(cacheKey, result, config.cache.segmentTTL);

          resolve(result);
        })
        .run();
    });
  }

  /**
   * Probe video file to get metadata (duration, format, codecs)
   */
  async probeVideo(sourceUrl) {
    logger.info(`Probing video: ${sourceUrl.substring(0, 100)}...`);

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(sourceUrl, (err, metadata) => {
        if (err) {
          logger.error(`FFprobe error: ${err.message}`);
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

        const info = {
          duration: metadata.format.duration,
          size: metadata.format.size,
          format: metadata.format.format_name,
          bitrate: metadata.format.bit_rate,
          video: videoStream ? {
            codec: videoStream.codec_name,
            width: videoStream.width,
            height: videoStream.height,
            fps: eval(videoStream.r_frame_rate) // Convert "30/1" to 30
          } : null,
          audio: audioStream ? {
            codec: audioStream.codec_name,
            sampleRate: audioStream.sample_rate,
            channels: audioStream.channels
          } : null
        };

        logger.info(`Probe complete: ${info.format}, ${info.duration}s, ${info.video?.width}x${info.video?.height}`);
        resolve(info);
      });
    });
  }

  /**
   * Check if a video format needs transcoding
   */
  needsTranscoding(format, codec) {
    // Browser-compatible formats don't need transcoding
    const webFormats = ['mp4', 'webm'];
    const webCodecs = ['h264', 'vp8', 'vp9'];

    if (webFormats.includes(format?.toLowerCase())) {
      if (codec && webCodecs.includes(codec.toLowerCase())) {
        return false;
      }
    }

    // Everything else needs transcoding
    return true;
  }
}

export default new FFmpegService();
