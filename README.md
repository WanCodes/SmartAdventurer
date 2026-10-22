# Smart Adventurer

Educational top-down adventure where math questions open the road.

**Wan Yau** · London · [WanCodes](https://github.com/WanCodes)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6)](https://www.typescriptlang.org/)
[![Phaser](https://img.shields.io/badge/Phaser-3-222222)](https://phaser.io/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF)](https://vite.dev/)

## Overview

Smart Adventurer is a browser game about walking a small world and answering generated arithmetic. [Phaser](https://phaser.io/) draws the map and the characters. A side panel, written as plain DOM, holds the study atlas, dialogue, questions, character creator, and shop.

The chapter is one path. Elder Rowan in the village asks an addition or subtraction question. Nia, on the path, asks another so the east gate can open. Beyond it are the Moss Wolf and the Bramble Boar, and the Grove Warden waits in the trees. Clearing the grove finishes the chapter. Progress stays in this browser under the `localStorage` key `smart-adventurer-save`.

The map names what each land is for: the village for adding and subtracting, the road for multiplying and larger sums, and the grove for dividing and ratios. The question you receive follows your level. See [Tech](#tech).

Visuals are pixel art drawn at runtime, so hair, skin, tunic dye, and equipped gear match the save. The committed image, [`public/sprites/tiles.png`](public/sprites/tiles.png), is the tile sheet written by `npm run sprites`.

## Features

- Top-down exploration on a 40×34 map of 32px tiles, with grass, path, water, houses, a gate, and a grove.
- Character creator with four hair styles, five hair colors, four skin tones, and six tunic dyes. Mara’s shop can reopen it.
- Multiple-choice questions with a countdown, a hint that spends one hint charge, and a short explanation after you answer.
- Village lessons repeat until the answer is right. In a battle, a wrong answer or a timeout costs health, and a correct answer damages the creature.
- Three encounters. A win pays gold and experience. A loss keeps the gold you already have, adds a small payout, refills health, and walks you back to the village.
- Shop with six pieces. Point at a piece to preview it, then buy it with gold once your level is high enough.
- Study atlas for the current land, the next step in the chapter, level, health, gold, hints, and answer streak.
- Keyboard and an on-screen pad. Below 800px the lesson panel stacks under the map.
- Short Web Audio tones for a correct answer, a miss, and a level-up.

### Gear

| Piece | Slot | Cost | Unlocks at | Effect |
| --- | --- | --- | --- | --- |
| Wool cap | Hat | 15g | Level 1 | +4 max health |
| Traveler tunic | Tunic | 25g | Level 2 | Victories pay 15% more gold |
| Oak staff | Staff | 40g | Level 3 | +1 damage |
| Feathered hat | Hat | 50g | Level 4 | +1 hint charge |
| Grove cloak | Tunic | 70g | Level 5 | +8 max health |
| Lantern staff | Staff | 90g | Level 6 | +1 damage and +1 hint charge |

Max health starts at 10 and gains 2 per level, before gear. Damage starts at 1. Experience to the next level is `20 + (level - 1) * 15`. Gaining a level refills health.

## Tech

| Layer | Detail |
| --- | --- |
| Language | TypeScript, strict, target ES2022 (`typescript` `^5.8.3`) |
| Game | Phaser 3 with arcade physics (`phaser` `^3.88.2`) |
| App shell | Vite 6 (`vite` `^6.3.5`), `base: "./"` |
| UI | DOM lesson panel in [`src/ui/overlay.ts`](src/ui/overlay.ts) and [`src/style.css`](src/style.css) |
| Save | `localStorage`, key `smart-adventurer-save` |
| Audio | Web Audio oscillators in [`src/game/sfx.ts`](src/game/sfx.ts) |

A fresh `npm install` from the lockfile resolves Phaser 3.90.0, TypeScript 5.9.3, and Vite 6.4.3. The package name is `smart-adventurer`, version `0.1.0`, and `"private": true`.

Question bands in [`src/math/generator.ts`](src/math/generator.ts):

| Level | Questions |
| --- | --- |
| 1–2 | Addition and subtraction |
| 3–4 | Multiplication, or larger sums |
| 5–6 | Exact division, or a fraction of a whole |
| 7 and above | Word problems, including ratios |

Elder Rowan always uses level 1, with a 30 second timer. Nia uses your current level (at least 1), with 25 seconds. Battles use your level plus a bump — wolf +0, boar +1, warden +2 — with 20 seconds.

## Architecture

```
src/main.ts                   Phaser.Game and the scene list
src/game/scenes/BootScene.ts  Paint tiles, tree, and creatures, then open the title
src/game/scenes/TitleScene.ts Continue, or create a look and a new save
src/game/scenes/WorldScene.ts Movement, NPCs, the gate, and launching battles
src/game/scenes/BattleScene.ts Turn-based questions against one creature
src/game/map/worldMap.ts      Character-grid map, collision, lands, and markers
src/math/generator.ts         Procedural questions and band names
src/progression/              Save shape, gear, experience, and gold
src/ui/overlay.ts             Lesson panel
src/art/                      Palette and pixel painter shared by the world and the portrait
scripts/paint-sprites.mjs     Writes public/sprites/tiles.png
```

`BootScene` paints the tileset into a Phaser canvas texture named `tiles`, then starts `TitleScene`. Continue loads a save when the stored JSON has a numeric `level` and a `quests` object. New game builds a save from the creator and writes it.

`WorldScene` moves the hero with arcade physics and follows with the camera. Interact talks to the nearest person within 72px. An uncleared creature within 46px can be challenged, and walking within 28px starts the fight. The world pauses and launches `BattleScene` with the same save object. When the battle emits `battle-finished`, the world repaints the hero, fades cleared creatures, and writes the save.

The east gate is a tile swap. After Nia’s question, gate tiles become path tiles and drop collision.

[`scripts/paint-sprites.mjs`](scripts/paint-sprites.mjs) writes the PNG with Node’s `zlib`, with no extra dependency. `dev` and `build` run it first. Scenes paint their own textures from [`src/art/paint.ts`](src/art/paint.ts) so customization stays on the same palette.

## Getting started

Install [Node.js](https://nodejs.org/) 18, 20, or 22 or newer (the engines range Vite 6 declares) and use the npm that ships with it. This repo includes `package-lock.json`.

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. The dev server is pinned to that port (`strictPort: true` in [`vite.config.ts`](vite.config.ts)).

```bash
npm run build
npm run preview
```

`build` regenerates the sprite sheet, typechecks `src/` with `tsc --noEmit`, and writes the production bundle to `dist/`. Paths are relative (`base: "./"`), so the folder can be opened from a static host. `preview` serves `dist/` at <http://localhost:4173>.

### Play

| Action | Keyboard | On screen |
| --- | --- | --- |
| Move | Arrow keys, or W A S D | Direction pad |
| Talk, or start a challenge | E | Talk |

A Talk prompt appears beside Elder Rowan, Nia, and Mara. A Challenge prompt appears beside a creature you have not cleared. The east road stays shut until Nia’s question is answered.

On the title screen, **Continue** resumes the save in this browser. **New game** replaces `smart-adventurer-save`. Clearing site data for this origin removes it.

## Scripts

Defined in [`package.json`](package.json):

| Script | What it runs |
| --- | --- |
| `npm run sprites` | `node scripts/paint-sprites.mjs` |
| `npm run dev` | `npm run sprites && vite` |
| `npm run build` | `npm run sprites && tsc --noEmit && vite build` |
| `npm run preview` | `vite preview` |

## License

This repository has no license file. Copyright Wan Yau. All rights reserved.
