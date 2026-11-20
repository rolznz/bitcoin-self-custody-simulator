# Notes for agents

The whole app is one file, `index.html`, with no build step. See [PURPOSE.md](PURPOSE.md) for what it is for.

## Where things are in the file

- `<style>`: all the CSS, including light and dark themes. The two long `@font-face` lines at the end are the embedded fonts.
- `<script>`, above the `//--UI--` line: the model. Disasters and their chances, the theft and loss scoring, effort, control, and recommendations.
- `<script>`, below the `//--UI--` line: the five screens, the scoreboard, the panels and the click handling.

Do not print or read the two `@font-face` lines in full: together they are about 130 KB of base64, half the file.
