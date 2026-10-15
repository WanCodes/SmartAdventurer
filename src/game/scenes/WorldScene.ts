import Phaser from "phaser";
import { makeQuestion } from "../../math/generator";
import { paintCharacterTextures } from "../../art/paint";
import { bonuses } from "../../progression/items";
import { grantXp, payout, writeSave } from "../../progression/save";
import type { SaveData } from "../../progression/types";
import {
  renderHud,
  setPlayChrome,
  showAtlas,
  showDialogue,
  showQuestion,
  showShop,
  toast,
} from "../../ui/overlay";
import { bindPad, pad, takeInteract } from "../input";
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  SOLID,
  TILE,
  TILE_GATE,
  TILE_PATH,
  landAt,
  marker,
  tileGrid,
  treeCells,
  type Marker,
} from "../map/worldMap";
import { playCorrect, playLevel, playWrong } from "../sfx";
import { paintHero } from "./BootScene";
import type { EncounterId } from "./BattleScene";

export class WorldScene extends Phaser.Scene {
  private save!: SaveData;
  private player!: Phaser.Physics.Arcade.Sprite;
  private layer!: Phaser.Tilemaps.TilemapLayer;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<"W" | "A" | "S" | "D" | "E", Phaser.Input.Keyboard.Key>;
  private facing: "down" | "up" | "side" = "down";
  private frame = 0;
  private walkMs = 0;
  private busy = false;
  private prompt!: Phaser.GameObjects.Text;
  private foes = new Map<EncounterId, Phaser.GameObjects.Sprite>();
  private landId = "";

  constructor() {
    super("world");
  }

  init(data: { save: SaveData }): void {
    this.save = data.save;
  }

  create(): void {
    bindPad();
    setPlayChrome(true);
    paintHero(this, this.save);
    this.paintVillagers();
    const map = this.make.tilemap({ data: tileGrid(), tileWidth: TILE, tileHeight: TILE });
    const tiles = map.addTilesetImage("tiles");
    this.layer = map.createLayer(0, tiles!, 0, 0)!;
    this.layer.setCollision(SOLID);
    if (this.save.quests.gateOpen) this.openGate(false);

    const trees = this.physics.add.staticGroup();
    treeCells().forEach(({ x, y }) => {
      const tree = this.add.image(x * TILE + TILE / 2, y * TILE + 8, "tree");
      tree.setDepth(y * TILE + TILE);
      const trunk = trees.create(x * TILE + TILE / 2, y * TILE + 20, "tree") as Phaser.Physics.Arcade.Sprite;
      trunk.setVisible(false);
      trunk.body!.setSize(16, 16);
      trunk.refreshBody();
    });

    const start = this.save.x
      ? { x: this.save.x, y: this.save.y }
      : { x: marker("player").x * TILE + 16, y: marker("player").y * TILE + 16 };
    this.player = this.physics.add.sprite(start.x, start.y, "hero-down-0");
    this.player.setCollideWorldBounds(true);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(16, 14);
    body.setOffset(8, 24);
    this.physics.add.collider(this.player, this.layer);
    this.physics.add.collider(this.player, trees);

    this.physics.world.setBounds(0, 0, MAP_WIDTH * TILE, MAP_HEIGHT * TILE);
    this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE, MAP_HEIGHT * TILE);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.setBackgroundColor("#e7efe4");
    this.addLandLabels();

