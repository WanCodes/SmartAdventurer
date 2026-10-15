import Phaser from "phaser";
import { PALETTE } from "./palette";
import {
  HAIR_COLORS,
  SKIN_COLORS,
  TUNIC_COLORS,
} from "../progression/items";
import type { Appearance } from "../progression/types";

type Ctx = CanvasRenderingContext2D;

function px(ctx: Ctx, x: number, y: number, color: string, size = 2): void {
  ctx.fillStyle = color;
  ctx.fillRect(x * size, y * size, size, size);
}

function fill(ctx: Ctx, color: string, w: number, h: number): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
}

export function paintTileset(scene: Phaser.Scene): void {
  const tile = 32;
  const canvas = scene.textures.createCanvas("tiles", tile * 8, tile);
  if (!canvas) return;
  const ctx = canvas.getContext();

  const grass = (ox: number) => {
    fill(ctx, PALETTE.grass[0], tile, tile);
    ctx.save();
    ctx.translate(ox, 0);
    for (let i = 0; i < 8; i += 1) {
      px(ctx, (i * 5) % 14, (i * 3) % 14, PALETTE.grass[1 + (i % 2)], 2);
    }
    ctx.restore();
  };
  grass(0);

  ctx.save();
  ctx.translate(tile, 0);
  fill(ctx, PALETTE.path[0], tile, tile);
  for (let y = 2; y < 14; y += 5) {
    for (let x = 1; x < 14; x += 4) {
      px(ctx, x, y, PALETTE.path[1]);
    }
  }
  ctx.restore();

  ctx.save();
  ctx.translate(tile * 2, 0);
  fill(ctx, PALETTE.water[0], tile, tile);
  for (let y = 2; y < 14; y += 4) {
    px(ctx, 2, y, PALETTE.water[2]);
    px(ctx, 8, y + 1, PALETTE.water[1]);
  }
  ctx.restore();

  ctx.save();
  ctx.translate(tile * 3, 0);
  fill(ctx, PALETTE.grove[0], tile, tile);
  for (let i = 0; i < 6; i += 1) px(ctx, (i * 4) % 14, (i * 5) % 14, PALETTE.grove[1]);
  ctx.restore();

  ctx.save();
  ctx.translate(tile * 4, 0);
  fill(ctx, PALETTE.wall, tile, tile);
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(0, 0, tile, 6);
  ctx.fillRect(4, 12, 10, 12);
  ctx.fillRect(18, 12, 10, 12);
  ctx.restore();

  ctx.save();
  ctx.translate(tile * 5, 0);
  fill(ctx, PALETTE.grass[0], tile, tile);
  ctx.fillStyle = PALETTE.roof;
  ctx.beginPath();
  ctx.moveTo(0, tile);
  ctx.lineTo(tile / 2, 4);
  ctx.lineTo(tile, tile);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(tile * 6, 0);
  fill(ctx, PALETTE.wood, tile, tile);
  ctx.fillStyle = "#d8c09a";
  ctx.fillRect(6, 0, 4, tile);
  ctx.fillRect(22, 0, 4, tile);
  ctx.restore();

  ctx.save();
  ctx.translate(tile * 7, 0);
  fill(ctx, PALETTE.grass[0], tile, tile);
  ctx.fillStyle = PALETTE.flower[0];
  ctx.fillRect(12, 8, 8, 8);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(14, 10, 4, 4);
  ctx.fillStyle = PALETTE.leaf[0];
  ctx.fillRect(14, 16, 4, 10);
  ctx.restore();

  canvas.refresh();
}

