# Notes for agents

The app ships as one self-contained file, `index.html`, built from `src/`. See [PURPOSE.md](PURPOSE.md) for what it is for.

## Where things are

- `src/index.html`: the page skeleton. It loads the files below, so it also runs as it is in a browser.
- `src/styles.css`: all the CSS, including light and dark themes.
- `src/model.js`: the model. Disasters and their chances, the theft and loss scoring, effort, control, and recommendations. It doesn't touch the DOM.
- `src/ui.js`: the five screens, the scoreboard, the panels and the click handling.
- `src/fonts/`: the two fonts, which the build embeds as base64.
- `build.js`: inlines everything into `index.html`.

## Rules

- Edit `src/`, never `index.html`. Run `node build.js` after every change and commit `index.html` with the source. `node build.js --check` tells you whether it is current.
- Don't read or print `index.html`: half of it is base64 font data.
- `index.html` must stay self-contained: no network requests, no external files.
