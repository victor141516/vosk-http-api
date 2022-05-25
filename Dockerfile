# TODO: this is a temporal fix because the provided lib is not updated
FROM python:3.10 as vosk-lib-downloader
RUN pip install vosk && cp /usr/local/lib/python3.10/site-packages/vosk/libvosk.so /libvosk.so

FROM node:18 as binaries-installed
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
  ffmpeg \
  liba52-0.7.4 \
  libaribb24-0 \
  libavcodec58 \
  libcodec2-0.9 \
  libdca0 \
  libdvbpsi10 \
  libfaad2 \
  libflac8 \
  libmad0 \
  libmp3lame0 \
  libmpcdec6 \
  libmpeg2-4 \
  libmpg123-0 \
  libopus0 \
  libshine3 \
  libspatialaudio0 \
  libspeex1 \
  libtheora0 \
  libtwolame0 \
  libvdpau1 \
  libvorbis0a \
  libvorbisenc2 \
  libvorbisfile3 \
  libvpx6 \
  libwavpack1 \
  libx264-160 \
  libxvidcore4 \
  libzvbi-common \
  libzvbi0 \
  && npm i --no-package-lock --no-save https://gitpkg.now.sh/alphacep/vosk-api/nodejs?master \
  && mkdir -p /app/node_modules/vosk/lib/linux-x86_64
# TODO: this is a temporal fix because the provided lib is not updated
COPY --from=vosk-lib-downloader /libvosk.so /app/node_modules/vosk/lib/linux-x86_64/libvosk.so

FROM binaries-installed as deps-installed
COPY package.json package-lock.json ./
RUN npm i
COPY . .

FROM deps-installed as dev
CMD ["npm", "run", "start"]

FROM deps-installed as builder
RUN npm run build

FROM binaries-installed
WORKDIR /app
ENV NODE_PATH=/app
COPY package.json package-lock.json ./
RUN npm i
COPY --from=vosk-lib-downloader /libvosk.so /app/node_modules/vosk/lib/linux-x86_64/libvosk.so
COPY --from=builder /app/dist ./
CMD ["node", "./index.js"]