export interface Appearance {
  hair: number;
  hairColor: number;
  skin: number;
  tunicColor: number;
}

export interface Quests {
  elderDone: boolean;
  gateOpen: boolean;
  wolfDefeated: boolean;
  boarDefeated: boolean;
  groveCleared: boolean;
}

export interface SaveData {
  x: number;
  y: number;
  level: number;
  xp: number;
  gold: number;
  health: number;
  hints: number;
  streak: number;
  appearance: Appearance;
  owned: string[];
  equipped: {
    hat: string | null;
    tunic: string | null;
    staff: string | null;
  };
  quests: Quests;
}

export interface GearItem {
  id: string;
  slot: "hat" | "tunic" | "staff";
  name: string;
  cost: number;
  level: number;
  blurb: string;
  maxHealth: number;
  damage: number;
  goldBonus: number;
  hints: number;
  tunicColor?: number;
  hatStyle?: number;
  staffStyle?: number;
}
