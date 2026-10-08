# Datashare-extension-asr

A Datashare extension to integrate Audio Speech Recognition (ASR). It provides automatic transcription of audio and video documents using speech recognition models, with all processing done locally — no data is sent to third parties.

## Components

This repository contains two components:

- **Extension** (`datashare-extension-asr`) — a Java backend extension that exposes the `/api/asr` endpoints and submits transcription workflows to [Temporal](https://temporal.io/)
- **Plugin** (`datashare-plugin-asr`) — a Vue.js frontend plugin that adds the transcription interface to Datashare (language/model selectors, transcription pages)

The actual speech recognition is performed by ASR workers running in [datashare-python](https://github.com/ICIJ/datashare-python).

## Prerequisites

- Java 21
- Node.js 20
- Maven
- Yarn
- A running Temporal server

## Build

### Extension (Java)

```bash
mvn package
```

The JAR with dependencies is generated at `target/datashare-extension-asr-<version>-jar-with-dependencies.jar`.

### Plugin (frontend)

```bash
cd plugins/asr
yarn install
yarn build
```

The built plugin entry point is `plugins/asr/dist/index.js`.

## Test

### Java tests

```bash
mvn test
```

### Frontend tests

```bash
cd plugins/asr
npx vitest run
```

## Release

Releases are created automatically by CI when a tag is pushed. The release includes:

- `datashare-extension-asr-<version>-jar-with-dependencies.jar` — the backend extension
- `datashare-plugin-asr-<version>.tgz` — the frontend plugin (npm tarball)

The CI also downloads the `available-models.json` file from the corresponding [datashare-python](https://github.com/ICIJ/datashare-python) ASR worker release and bundles it into the extension JAR.
