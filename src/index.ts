import express, { Request, Response } from 'express'
import Joi from 'joi'
import { celebrate, Segments } from 'celebrate'
import { Readable } from 'node:stream'
import { PORT, MODELS_PATH } from 'services/Config'
import { MissingLanguageModelVoiceRecorderError, RecognizeOptions, VoiceRecognizer } from 'services/VoiceRecorder'

const app = express()
const vr = new VoiceRecognizer(MODELS_PATH)

const queryValidator = {
  [Segments.QUERY]: Joi.object({
    language: Joi.string().required(),
    splitWords: Joi.string().valid('true', 'false').default('false'),
    yieldPartials: Joi.string().valid('true', 'false').default('false'),
  }),
}

const requestHandler = async (req: Request<{}, {}, {}, { language: string } & RecognizeOptions>, res: Response) => {
  try {
    vr.getModel(req.query.language)
  } catch (error) {
    if (error instanceof MissingLanguageModelVoiceRecorderError) {
      req.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.write(JSON.stringify({ error: error.message }))
      return res.end()
    }
  }
  req.statusCode = 200
  res.setHeader('Content-Type', 'application/jsonlines+json')
  const stream = Readable.from(req)
  const generator = vr.recognize(stream, req.query.language, req.query)
  for await (const e of generator) res.write(JSON.stringify(e) + '\n')
  res.end()
}

app.post<{}, {}, {}, { language: string } & RecognizeOptions>('*', celebrate(queryValidator), requestHandler)

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`)
})