    this.spawnPeople();
    this.spawnFoes();
    this.prompt = this.add.text(0, 0, "Talk", {
      fontFamily: "ui-sans-serif, sans-serif",
      fontSize: "14px",
      color: "#1c2430",
      backgroundColor: "#f7f6f2",
      padding: { x: 6, y: 4 },
    }).setDepth(10000).setVisible(false);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = {
      W: this.input.keyboard!.addKey("W"),
      A: this.input.keyboard!.addKey("A"),
      S: this.input.keyboard!.addKey("S"),
      D: this.input.keyboard!.addKey("D"),
      E: this.input.keyboard!.addKey("E"),
    };
    this.game.events.on("battle-finished", this.afterBattle, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off("battle-finished", this.afterBattle, this);
    });
    renderHud(this.save);
    this.refreshAtlas();
  }

  private addLandLabels(): void {
    const write = (x: number, y: number, name: string, band: string) => {
      this.add.text(x, y, name, {
        fontFamily: "ui-sans-serif, sans-serif",
        fontSize: "20px",
        color: "#1c2430",
        fontStyle: "bold",
      }).setDepth(4);
      this.add.text(x, y + 22, band, {
        fontFamily: "ui-sans-serif, sans-serif",
        fontSize: "13px",
        color: "#3d4c5c",
      }).setDepth(4);
    };
    write(48, 28, "Village", "Adding and subtracting");
    write(18 * TILE, 28, "Road", "Multiplying and larger sums");
    write(26 * TILE, 28, "Grove", "Dividing and ratios");
  }

  private refreshAtlas(force = false): void {
    const land = landAt(this.player.x, this.player.y);
    if (!force && land.id === this.landId) return;
    this.landId = land.id;
    showAtlas(this.save, land);
  }

  private paintVillagers(): void {
    paintHero(this, this.save);
    paintCharacterTextures(this, { hair: 1, hairColor: 4, skin: 2, tunicColor: 3 }, 1, 0, "elder");
    paintCharacterTextures(this, { hair: 3, hairColor: 3, skin: 0, tunicColor: 2 }, 0, 0, "villager");
    paintCharacterTextures(this, { hair: 2, hairColor: 1, skin: 3, tunicColor: 4 }, 2, 0, "shop");
  }

  private spawnPeople(): void {
    const spots: Array<[Marker["id"], string]> = [
      ["elder", "elder"],
      ["villager", "villager"],
      ["shop", "shop"],
    ];
    spots.forEach(([id, key]) => {
      const spot = marker(id);
      const sprite = this.add.sprite(spot.x * TILE + 16, spot.y * TILE + 8, `${key}-down-0`);
      sprite.setDepth(sprite.y);
      sprite.setData("npc", id);
    });
  }

  private spawnFoes(): void {
    const mapping: Array<[Marker["id"], EncounterId, string]> = [
      ["wolf", "wolf", "wolf"],
      ["boar", "boar", "boar"],
      ["warden", "warden", "warden"],
    ];
    mapping.forEach(([id, encounter, texture]) => {
      const spot = marker(id);
      const sprite = this.add.sprite(spot.x * TILE + 16, spot.y * TILE + 8, texture).setScale(encounter === "warden" ? 1.3 : 1);
      sprite.setDepth(sprite.y);
      const cleared =
        (encounter === "wolf" && this.save.quests.wolfDefeated) ||
        (encounter === "boar" && this.save.quests.boarDefeated) ||
        (encounter === "warden" && this.save.quests.groveCleared);
      sprite.setAlpha(cleared ? 0.35 : 1);
      this.foes.set(encounter, sprite);
    });
  }

  update(_time: number, delta: number): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (this.busy || this.scene.isPaused()) {
      body.setVelocity(0);
      pad.interactQueued = false;
      return;
    }
    let x = 0;
    let y = 0;
    if (this.cursors.left.isDown || this.keys.A.isDown || pad.left) x -= 1;
    if (this.cursors.right.isDown || this.keys.D.isDown || pad.right) x += 1;
    if (this.cursors.up.isDown || this.keys.W.isDown || pad.up) y -= 1;
    if (this.cursors.down.isDown || this.keys.S.isDown || pad.down) y += 1;
    if (x !== 0 && y !== 0) {
      x *= Math.SQRT1_2;
      y *= Math.SQRT1_2;
    }
    body.setVelocity(x * 150, y * 150);
    if (x !== 0 || y !== 0) {
      if (Math.abs(x) > Math.abs(y)) {
        this.facing = "side";
        this.player.setFlipX(x < 0);
      } else {
        this.facing = y < 0 ? "up" : "down";
        this.player.setFlipX(false);
      }
      this.walkMs += delta;
      if (this.walkMs > 160) {
        this.walkMs = 0;
        this.frame = this.frame === 0 ? 1 : 0;
      }
    }
    this.player.setTexture(`hero-${this.facing}-${this.frame}`);
    this.player.setDepth(this.player.y);
    this.save.x = this.player.x;
    this.save.y = this.player.y;
    this.refreshAtlas();

    const near = this.nearestNpc();
    const foe = this.nearestFoe();
    if (near) {
      this.prompt.setVisible(true);
      this.prompt.setPosition(near.x - 28, near.y - 46);
    } else if (foe) {
      this.prompt.setVisible(true);
      this.prompt.setText("Challenge");
      this.prompt.setPosition(foe.sprite.x - 48, foe.sprite.y - 46);
    } else {
      this.prompt.setVisible(false);
      this.prompt.setText("Talk");
    }

    const interact = Phaser.Input.Keyboard.JustDown(this.keys.E) || takeInteract();
    if (interact && near) void this.talk(near.getData("npc") as Marker["id"]);
    else if (interact && foe) this.beginBattle(foe.id);
    else if (!interact && foe && Phaser.Math.Distance.Between(this.player.x, this.player.y, foe.sprite.x, foe.sprite.y) < 28) {
      this.beginBattle(foe.id);
    }
  }

  private nearestNpc(): Phaser.GameObjects.Sprite | null {
    let best: Phaser.GameObjects.Sprite | null = null;
    let bestDist = 72;
    this.children.each((child) => {
      const sprite = child as Phaser.GameObjects.Sprite;
      if (!sprite.getData || !sprite.getData("npc")) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y);
      if (dist < bestDist) {
        best = sprite;
        bestDist = dist;
      }
    });
    return best;
  }

  private nearestFoe(): { id: EncounterId; sprite: Phaser.GameObjects.Sprite } | null {
    let best: { id: EncounterId; sprite: Phaser.GameObjects.Sprite } | null = null;
    let bestDist = 46;
    this.foes.forEach((sprite, id) => {
      if (this.cleared(id)) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y);
      if (dist < bestDist) {
        best = { id, sprite };
        bestDist = dist;
      }
    });
    return best;
  }

  private cleared(id: EncounterId): boolean {
    if (id === "wolf") return this.save.quests.wolfDefeated;
    if (id === "boar") return this.save.quests.boarDefeated;
    return this.save.quests.groveCleared;
  }

  private beginBattle(id: EncounterId): void {
    if (this.busy || this.cleared(id)) return;
    if (!this.save.quests.gateOpen) {
      void this.say("The east road is still shut. Help the villager on the path first.");
      return;
    }
    this.busy = true;
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0);
    writeSave(this.save);
    this.scene.pause();
    this.scene.launch("battle", { save: this.save, encounter: id });
  }

  private afterBattle = (): void => {
    this.busy = false;
    paintHero(this, this.save);
    this.player.setTexture("hero-down-0");
    this.player.setPosition(this.save.x, this.save.y);
    this.foes.forEach((sprite, id) => sprite.setAlpha(this.cleared(id) ? 0.35 : 1));
    renderHud(this.save);
    writeSave(this.save);
    this.refreshAtlas(true);
  };

  private async say(line: string): Promise<void> {
    this.busy = true;
    await showDialogue("Smart Adventurer", [line]);
    this.refreshAtlas(true);
    this.busy = false;
  }

  private async talk(id: Marker["id"]): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0);
    if (id === "elder") await this.talkElder();
    else if (id === "villager") await this.talkVillager();
    else await this.talkShop();
    writeSave(this.save);
    renderHud(this.save);
    this.refreshAtlas(true);
    this.busy = false;
  }

  private async talkElder(): Promise<void> {
    if (!this.save.quests.elderDone) {
      await showDialogue("Elder Rowan", ["Answer one sum with me. You can try again until it is right."]);
      let correct = false;
      while (!correct) {
        const question = makeQuestion(1);
        const result = await showQuestion(question, 30, this.save.hints, "Village · Adding and subtracting");
        if (result.usedHint) this.save.hints = Math.max(0, this.save.hints - 1);
        correct = result.correct;
        if (correct) playCorrect();
        else playWrong();
      }
      this.save.quests.elderDone = true;
      const gold = payout(this.save, 8);
      const levels = grantXp(this.save, 12);
      if (levels) playLevel();
      renderHud(this.save);
      writeSave(this.save);
      await showDialogue("Elder Rowan", [`Correct. Take ${gold} gold, then help Nia by the gate.`]);
      toast(levels ? `Level ${this.save.level}` : "The elder’s lesson is complete.");
      return;
    }
    await showDialogue("Elder Rowan", ["Walk east when you want the next band of questions."]);
  }

  private async talkVillager(): Promise<void> {
    if (!this.save.quests.elderDone) {
      await showDialogue("Nia", ["Speak with Elder Rowan first. They stand just north of the path."]);
      return;
    }
    if (this.save.quests.gateOpen) {
      await showDialogue("Nia", ["The gate is open. A wolf and a boar are on the road, and the warden is in the grove."]);
      return;
    }
    await showDialogue("Nia", ["The miller’s tally is wrong, so the east gate stays shut."]);
    let correct = false;
    while (!correct) {
      const question = makeQuestion(Math.max(1, this.save.level));
      const result = await showQuestion(question, 25, this.save.hints, "Village · Adding and subtracting");
      if (result.usedHint) this.save.hints = Math.max(0, this.save.hints - 1);
      correct = result.correct;
      if (correct) playCorrect();
      else {
        playWrong();
        await showDialogue("Nia", ["Not quite. Use the hint, then try a new question."]);
      }
    }
    this.save.quests.gateOpen = true;
    this.openGate(true);
    const gold = payout(this.save, 15);
    const levels = grantXp(this.save, 20);
    if (levels) playLevel();
    renderHud(this.save);
    writeSave(this.save);
    await showDialogue("Nia", [`The bar lifts. ${gold} gold for a clear count.`]);
  }

  private async talkShop(): Promise<void> {
    await showDialogue("Mara", ["Point at a piece to preview it, then buy it with gold."]);
    await showShop(this.save, () => {
      paintHero(this, this.save);
      this.player.setTexture(`hero-${this.facing}-${this.frame}`);
      this.save.health = Math.min(this.save.health, bonuses(this.save).maxHealth);
      renderHud(this.save);
      writeSave(this.save);
    });
  }

  private openGate(announce: boolean): void {
    this.layer.forEachTile((tile) => {
      if (tile.index === TILE_GATE) {
        tile.index = TILE_PATH;
        tile.setCollision(false);
      }
    });
    if (announce) toast("The east gate is open.");
  }
}
