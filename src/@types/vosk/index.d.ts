declare module 'vosk' {
  interface WordResult {
    conf: number
    start: number
    end: number
    word: string
  }

  interface RecognitionResults {
    result?: WordResult[]
    text: string
  }

  interface SpeakerResults {
    spk: number[]
    spk_frames: number
  }

  interface BaseRecognizerParam {
    model: Model
    sampleRate: number
  }

  interface GrammarRecognizerParam {
    grammar: string[]
  }

  interface SpeakerRecognizerParam {
    speakerModel: SpeakerModel
  }

  type Result<T> = T extends SpeakerRecognizerParam ? SpeakerResults & RecognitionResults : RecognitionResults

  interface PartialResults {
    partial_result?: WordResult[]
    partial: string
  }

  type Grammar = string[]

  function setLogLevel(level: number): void

  class Model {
    constructor(modelPath: string)
    free(): void
  }

  class SpeakerModel {
    constructor(modelPath: string)
    free(): void
  }

  class Recognizer<T = {}> {
    constructor(param: T & BaseRecognizerParam)
    free(): void
    setMaxAlternatives(maxAlternatives: number): void
    setWords(words: boolean): void
    setPartialWords(partialWords: boolean): void
    setSpkModel(spkModel: SpeakerModel): void
    acceptWaveform(data: Buffer): boolean
    acceptWaveformAsync(data: Buffer): boolean
    resultString(): Result<T>
    result(): Result<T>
    partialResult(): PartialResults
    finalResult(): Result<T>
    reset(): void
  }
}
