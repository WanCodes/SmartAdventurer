export const TILE = 32;
export const TILE_GRASS = 0;
export const TILE_PATH = 1;
export const TILE_WATER = 2;
export const TILE_GROVE = 3;
export const TILE_WALL = 4;
export const TILE_ROOF = 5;
export const TILE_GATE = 6;
export const TILE_FLOWER = 7;

export const MAP_WIDTH = 40;
export const MAP_HEIGHT = 34;
const GATE_COLUMN = 16;

const chars: string[][] = Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill("."));

function stamp(x: number, y: number, rows: string[]): void {
  rows.forEach((line, dy) => {
    [...line].forEach((ch, dx) => {
      chars[y + dy][x + dx] = ch;
    });
  });
}

for (let x = 0; x < MAP_WIDTH; x += 1) {
  chars[0][x] = "#";
  chars[MAP_HEIGHT - 1][x] = "#";
}
for (let y = 0; y < MAP_HEIGHT; y += 1) {
  chars[y][0] = "#";
  chars[y][1] = "#";
  chars[y][MAP_WIDTH - 1] = "#";
  chars[y][MAP_WIDTH - 2] = "#";
  chars[y][GATE_COLUMN] = "#";
}

stamp(3, 2, ["rrrr", "wwww", "wwww", "rrrr"]);
stamp(3, 10, ["rrrr", "wwww", "wwww"]);
stamp(4, 6, ["fff"]);
stamp(5, 14, ["fff"]);

for (let x = 4; x < 34; x += 1) chars[8][x] = ",";
chars[8][6] = "P";
chars[8][4] = "V";
chars[8][9] = "S";
chars[8][GATE_COLUMN] = "g";
chars[7][GATE_COLUMN] = "g";
chars[9][GATE_COLUMN] = "g";
chars[5][8] = "E";
chars[8][22] = "1";

for (let y = 12; y <= 14; y += 1) {
  for (let x = 20; x <= 32; x += 1) chars[y][x] = "~";
}
for (let x = 24; x <= 28; x += 1) chars[13][x] = ",";
chars[15][26] = "2";

for (let y = 2; y <= 8; y += 1) {
  for (let x = 24; x <= 36; x += 1) chars[y][x] = "o";
}
for (let y = 3; y <= 6; y += 1) {
  for (let x = 26; x <= 34; x += 1) chars[y][x] = ".";
}
chars[4][30] = "B";
chars[2][GATE_COLUMN] = "#";

export interface Spawn {
  x: number;
  y: number;
}

export interface Marker extends Spawn {
  id: "elder" | "villager" | "shop" | "player" | "wolf" | "boar" | "warden";
}

const CHAR_TILE: Record<string, number> = {
  "#": TILE_GRASS,
  ".": TILE_GRASS,
  ",": TILE_PATH,
  "~": TILE_WATER,
  f: TILE_FLOWER,
  o: TILE_GROVE,
  w: TILE_WALL,
  r: TILE_ROOF,
  g: TILE_GATE,
  E: TILE_GRASS,
  P: TILE_PATH,
  V: TILE_PATH,
  S: TILE_PATH,
  "1": TILE_PATH,
  "2": TILE_GRASS,
  B: TILE_GROVE,
};

const MARKERS: Record<string, Marker["id"]> = {
  E: "elder",
  V: "villager",
  S: "shop",
  P: "player",
  "1": "wolf",
  "2": "boar",
  B: "warden",
};

export function tileGrid(): number[][] {
  return chars.map((line) => line.map((ch) => CHAR_TILE[ch] ?? TILE_GRASS));
}

export function treeCells(): Spawn[] {
  const cells: Spawn[] = [];
  chars.forEach((line, y) => {
    line.forEach((ch, x) => {
      if (ch === "#" && x === GATE_COLUMN) cells.push({ x, y });
    });
  });
  return cells;
}

export interface Land {
  id: "village" | "road" | "grove";
  name: string;
  band: string;
}

export function landAt(x: number, y: number): Land {
  if (x >= 24 * TILE && y < 10 * TILE) {
    return { id: "grove", name: "Grove", band: "Dividing, fractions, and ratios" };
  }
  if (x >= GATE_COLUMN * TILE) {
    return { id: "road", name: "Road", band: "Multiplying and larger sums" };
  }
  return { id: "village", name: "Village", band: "Adding and subtracting" };
}

export function markers(): Marker[] {
  const found: Marker[] = [];
  chars.forEach((line, y) => {
    line.forEach((ch, x) => {
      const id = MARKERS[ch];
      if (id) found.push({ id, x, y });
    });
  });
  return found;
}

export function marker(id: Marker["id"]): Marker {
  const found = markers().find((item) => item.id === id);
  if (!found) throw new Error(`Missing marker ${id}`);
  return found;
}

export const SOLID = [TILE_WATER, TILE_WALL, TILE_ROOF, TILE_GATE];
