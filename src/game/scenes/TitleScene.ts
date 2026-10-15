import Phaser from "phaser";
import { createSave, loadSave, writeSave } from "../../progression/save";
import type { SaveData } from "../../progression/types";
import { setPlayChrome, showCreator, showTitle, clearOverlay } from "../../ui/overlay";
import { marker } from "../map/worldMap";
import { paintHero } from "./BootScene";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("title");
  }

  create(): void {
    setPlayChrome(false);
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#e7efe4");
    this.add.rectangle(80, height * 0.45, 150, 90, 0xd5e6c8);
    this.add.rectangle(width * 0.45, height * 0.55, 180, 70, 0xf6f1e6);
    this.add.rectangle(width * 0.72, height * 0.38, 120, 80, 0xc5dcc4);
    this.add.text(70, height * 0.45, "Village", { fontFamily: "ui-sans-serif, sans-serif", fontSize: "16px", color: "#1c2430" });
    this.add.text(width * 0.38, height * 0.55, "Road", { fontFamily: "ui-sans-serif, sans-serif", fontSize: "16px", color: "#1c2430" });
    this.add.text(width * 0.66, height * 0.38, "Grove", { fontFamily: "ui-sans-serif, sans-serif", fontSize: "16px", color: "#1c2430" });
    void this.offer();
  }

  private async offer(): Promise<void> {
    const existing = loadSave();
    const choice = await showTitle(Boolean(existing));
    if (!this.scene.isActive()) return;
    let save: SaveData;
    if (choice === "continue" && existing) {
      save = existing;
    } else {
      const appearance = await showCreator({ hair: 0, hairColor: 2, skin: 1, tunicColor: 1 });
      if (!this.scene.isActive()) return;
      save = createSave(appearance);
      const start = marker("player");
      save.x = start.x * 32 + 16;
      save.y = start.y * 32 + 16;
      writeSave(save);
    }
    paintHero(this, save);
    clearOverlay();
    this.scene.start("world", { save });
  }
}
