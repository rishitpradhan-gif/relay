# Guide and record formats

A guide uses `schema: "relay-guide/1"`, a stable `id`, `title`, `description`, `start` step ID, and `steps` array. A step contains `id`, `type`, `title`, `body`, `image`, `alt`, and `choices`. Each choice has a `label` and destination `to`.

Step types:

- `action`: exactly one choice.
- `decision`: two to four choices.
- `end`: no choices.

All fields are plain text except the image, which is either empty or a base64 PNG, JPEG, or WebP data URL. HTML and Markdown are not interpreted. Images require nonempty alternative text before execution. External image addresses and SVG images reject. This restricts active/external content; a syntactically valid base64 raster is not a guarantee that an image decoder can display it.

`inspect(guide)` returns `ok`, `errors`, and, for structurally well-formed routes, step/ending counts. `cleanGuide` normalizes the supported field order and drops extra fields. `parseGuide` enforces the UTF-8 input size before parsing. Passing `{draft:true}` allows unfinished text, missing links, loops, and unreachable steps to be restored, but still enforces the basic format, bounded sizes, types, and raster-image syntax. Never execute a draft without full validation.

`createRun` validates and copies a guide. `advanceRun` and `backRun` return a new run rather than modifying the prior run. A run’s `path` contains step IDs, notes, and the zero-based choice taken; the current step has a null choice. The player only marks `finished_at` when the reader finishes an ending and downloads the record.

`relay-receipt/1` records the normalized guide’s SHA-256, chosen titles/answers, notes, and browser-supplied times. It contains no raw photos. This is a self-reported record. A hash identifies content but does not authenticate the author, establish that an action happened, or verify the clock.

The exported HTML’s CSP blocks network connections and permits only embedded raster images. It needs inline script/style to work as a single local file. Do not substitute untrusted JavaScript as the `runtime` argument to the developer export helper: it is trusted application code, not guide data.
