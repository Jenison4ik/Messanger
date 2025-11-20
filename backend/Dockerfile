FROM debian:bookworm AS build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libasio-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN cmake -S . -B build -DCMAKE_BUILD_TYPE=Release && \
    cmake --build build --config Release

FROM debian:bookworm-slim
WORKDIR /srv/app

COPY --from=build /app/build/main /usr/local/bin/messanger
COPY templates ./templates

EXPOSE 18080
CMD ["messanger"]