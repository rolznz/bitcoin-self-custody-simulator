# Notes for agents

The app ships as one self-contained file, `index.html`, built from `src/`. See [PURPOSE.md](PURPOSE.md) for what it is for and [docs/LANDING.md](docs/LANDING.md) for how the first screen works.

## Where things are

- `src/index.html`: the page skeleton. It loads the files below, so it also runs as it is in a browser.
- `src/styles.css`: all the CSS, including light and dark themes.
- `src/model.js`: the model. Disasters and their chances, the theft and loss scoring, effort, control, and recommendations. It doesn't touch the DOM.
- `src/map.js`: draws a setup as a map (you, five places, a cloud, a company) with the things you own on it. `SetupMap.svg(setup)` returns the picture. The landing borrows its character and buildings through `SetupMap.driver()` and `SetupMap.landmark()`. The map can be zoomed and dragged; that is `setMapView` in `src/ui.js`. Cards opened from the map say what a thing is, never what could go wrong with it; risks are revealed by disasters.
- `src/ui.js`: the five screens, the scoreboard, the panels and the click handling. "Use it" is played on the map as well: one errand at a time (a test, a practice recovery, sending the test back, moving the rest), with you walking to the backups and keys; see the comment above `screenUse`. Share shows everybody dancing on the island (`SetupMap.party()`).
- `src/img/`: the pictures, which the build embeds as base64. `head-*.webp` are the heads of the characters you can play as (`CHARS` in `src/map.js`). A character's `quote` must be something the person really said; our own jokes about them go in `jokes`. [docs/CHARACTERS.md](docs/CHARACTERS.md) explains how to add one, using `tools/head.py` to cut out the head.
- `src/fonts/`: the two fonts, which the build embeds as base64.
- `build.js`: inlines everything into `index.html`.

## Rules

- Edit `src/`, never `index.html`. Run `node build.js` after every change and commit `index.html` with the source. `node build.js --check` tells you whether it is current.
- Don't read or print `index.html`: half of it is base64 font data.
- `index.html` must stay self-contained: no network requests, no external files.
- Never ask the user about their real bitcoin: where it is, how much they have, or how they hold it. Stating that nothing is sent or saved does not help; the question itself makes people suspicious. Offer pretend setups to pick from ("Pick a setup to start with") instead of asking them to describe their own ("Where is your bitcoin today?").
