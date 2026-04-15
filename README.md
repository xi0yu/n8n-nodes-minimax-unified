# n8n-nodes-minimax-unified

An n8n community node for [MiniMax AI](https://platform.minimaxi.com/). It fixes the `Authorization failed` error seen in older community packages (which hardcode the international endpoint) and adds support for the latest `MiniMax-M2.7` model.

## Features

- **Dual region**: pick `International (api.minimax.io)` or `China (api.minimaxi.com)`. Use the region that matches where your API key was issued.
- **Standard and Coding Plan**: OpenAI-compatible and Anthropic-compatible endpoints are both supported.
- **Custom Base URL**: point to a proxy or private deployment if you need to.
- **Model picker with free-form input**: pick a known model (M2.7, M2.7-highspeed, M2.5, M2.5-highspeed, M2.1, M2.1-highspeed, M2, M2-her) or type any model ID your account supports.
- **Two nodes**:
  - `MiniMax` — standard chat-completion node for regular workflows.
  - `MiniMax Chat Model` — Language Model node for use with AI Agent / Chain. Uses `@langchain/openai` for Standard and `@langchain/anthropic` for Coding Plan.
- **Bearer prefix handled automatically**: paste the raw key; the node adds `Bearer` for you and also strips it if you accidentally paste it in.

## Install

### Option 1: n8n Community Nodes (recommended)

In n8n: **Settings → Community Nodes → Install** and enter:

```
n8n-nodes-minimax-unified
```

### Option 2: Local custom extension

```bash
npm install
npm run build
mkdir -p ~/.n8n/custom
ln -s "$(pwd)" ~/.n8n/custom/n8n-nodes-minimax-unified
# restart n8n
```

## Credentials

Create a credential of type **MiniMax API**:

| Field | Notes |
|---|---|
| Region | `International`, `China`, or `Custom Base URL` |
| Custom Base URL | Only shown when Region = Custom |
| Plan / Flavor | `Standard` (OpenAI-compatible) or `Coding Plan` (Anthropic-compatible) |
| API Key | Paste the raw key. Do **not** include `Bearer ` — it is added automatically |
| Group ID | Optional. Used as a `GroupId` query-string parameter for Standard endpoints |

> Standard keys and Coding Plan keys are **not** interchangeable. Make sure the Plan field matches the key you generated in the MiniMax console.

## Why the older packages failed

- `n8n-nodes-minimax-chat@0.1.10` hardcodes its credential test and supply URL to `https://api.minimax.io/v1/...`. If you registered on the China console (`platform.minimaxi.com`), you get `401 Authorization failed` every time.
- `n8n-nodes-minimax@0.6.0` routes regions correctly but its model list stops at MiniMax-M2.5; M2.7 is missing.

This package merges both: region routing from the first plus the latest model list, plus a free-form model input so new model IDs work out of the box without a package update.

## Build

```bash
npm install
npm run build    # compiles TS, copies icons, into ./dist
npm run verify   # sanity-load compiled nodes and credentials
```

## License

MIT
