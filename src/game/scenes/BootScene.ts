import Phaser from "phaser";
import { paintCharacterTextures, paintCreatures, paintTileset, paintTree } from "../../art/paint";
import { itemById } from "../../progression/items";
import type { SaveData } from "../../progression/types";

export function paintHero(scene: Phaser.Scene, save: SaveData): void {
  const hat = itemById(save.equipped.hat ?? "")?.hatStyle ?? 0;
  const staff = itemById(save.equipped.staff ?? "")?.staffStyle ?? 0;
  paintCharacterTextures(scene, save.appearance, hat, staff, "hero");
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create(): void {
    paintTileset(this);
    paintTree(this);
    paintCreatures(this);
    this.scene.start("title");
  }
}
