import { bonuses } from "./items";
import type { Appearance, SaveData } from "./types";

export const SAVE_KEY = "smart-adventurer-save";

export const START_APPEARANCE: Appearance = {
  hair: 0,
  hairColor: 0,
  skin: 1,
  tunicColor: 1,
};

export function createSave(appearance: Appearance = START_APPEARANCE): SaveData {
  const save: SaveData = {
    x: 0,
    y: 0,
    level: 1,
    xp: 0,
    gold: 0,
    health: 10,
    hints: 1,
    streak: 0,
    appearance,
    owned: [],
    equipped: { hat: null, tunic: null, staff: null },
    quests: {
      elderDone: false,
      gateOpen: false,
      wolfDefeated: false,
      boarDefeated: false,
      groveCleared: false,
    },
  };
  save.health = bonuses(save).maxHealth;
  return save;
}

export function loadSave(): SaveData | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SaveData;
    if (!parsed || typeof parsed.level !== "number" || !parsed.quests) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSave(save: SaveData): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function grantXp(save: SaveData, amount: number): number {
  save.xp += amount;
  let gained = 0;
  let needed = xpNeeded(save.level);
  while (save.xp >= needed) {
    save.xp -= needed;
    save.level += 1;
    gained += 1;
    needed = xpNeeded(save.level);
  }
  const max = bonuses(save).maxHealth;
  if (gained > 0) save.health = max;
  else save.health = Math.min(save.health, max);
  return gained;
}

function xpNeeded(level: number): number {
  return 20 + (level - 1) * 15;
}

export function payout(save: SaveData, gold: number): number {
  const bonus = bonuses(save).goldBonus;
  const paid = Math.round(gold * (1 + bonus));
  save.gold += paid;
  return paid;
}
