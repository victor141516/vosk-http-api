import { Model, Recognizer, WordResult } from 'vosk'
import { existsSync } from 'fs'
import { Readable } from 'stream'
import wav from 'wav'
import path from 'path'

export class VoiceRecorderError {
  message: string
  constructor(msg: string) {
    this.message = msg
  }
}
export class MissingLanguageModelVoiceRecorderError extends VoiceRecorderError {}

export type VoiceRecognizerItemType = 'result' | 'partial'
export interface VoiceRecognizerItem {
  type: VoiceRecognizerItemType
  text: string
  words?: WordResult[]
}

export interface RecognizeOptions {
  splitWords?: boolean
  yieldPartials?: boolean
}

export class VoiceRecognizer {
  private modelsBasePath: string
  private models: Record<string, Model> = {}

  constructor(modelsBasePath: string) {
    this.modelsBasePath = modelsBasePath
    process.on('exit', () => this.shutdown())
  }

  getModel(language: string) {
    if (!this.models[language]) {
      const modelPath = path.join(this.modelsBasePath, language)
      if (!existsSync(modelPath))
        throw new MissingLanguageModelVoiceRecorderError(`Model for language ${language} not found.`)
      this.models[language] = new Model(modelPath)
    }
    return this.models[language]
  }

  async *recognize(
    wavStream: Readable,
    language: string,
    { splitWords = false, yieldPartials = false }: RecognizeOptions,
  ): AsyncGenerator<VoiceRecognizerItem> {
    const wfReader = new wav.Reader()
    const wfReadable = new Readable().wrap(wfReader)

    const recPromise = new Promise<Recognizer>((res, rej) => {
      wfReader.on('format', async ({ audioFormat, sampleRate, channels }) => {
        const rec = new Recognizer({ model: this.getModel(language), sampleRate })
        if (audioFormat != 1 || channels != 1) {
          rej(new Error('Audio file must be WAV format mono PCM.'))
        } else {
          res(rec)
        }
      })
    })
    wavStream.pipe(wfReader)
    const rec = await recPromise
    rec.setWords(splitWords)
    rec.setPartialWords(splitWords)
    let lastPartialTs: number | null = -1

    for await (const data of wfReadable) {
      const endOfSpeech = await rec.acceptWaveformAsync(data)
      if (endOfSpeech) {
        const res = rec.result()
        if (res.text.length === 0) continue

        yield {
          type: 'result',
          text: res.text,
          words: res.result,
        }
      } else {
        const res = rec.partialResult()
        if (!yieldPartials) continue

        const words = (res.partial_result ?? []).filter((w) => lastPartialTs === null || w.end > lastPartialTs)
        lastPartialTs = res.partial_result?.at(-1)?.end ?? null
        if (words.length === 0) continue

        yield {
          type: 'partial',
          text: res.partial,
          words,
        }
      }
    }
    const res = rec.finalResult()
    if (res.text.length > 0) {
      yield {
        type: 'result',
        text: res.text,
        words: res.result,
      }
    }
    rec.free()
  }

  async shutdown() {
    Object.values(this.models).forEach((m) => m.free())
  }
}
