# The landing screen

The plan for the first screen. It is built one step at a time, and each step is approved before the next starts.

## The idea

The headline says "Take self-custody for a test drive", so the screen shows one. A car that is a hardware wallet on wheels, driven by a bitcoin coin with a face, drives in from behind the hills and pulls up in front of the player.

1. An empty road, hills, the sea and the sun, for a moment.
2. The car jumps up from behind the front hill, nose up, wheels spinning.
3. It lands on the road facing the player, squashes, bounces back, and dust bursts out at the wheels.
4. The headline and the "Get started" button appear, either when the entrance ends or as soon as the player clicks or taps anywhere.
5. The car idles: wheels turning, body bobbing.
6. On "Get started" the car drives off toward the player and the next screen follows.

The whole entrance takes under two seconds. An earlier version had the car drive in along the distant road first; that was dropped because it was hard to make convincing.

## Style

- The scene fills the whole first screen.
- Soft, rounded shapes with gentle top-to-bottom gradients. No outlines.
- Bright and positive: a blue sky, a sun with rays, puffy clouds, distant mountains and the sea, lime-green hills with bushy trees, a fence and roadside posts.
- Dark mode is the same scene at night: moon, stars, headlights on.
- Bouncy motion. Everything overshoots and settles.
- The car faces the player. It is modelled on the orange SeedSigner case: a pill-shaped body with a dark screen and three stacked buttons, headlights at each end, wheels underneath. No logo or name. The coin sits behind it holding the steering wheel, with dust puffs at the wheels.
- Simple and cartoony beats detailed. Where the reference is painterly, a cleaner shape is fine.
- The "Get started" button has a thick dark border and a hard drop shadow, and presses down when clicked.

## Rules

- Inline SVG, CSS and a little script only. No libraries, no image files, no network requests.
- The scenery is a painted drawing. Only the car is 3D: it is built from flat panels by `buildCar()` in `src/ui.js`, so it can turn with the road. Its jump is set by hand in the `sc-move`, `sc-pitch` and `sc-yaw` keyframes in `src/styles.css`.
- Reduced motion: the car is already parked and the text is already there.
- The player never has to wait. A click or tap skips to the end of the entrance. Keys don't.
- It must work on a phone held upright.

## Checklist

- [x] 1. Still frame: the scene and the car, in light and dark.
- [x] 2. Entrance: the jump over the front hill, the bounce, wheels spinning. Text appears at the end or on a click.
- [ ] 3. Idle: the car bobs and sways, the coin blinks, glances about and waves now and then, the dust drifts away. Clouds drift, the sun's rays turn, the sea glints, a sailboat and two birds cross. (Built, waiting for approval.)
- [ ] 4. Reactions: tap the car and it hops. Hover "Get started" and it revs and the coin looks over. (Built, waiting for approval.)
- [ ] 5. Exit: on "Get started" the car drives off toward the player, then the next screen opens. (Built, waiting for approval.)
- [ ] 6. Fit: check on a real phone, in Safari and Firefox.

Not built: swaying trees and grass, a small car on the distant road.

## Text

As little as possible: the headline with a pen-drawn double underline under "test drive", the privacy line and the button. Nothing on this screen refers to the player's real bitcoin.
