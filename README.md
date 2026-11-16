# Relay

**Turn a task you know into a guide someone else can follow.**

Relay is a browser-local authoring tool for branching, photo-supported instructions. Write an action, ask a question where the task splits, and give each route an ending. Export one HTML file that a recipient can open without an account, installation, or internet connection.

Built for shared equipment, student clubs, team handoffs, and repeatable everyday tasks. Included guides are editable examples, not verified procedures for particular equipment or organizations.

## Try it

Public website: https://rp-relay.vercel.app

1. Open **Make a guide**. Start from an example or choose **New guide**.
2. Write the instructions. For a question, connect each answer to its next step.
3. Add a photo where useful, with a text description.
4. Resolve the route checker’s errors, then **Try this guide**.
5. Download an **Offline guide** to hand over. Download **Backup JSON** to keep an editable copy.

The offline file contains its own text, photos, styling, and execution engine. Recipients can follow branches, go back to change an answer, leave notes, and download a walkthrough record. Notes are held in the current tab until exported; refreshing loses them.

## Run locally

Requires Node.js 22 or newer. The application and core tests have no third-party runtime dependencies.

```sh
npm start
# Open http://127.0.0.1:4464
```

Download the source ZIP from the website, unzip it, and run the command inside its folder. For development:

```sh
npm run build       # regenerate the standalone offline runtime
npm test            # core graph, import, snapshot and export tests
npm run evaluate    # deterministic generated graph evaluation
```

For optional browser tests, install development dependencies and Chrome:

```sh
npm install
npm run test:browser # keep npm start running in a second terminal
```

Browser tests use the installed Google Chrome channel through Playwright. They test file downloads in disposable directories, use isolated browser storage, and write `docs/browser-results.json`. They do not upload guides.

## Command line

```sh
node cli.mjs check my-guide.json
node cli.mjs export my-guide.json my-guide.html
```

`check` prints validation results and the content’s SHA-256 fingerprint. `export` refuses to overwrite an existing destination. Both commands reject unfinished or invalid routes. Build the offline runtime after changing player or engine source.

## How it works

- **Directed acyclic graph:** steps are actions, decisions, or endings. The validator checks IDs, edges, choice cardinality, reachability, cycles, text limits, and image constraints. Every valid path reaches an explicit ending.
- **Snapshot execution:** starting a walkthrough copies the validated guide. Later draft edits cannot change an in-progress run. Going back truncates the abandoned path.
- **Portable runtime:** the build concatenates the engine and player into a browser script. Export embeds that script, the reader stylesheet, sanitized guide data, and raster images into a single HTML document. No service worker or external asset is required.
- **Versioned records:** SHA-256 covers the normalized guide JSON. A record includes the exact revision, chosen route, notes, and client-side timestamps. This is content identification, **not an authenticated signature or proof of completed work**.
- **Local storage:** IndexedDB stores up to 30 drafts on this browser. No account, server database, telemetry SDK, or paid AI service is involved. Photos are decoded and re-encoded on the device, limited to 1,280 pixels on their longest edge and under 500 KB as a data URL.
- **Draft recovery:** unfinished guides can be backed up and imported without passing route validation. Execution and offline export require a valid graph. Imported guides receive a fresh ID so they cannot replace existing drafts.

## Developer API

The engine is an ordinary ES module usable in browsers or Node:

```js
import {
  parseGuide, inspect, createRun, advanceRun, backRun, revision, receipt
} from './public/core.mjs';

const guide = parseGuide(jsonText);
const check = inspect(guide);
let run = createRun(guide);
run = advanceRun(run, 0, 'My note'); // zero-based choice index
const fingerprint = await revision(guide);
```

See [the format guide](docs/format.md), [design brief](docs/design.md), and [verification notes](docs/verification.md).

## Boundaries

Guides can contain up to 80 steps, 2–4 answers per decision, and 6 MB of UTF-8 JSON. Browser storage can be cleared or unavailable: keep backups. Use one editing tab at a time; there is no multi-tab merge or collaborative editing. Offline-guide files are copies, so later changes do not update someone else’s download. Text and photos are included in the file you share.

Relay checks structure, not whether instructions are accurate or appropriate. Test a guide with its intended reader. There has been no user study, independent accessibility audit, or formal security certification. This release does not claim global novelty.

MIT licensed. Created by Rishit Pradhan.
