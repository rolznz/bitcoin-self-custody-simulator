# Bitcoin self-custody simulator

Build a pretend bitcoin custody setup, throw disasters at it, and see which small changes would make your real one safer, without spending any money or effort. For the reasoning behind it, see [PURPOSE.md](PURPOSE.md).

🔒 Nothing is sent or saved; all state lives in the page and resets on reload.

**[Try it here](https://rolznz.github.io/bitcoin-self-custody-simulator/)**

The whole app is one file: `index.html`. It has no build step, no backend and no dependencies to install.

## Run it

Open `index.html` in a browser.

The page makes no outbound network requests and has no external dependencies: no CDNs, no analytics, no remote scripts, styles or images. It works offline. Its two fonts (Bricolage Grotesque and Figtree, both under the SIL Open Font License) are embedded in the file.

## Things to know

- Every probability in the model is an estimate, not data. They are the first thing to review.
- Coins are pretend. The app never asks for a seed or passphrase.
