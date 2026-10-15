import Phaser from "phaser";
import { bandLabel } from "../../math/generator";
import { bonuses } from "../../progression/items";
import { grantXp, payout, writeSave } from "../../progression/save";
import type { SaveData } from "../../progression/types";
import { askGenerated, clearOverlay, renderHud, showDialogue, toast } from "../../ui/overlay";
import { marker } from "../map/worldMap";
import { playCorrect, playLevel, playWrong } from "../sfx";
import { paintHero } from "./BootScene";

export type EncounterId = "wolf" | "boar" | "warden";

const ENCOUNTERS: Record<
  EncounterId,
  { name: string; texture: string; hp: number; damage: number; gold: number; xp: number; levelBump: number; tint: number }
> = {
  wolf: { name: "Moss Wolf", texture: "wolf", hp: 3, damage: 2, gold: 12, xp: 18, levelBump: 0, tint: 0x8d6a4a },
  boar: { name: "Bramble Boar", texture: "boar", hp: 4, damage: 3, gold: 18, xp: 24, levelBump: 1, tint: 0x6e5344 },
  warden: { name: "Grove Warden", texture: "warden", hp: 5, damage: 3, gold: 40, xp: 50, levelBump: 2, tint: 0x3e6b48 },
};

export class BattleScene extends Phaser.Scene {
  private save!: SaveData;
  private encounterId!: EncounterId;
  private enemyHp = 1;
  private enemyMax = 1;
  private bars!: Phaser.GameObjects.Graphics;
  private status!: Phaser.GameObjects.Text;

  constructor() {
    super("battle");
  }

  init(data: { save: SaveData; encounter: EncounterId }): void {
    this.save = data.save;
    this.encounterId = data.encounter;
  }

  create(): void {
    const spec = ENCOUNTERS[this.encounterId];
    this.enemyMax = spec.hp;
    this.enemyHp = spec.hp;
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0xe7efe4);
    this.add.ellipse(width * 0.28, height * 0.4, 180, 46, 0xd5e6c8);
    this.add.ellipse(width * 0.72, height * 0.4, 200, 50, 0xd5e6c8);
    paintHero(this, this.save);
    const hero = this.add.sprite(width * 0.28, height * 0.34, "hero-side-0").setScale(3);
    hero.setFlipX(false);
    const foe = this.add.sprite(width * 0.72, height * 0.32, spec.texture).setScale(this.encounterId === "warden" ? 3.2 : 2.6);
    foe.setTint(spec.tint);
    this.bars = this.add.graphics();
    this.status = this.add
      .text(width / 2, 28, "", { fontFamily: "ui-sans-serif, sans-serif", fontSize: "18px", color: "#1c2430" })
      .setOrigin(0.5);
    this.drawBars();
    void this.fight();
  }

  private drawBars(): void {
    const spec = ENCOUNTERS[this.encounterId];
    const stats = bonuses(this.save);
    const { width } = this.scale;
    this.bars.clear();
    const bar = (x: number, ratio: number, color: number) => {
      this.bars.fillStyle(0xd5dbe3, 1);
      this.bars.fillRoundedRect(x, 78, 220, 16, 8);
      this.bars.fillStyle(color, 1);
      this.bars.fillRoundedRect(x, 78, Math.max(8, 220 * ratio), 16, 8);
    };
    bar(80, this.save.health / stats.maxHealth, 0xc46a5a);
    bar(width - 300, this.enemyHp / this.enemyMax, 0xe0b15a);
    this.status.setText(`${spec.name}  ·  ${bandLabel(this.save.level + spec.levelBump)}`);
  }

  private async fight(): Promise<void> {
    const spec = ENCOUNTERS[this.encounterId];
    const stats = () => bonuses(this.save);
    let streak = 0;
    while (this.enemyHp > 0 && this.save.health > 0) {
      this.drawBars();
      const { result } = await askGenerated(this.save.level + spec.levelBump, this.save.hints, spec.name);
      if (!this.scene.isActive()) return;
      if (result.usedHint) this.save.hints = Math.max(0, this.save.hints - 1);
      if (result.correct) {
        playCorrect();
        this.enemyHp = Math.max(0, this.enemyHp - stats().damage);
        streak += 1;
        this.save.streak += 1;
      } else {
        playWrong();
        this.save.health = Math.max(0, this.save.health - spec.damage);
        streak = 0;
        this.save.streak = 0;
      }
      renderHud(this.save);
    }

    clearOverlay();
    if (this.save.health <= 0) {
      await showDialogue(spec.name, ["Not quite. You keep your gold and head back to the village."]);
      const home = marker("player");
      this.save.x = home.x * 32 + 16;
      this.save.y = home.y * 32 + 16;
      this.save.health = stats().maxHealth;
      const kept = payout(this.save, 2);
      writeSave(this.save);
      toast(`You keep ${kept} gold and head home.`);
      this.finish();
      return;
    }

    const gold = payout(this.save, spec.gold + Math.max(0, streak - 1) * 2);
    const levels = grantXp(this.save, spec.xp);
    if (this.encounterId === "wolf") this.save.quests.wolfDefeated = true;
    if (this.encounterId === "boar") this.save.quests.boarDefeated = true;
    if (this.encounterId === "warden") this.save.quests.groveCleared = true;
    writeSave(this.save);
    renderHud(this.save);
    if (levels > 0) {
      playLevel();
      toast(`Level ${this.save.level}. New questions and shop goods await.`);
    }
    const lines = [`You win ${gold} gold and ${spec.xp} experience.`];
    if (this.encounterId === "warden") {
      lines[0] = `You win ${gold} gold. The grove is quiet, and this chapter is complete.`;
    }
    await showDialogue(spec.name, lines);
    this.finish();
  }

  private finish(): void {
    clearOverlay();
    this.scene.stop();
    this.scene.resume("world");
    this.game.events.emit("battle-finished");
  }
}
