# vosk-http-api

I took [Vosk](https://github.com/alphacep/vosk-api) and wrapped it in a HTTP API.

## Installation

I made  a Docker image that contains everything needed but the voice models.

You can run it with:

```bash
docker run \
  -v "$(pwd)/models:/app/models" \
  -e PORT=13000 \
  -p 13000:13000 \
  victor141516/vosk-http-api
```

You will need to download the Vosk voice models and put them in the `models` directory, having each of them in a subdirectory named after the language. e.g. `models/esES` will contain the Spanish model:

![image](https://user-images.githubusercontent.com/5548950/170455858-caafe5c1-941e-4ce0-9032-fb2dbcc1fb3d.png)

## Development

TBA

## Example

https://user-images.githubusercontent.com/5548950/170278314-76651f95-bdb8-4566-978c-382fc9ebbe5e.mp4