function drawActor(
  ctx: Ctx,
  appearance: Appearance,
  frame: number,
  facing: "down" | "up" | "side",
  hat: number,
  staff: number,
): void {
  const skin = SKIN_COLORS[appearance.skin] ?? SKIN_COLORS[0];
  const hair = HAIR_COLORS[appearance.hairColor] ?? HAIR_COLORS[0];
  const tunic = TUNIC_COLORS[appearance.tunicColor] ?? TUNIC_COLORS[0];
  const o = PALETTE.outline;
  const step = frame % 2 === 1;

  const body = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };

  body(10, 18, 12, 10, tunic);
  body(8, 20, 4, 8, tunic);
  body(20, 20, 4, 8, skin);
  body(11, step ? 28 : 30, 4, step ? 8 : 6, "#3d342c");
  body(17, step ? 30 : 28, 4, step ? 6 : 8, "#3d342c");
  body(10, step ? 34 : 34, 5, 3, "#2a2118");
  body(17, 34, 5, 3, "#2a2118");

  if (facing === "up") {
    body(10, 6, 12, 12, skin);
    body(9, 4, 14, 6, hair);
    if (appearance.hair === 1) body(8, 8, 3, 10, hair);
    if (appearance.hair === 1) body(21, 8, 3, 10, hair);
    if (appearance.hair === 2) body(14, 1, 4, 4, hair);
    if (appearance.hair === 3) body(20, 10, 3, 12, hair);
  } else {
    body(10, 6, 12, 12, skin);
    body(9, 4, 14, 5, hair);
    if (appearance.hair !== 0) body(9, 8, 3, appearance.hair === 2 ? 4 : 8, hair);
    if (appearance.hair === 1 || appearance.hair === 3) body(20, 8, 3, appearance.hair === 3 ? 14 : 8, hair);
    if (facing === "down") {
      body(13, 11, 2, 2, o);
      body(17, 11, 2, 2, o);
    } else {
      body(16, 11, 2, 2, o);
    }
  }

  if (hat === 1) body(8, 2, 16, 4, "#6b442c");
  if (hat === 2) {
    body(8, 3, 16, 3, "#2f6b45");
    body(20, 0, 6, 3, PALETTE.flower[0]);
  }

  if (staff > 0) {
    body(24, 12, 2, 22, staff === 2 ? "#e0b15a" : "#6b442c");
    if (staff === 2) body(22, 8, 6, 6, "#f0d35a");
  }
}

export function paintTree(scene: Phaser.Scene): void {
  const canvas = scene.textures.createCanvas("tree", 32, 48);
  if (!canvas) return;
  const ctx = canvas.getContext();
  ctx.clearRect(0, 0, 32, 48);
  ctx.fillStyle = PALETTE.trunk;
  ctx.fillRect(13, 26, 6, 18);
  ctx.fillStyle = PALETTE.leaf[0];
  ctx.beginPath();
  ctx.arc(16, 18, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.leaf[1];
  ctx.beginPath();
  ctx.arc(12, 16, 6, 0, Math.PI * 2);
  ctx.fill();
  canvas.refresh();
}

export function paintCharacterTextures(
  scene: Phaser.Scene,
  appearance: Appearance,
  hat: number,
  staff: number,
  prefix = "hero",
): void {
  const frames: Array<"down" | "up" | "side"> = ["down", "up", "side"];
  frames.forEach((facing) => {
    for (let frame = 0; frame < 2; frame += 1) {
      const key = `${prefix}-${facing}-${frame}`;
      if (scene.textures.exists(key)) scene.textures.remove(key);
      const canvas = scene.textures.createCanvas(key, 32, 40);
      if (!canvas) continue;
      const ctx = canvas.getContext();
      ctx.clearRect(0, 0, 32, 40);
      drawActor(ctx, appearance, frame, facing, hat, staff);
      canvas.refresh();
    }
  });
}

export function paintCreatures(scene: Phaser.Scene): void {
  const specs = [
    { key: "wolf", body: "#8d6a4a", ear: "#5c4030", accent: "#efe6d6" },
    { key: "boar", body: "#6e5344", ear: "#3d342c", accent: "#e07a9a" },
    { key: "warden", body: "#3e6b48", ear: "#e0b15a", accent: "#f4e7cc" },
  ];
  specs.forEach((spec, index) => {
    const canvas = scene.textures.createCanvas(spec.key, 48, 40);
    if (!canvas) return;
    const ctx = canvas.getContext();
    ctx.clearRect(0, 0, 48, 40);
    ctx.fillStyle = spec.body;
    ctx.fillRect(8, 14, 28, 16);
    ctx.fillRect(30, 8, 12, 12);
    ctx.fillStyle = spec.ear;
    ctx.fillRect(32, 4, 4, 6);
    ctx.fillRect(38, 4, 4, 6);
    ctx.fillStyle = spec.accent;
    ctx.fillRect(36, 12, 3, 3);
    ctx.fillStyle = "#2a2118";
    ctx.fillRect(10, 28, 6, 8);
    ctx.fillRect(26, 28, 6, 8);
    if (index === 2) {
      ctx.fillStyle = "#e0b15a";
      ctx.fillRect(18, 6, 8, 10);
    }
    canvas.refresh();
  });
}

export function paintPortrait(
  canvas: HTMLCanvasElement,
  appearance: Appearance,
  hat: number,
  staff: number,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = 160;
  canvas.height = 180;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#b7d7a8";
  ctx.fillRect(0, 0, 160, 180);
  ctx.save();
  ctx.translate(48, 36);
  ctx.scale(2, 2);
  drawActor(ctx, appearance, 0, "down", hat, staff);
  ctx.restore();
}
