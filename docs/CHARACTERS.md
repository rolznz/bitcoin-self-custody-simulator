# The characters

On the map, "You" is a well-known bitcoiner: a photo of their head, cut out like a sticker, on a small drawn body. Tapping yourself opens a card with something the person really said, one of our jokes about them, and the other faces to pick from. It is only for fun and changes nothing in the model.

Everything lives in `src/map.js`: `CHARS` lists the characters and `figure()` draws them. The heads are in `src/img/head-<id>.webp`.

## Adding a character

1. **Find a photo.** The face should look at the camera and fill most of the frame. Around 300 pixels wide is plenty; below 150 it turns soft. Don't add the photo to the repository.

2. **Cut out the head.** Open the photo in any image viewer and note four numbers, in pixels: the middle of the head (`cx`, `cy`), half its width (`rx`) and half its height (`ry`). Include the hair, the chin and any beard. Then run:

   ```
   python3 tools/head.py photo.png <id> <cx> <cy> <rx> <ry>
   ```

   This writes `src/img/head-<id>.webp`: an oval 168 pixels tall with a white edge, on a transparent background, about 5 KB. It also prints the width, which the next step needs. Look at the result and adjust the numbers until the oval sits well. It needs Pillow (`pip install pillow`).

   The oval is on purpose. It hides the background without having to trace around hair, and it looks like a sticker. Proper background removal can replace it later without changing anything else, as long as the picture stays 168 tall.

3. **Add the character to `CHARS`.**

   - `name`: shown in the card's heading.
   - `by`: shown under the quote. Add the year or the place when it is known.
   - `head`: the file, and the width that `tools/head.py` printed.
   - `skin`: the colour for hands, and for arms and legs that show.
   - `quote`: see the rule below.
   - `jokes`: one or more lines of ours. One is shown each time the card opens.
   - `up`: set to 1 to raise the left arm.

4. **Dress them.** Add an entry with the same id to `body` inside `figure()`. The parts are `legs(colour, shoes, bare)`, `arms(sleeve, short, width)`, `torso(fill)` and `suit(jacket, shirt, tie, tieLength)`; draw anything else on top. Feet are at (0, 0) and the collar is at about y = -46. The head is drawn last, 60 tall, and covers the neck.

5. **Build and look.** Run `node build.js`, open `index.html`, tap yourself and pick the new face. Check the figure both with and without something in its hand.

## Rules

- **Quotes are real.** `quote` is shown in quotation marks under the person's name, so it must be something they said or wrote, word for word. Check it against a source, ideally the original post, talk or essay, and never invent or reword one. If no quote can be confirmed, leave the character out.
- **Jokes are ours.** `jokes` are written about the character, in the narrator's voice. They never appear in quotation marks and are never put in the person's mouth. Keep them affectionate.
- **Nothing is asked of the player.** Picking a face is pretend, like picking a setup.

## Where the current quotes come from

| Character | Quote | Source |
|---|---|---|
| Satoshi Nakamoto | "If you don't believe me or don't get it, I don't have time to try to convince you, sorry." | A forum post from 2010. |
| Hal Finney | "Running bitcoin" | A tweet from January 2009. |
| Jack Dorsey | "Bitcoin changes absolutely everything." | Said at the Bitcoin 2021 conference; reported by CNBC. |
| Michael Saylor | "There is no second best." | The title of a video on Strategy's own website. |
| Saifedean Ammous | "Bitcoin is the hardest money ever invented." | His book The Bitcoin Standard (2018), as quoted in Reason's review. |
| Andreas M. Antonopoulos | "Not your keys, not your coins." | He has said he coined it. No transcript of the first use was found. |
| Adam Back | "Bitcoin is Hashcash extended with inflation control." | His Twitter profile, seen only as quoted by others. |
| Robert Breedlove | "Bitcoin is the most superior monetary technology that has ever existed." | Not confirmed word for word. A summary of his Lex Fridman Podcast appearance (#176) has him calling bitcoin "the most superior monetary technology ever created". |

The last three are the weakest and are the first to replace if better-sourced quotes turn up.
