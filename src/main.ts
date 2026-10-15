import Phaser from "phaser";
import { BattleScene } from "./game/scenes/BattleScene";
import { BootScene } from "./game/scenes/BootScene";
import { TitleScene } from "./game/scenes/TitleScene";
import { WorldScene } from "./game/scenes/WorldScene";

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#1a140f",
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540,
  },
  physics: {
    default: "arcade",
    arcade: { gravity: { x: 0, y: 0 } },
  },
  scene: [BootScene, TitleScene, WorldScene, BattleScene],
});

export default game;
