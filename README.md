# Bitcoin self-custody simulator

The whole app is one file: `index.html`. It has no build step, no backend and no dependencies to install.

## Run it

Open `index.html` in a browser. Nothing is sent or saved; all state lives in the page and resets on reload.

## Host it

Upload `index.html` to any static host (GitHub Pages, Netlify, Cloudflare Pages, your own server).

For GitHub Pages there is a workflow in `.github/workflows/pages.yml` that publishes `index.html` on every push to `master`. Enable it once in the repository under Settings → Pages → Source: "GitHub Actions".

The page makes no outbound network requests and has no external dependencies: no CDNs, no analytics, no remote scripts, styles or images. It works offline. Its two fonts (Bricolage Grotesque and Figtree, both under the SIL Open Font License) are embedded in the file.

## Where things are in the file

- `<style>`: all the CSS, including light and dark themes. The two long `@font-face` lines at the end are the embedded fonts.
- `<script>`, above the `//--UI--` line: the model. Disasters and their chances, the theft and loss scoring, effort, control, and recommendations.
- `<script>`, below the `//--UI--` line: the five screens, the scoreboard, the panels and the click handling.

## Things to know

- Every probability in the model is an estimate, not data. They are the first thing to review.
- Coins are pretend. The app never asks for a seed or passphrase.
