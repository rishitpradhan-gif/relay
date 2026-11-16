# Verification

The initial release runs 19 core and CLI tests covering graph validity, reachability, cycles, malformed inputs, draft round trips, snapshot isolation, backtracking, version hashes, receipt contents, and script-delimiter escaping.

`npm run evaluate` uses a fixed unsigned 32-bit LCG seed (271828) to construct 100 DAGs of 6–80 nodes. It executes ten routes per graph against direct edge lookup, checks round-trip/version invariants, and rejects 200 deliberately cyclic or broken-link mutations. The checked-in result records **1,000 completed routes and 9,050 transitions**. This is a structural stress test, not a user or field study.

The Chrome browser suite covers both hero branches; create/edit/photo persistence; walkthrough notes and backtracking; receipt downloads; an exported single-file guide with the network disabled; draft backup/import; hostile HTML-like input; desktop/tablet/phone width checks; and uncaught errors/third-party requests. See `browser-results.json` for the actual checked run. The valid image fixture is created by the browser’s PNG encoder.

An initial browser test failed because its hand-written PNG fixture could not be decoded. The application surfaced the decoder error correctly. The fixture was replaced with a browser-generated PNG; the full suite then passed. No runtime upload failure was hidden or converted to a success.

The isolated test contexts do not contain user guides. Screenshots use the included examples. Browser tests require Google Chrome and Playwright as development tooling. Screen-reader testing, cross-browser testing, adversarial security review, multi-person usability studies, and durability across browser storage eviction are not completed.

The developer CLI writes output with exclusive creation, avoiding accidental overwrite of an existing file. The static host has no application API to upload user content; host infrastructure can still receive normal page-request logs.

GitHub accepted repository creation but rejected installing the Actions workflow because the existing OAuth connection lacks the `workflow` scope. No permissions were changed. `github-actions-example.yml` is an optional configuration example, not an active CI job. All reported checks were executed locally.
