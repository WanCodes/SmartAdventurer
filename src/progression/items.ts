import type { GearItem, SaveData } from "./types";

export const GEAR: GearItem[] = [
  {
    id: "wool-cap",
    slot: "hat",
    name: "Wool cap",
    cost: 15,
    level: 1,
    blurb: "+4 health. A warm start for the road.",
    maxHealth: 4,
    damage: 0,
    goldBonus: 0,
    hints: 0,
    hatStyle: 1,
  },
  {
    id: "traveler-tunic",
    slot: "tunic",
    name: "Traveler tunic",
    cost: 25,
    level: 2,
    blurb: "Victories pay 15% more gold.",
    maxHealth: 0,
    damage: 0,
    goldBonus: 0.15,
    hints: 0,
    tunicColor: 4,
  },
  {
    id: "oak-staff",
    slot: "staff",
    name: "Oak staff",
    cost: 40,
    level: 3,
    blurb: "Correct answers hit a little harder.",
    maxHealth: 0,
    damage: 1,
    goldBonus: 0,
    hints: 0,
    staffStyle: 1,
  },
  {
    id: "feather-hat",
    slot: "hat",
    name: "Feathered hat",
    cost: 50,
    level: 4,
    blurb: "+1 hint charge, and a bit of style.",
    maxHealth: 0,
    damage: 0,
    goldBonus: 0,
    hints: 1,
    hatStyle: 2,
  },
  {
    id: "grove-cloak",
    slot: "tunic",
    name: "Grove cloak",
    cost: 70,
    level: 5,
    blurb: "+8 health for the deeper questions.",
    maxHealth: 8,
    damage: 0,
    goldBonus: 0,
    hints: 0,
    tunicColor: 5,
  },
  {
    id: "lantern-staff",
    slot: "staff",
    name: "Lantern staff",
    cost: 90,
    level: 6,
    blurb: "+1 damage and +1 hint charge.",
    maxHealth: 0,
    damage: 1,
    goldBonus: 0,
    hints: 1,
    staffStyle: 2,
  },
];

export const SKIN_COLORS = ["#f2c7a5", "#e0ac84", "#c68642", "#8d5524"];
export const HAIR_COLORS = ["#4a3428", "#1d1a17", "#e0b15a", "#a33b32", "#efe6d6"];
export const TUNIC_COLORS = ["#3d6b9a", "#2f6b45", "#a33b32", "#6b4c9a", "#c47b39", "#1f6b62"];
export const HAIR_NAMES = ["Short", "Long", "Tuft", "Braid"];

export function itemById(id: string): GearItem | undefined {
  return GEAR.find((item) => item.id === id);
}

export function baseHealth(level: number): number {
  return 10 + (level - 1) * 2;
}

export function bonuses(save: SaveData): {
  maxHealth: number;
  damage: number;
  goldBonus: number;
  hintBonus: number;
} {
  const equipped = [save.equipped.hat, save.equipped.tunic, save.equipped.staff]
    .map((id) => (id ? itemById(id) : undefined))
    .filter((item): item is GearItem => Boolean(item));

  return equipped.reduce(
    (total, item) => ({
      maxHealth: total.maxHealth + item.maxHealth,
      damage: total.damage + item.damage,
      goldBonus: total.goldBonus + item.goldBonus,
      hintBonus: total.hintBonus + item.hints,
    }),
    {
      maxHealth: baseHealth(save.level),
      damage: 1,
      goldBonus: 0,
      hintBonus: 0,
    },
  );
}

export function xpToNext(level: number): number {
  return 20 + (level - 1) * 15;
}
