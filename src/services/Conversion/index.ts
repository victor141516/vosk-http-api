import ffmpeg from 'fluent-ffmpeg'
import { PassThrough, Readable } from 'node:stream'

export function getAudioStream(originalStream: Readable) {
  const passStream = new PassThrough()
  ffmpeg(originalStream)
    .withAudioCodec('pcm_s16le')
    .withAudioChannels(1)
    .format('wav')
    .writeToStream(passStream, { end: true })
  const readStream = Readable.from(passStream)
  return readStream
}
