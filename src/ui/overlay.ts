import type { Land } from "../game/map/worldMap";
import { paintPortrait } from "../art/paint";
import { makeQuestion, type Question } from "../math/generator";
import {
  GEAR,
  HAIR_COLORS,
  HAIR_NAMES,
  SKIN_COLORS,
  TUNIC_COLORS,
  bonuses,
  itemById,
} from "../progression/items";
import type { Appearance, SaveData } from "../progression/types";

const lesson = () => document.getElementById("lesson")!;
const padEl = () => document.getElementById("pad")!;

function shell(): { status: HTMLElement; body: HTMLElement } {
  const root = lesson();
  if (!root.querySelector(".lesson-body")) {
    root.innerHTML = `<div class="lesson-status"></div><div class="lesson-body"></div>`;
  }
  return {
    status: root.querySelector(".lesson-status")!,
    body: root.querySelector(".lesson-body")!,
  };
}

function panel(html: string): HTMLElement {
  const { body } = shell();
  body.innerHTML = html;
  return body;
}

export function clearOverlay(): void {
  lesson().innerHTML = "";
}

export function setPlayChrome(visible: boolean): void {
  padEl().hidden = !visible;
  if (!visible) clearOverlay();
}

function statusHtml(save: SaveData): string {
  const stats = bonuses(save);
  const needed = 20 + (save.level - 1) * 15;
  const xpPct = Math.max(0, Math.min(100, (save.xp / needed) * 100));
  const hpPct = Math.max(0, Math.min(100, (save.health / stats.maxHealth) * 100));
  return `
    <div><strong>Level</strong><span>${save.level}</span><div class="bar" title="Experience toward the next level"><i style="width:${xpPct}%"></i></div></div>
    <div><strong>Health</strong><span>${save.health}/${stats.maxHealth}</span><div class="bar hp"><i style="width:${hpPct}%"></i></div></div>
    <div><strong>Gold</strong><span>${save.gold}</span></div>
  `;
}

export function renderHud(save: SaveData): void {
  shell().status.innerHTML = statusHtml(save);
}

export function nextStep(save: SaveData): string {
  if (!save.quests.elderDone) return "Talk to Elder Rowan, north of the path.";
  if (!save.quests.gateOpen) return "Help Nia open the east gate.";
  if (!save.quests.wolfDefeated) return "Meet the wolf on the road.";
  if (!save.quests.boarDefeated) return "The boar waits south of the water.";
  if (!save.quests.groveCleared) return "The Grove Warden is the last question in this chapter.";
  return "This chapter is complete. Your progress stays in the village.";
}

export function showAtlas(save: SaveData, land: Land): void {
  renderHud(save);
  panel(`
    <p class="kicker">${land.name}</p>
    <h2>${land.band}</h2>
    <p class="band">Hints ${save.hints} · Streak ${save.streak}</p>
    <p class="lede">${nextStep(save)}</p>
  `);
}

export function toast(message: string): void {
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.getElementById("map-pane")!.appendChild(node);
  window.setTimeout(() => node.remove(), 1800);
}

export function showTitle(hasSave: boolean): Promise<"continue" | "new"> {
  const root = panel(`
    <p class="kicker">Study atlas</p>
    <h1>Smart Adventurer</h1>
    <p class="lede">Three lands, one path: add in the village, multiply on the road, then divide in the grove.</p>
    <div class="actions">
      ${hasSave ? '<button type="button" class="primary" data-act="continue">Continue</button>' : ""}
      <button type="button" data-act="new" ${hasSave ? "" : 'class="primary"'}>New game</button>
    </div>
  `);
  return new Promise((resolve) => {
    root.querySelector('[data-act="continue"]')?.addEventListener("click", () => resolve("continue"));
    root.querySelector('[data-act="new"]')?.addEventListener("click", () => resolve("new"));
  });
}

export function showCreator(start: Appearance): Promise<Appearance> {
  const look = { ...start };
  const root = panel(`<div class="preview-wrap"><canvas class="preview"></canvas></div>
    <p class="kicker">New adventurer</p>
    <h2>Choose a look</h2>
    <p class="lede">Hair, color, and tunic dye are free.</p>
    <div id="look-controls"></div>
    <div class="actions"><button type="button" class="primary" data-act="go">Begin</button></div>`);

  const draw = () => {
    const canvas = root.querySelector("canvas");
    if (canvas) paintPortrait(canvas, look, 0, 0);
  };

  const controls = root.querySelector("#look-controls")!;
  const renderControls = () => {
    controls.innerHTML = `
      <p>Hair</p>
      <div class="row">${HAIR_NAMES.map((name, i) => `<button type="button" class="choice" data-hair="${i}" aria-pressed="${look.hair === i}">${name}</button>`).join("")}</div>
      <p>Hair color</p>
      <div class="row">${HAIR_COLORS.map((color, i) => `<button type="button" class="swatch" data-hair-color="${i}" aria-pressed="${look.hairColor === i}" style="background:${color}" aria-label="Hair color ${i + 1}"></button>`).join("")}</div>
      <p>Skin</p>
      <div class="row">${SKIN_COLORS.map((color, i) => `<button type="button" class="swatch" data-skin="${i}" aria-pressed="${look.skin === i}" style="background:${color}" aria-label="Skin tone ${i + 1}"></button>`).join("")}</div>
      <p>Tunic dye</p>
      <div class="row">${TUNIC_COLORS.map((color, i) => `<button type="button" class="swatch" data-tunic="${i}" aria-pressed="${look.tunicColor === i}" style="background:${color}" aria-label="Tunic color ${i + 1}"></button>`).join("")}</div>
    `;
    controls.querySelectorAll<HTMLButtonElement>("[data-hair]").forEach((button) => {
      button.onclick = () => {
        look.hair = Number(button.dataset.hair);
        renderControls();
        draw();
      };
    });
    controls.querySelectorAll<HTMLButtonElement>("[data-hair-color]").forEach((button) => {
      button.onclick = () => {
        look.hairColor = Number(button.dataset.hairColor);
        renderControls();
        draw();
      };
    });
    controls.querySelectorAll<HTMLButtonElement>("[data-skin]").forEach((button) => {
      button.onclick = () => {
        look.skin = Number(button.dataset.skin);
        renderControls();
        draw();
      };
    });
    controls.querySelectorAll<HTMLButtonElement>("[data-tunic]").forEach((button) => {
      button.onclick = () => {
        look.tunicColor = Number(button.dataset.tunic);
        renderControls();
        draw();
      };
    });
  };
  renderControls();
  draw();
  return new Promise((resolve) => {
    root.querySelector('[data-act="go"]')!.addEventListener("click", () => {
      clearOverlay();
      resolve(look);
    });
  });
}

export function showDialogue(speaker: string, lines: string[]): Promise<void> {
  let index = 0;
  return new Promise((resolve) => {
    const step = () => {
      const root = panel(`
        <p class="kicker">${speaker}</p>
        <p class="prompt">${lines[index]}</p>
        <div class="actions"><button type="button" class="primary">${index < lines.length - 1 ? "Next" : "Close"}</button></div>
      `);
      root.querySelector("button")!.onclick = () => {
        index += 1;
        if (index >= lines.length) {
          clearOverlay();
          resolve();
        } else step();
      };
    };
    step();
  });
}

export interface AnswerResult {
  correct: boolean;
  timedOut: boolean;
}

export function showQuestion(
  question: Question,
  seconds: number,
  hints: number,
  kicker = "Question",
): Promise<AnswerResult & { usedHint: boolean }> {
  let left = seconds;
  let usedHint = false;
  let settled = false;
  return new Promise((resolve) => {
    const root = panel(`
      <div class="meta"><span data-timer>${left}s</span><span>Hint charges: <b data-hints>${hints}</b></span></div>
      <p class="kicker">${kicker}</p>
      <p class="prompt">${question.prompt}</p>
      <div data-choices></div>
      <p class="feedback" data-feedback></p>
      <div class="actions">
        <button type="button" data-hint ${hints > 0 ? "" : "disabled"}>Use a hint</button>
      </div>
    `);
    const choices = root.querySelector<HTMLElement>("[data-choices]")!;
    question.choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice";
      button.textContent = choice;
      button.onclick = () => finish(index === question.answerIndex, false, button);
      choices.appendChild(button);
    });
    const timer = window.setInterval(() => {
      left -= 1;
      const label = root.querySelector("[data-timer]");
      if (label) label.textContent = `${Math.max(0, left)}s`;
      if (left <= 0) finish(false, true);
    }, 1000);
    root.querySelector<HTMLButtonElement>("[data-hint]")!.onclick = () => {
      if (hints <= 0 || usedHint) return;
      usedHint = true;
      hints -= 1;
      root.querySelector("[data-hints]")!.textContent = String(hints);
      root.querySelector("[data-feedback]")!.textContent = question.hint;
      root.querySelector<HTMLButtonElement>("[data-hint]")!.disabled = true;
    };

    function finish(correct: boolean, timedOut: boolean, chosen?: HTMLButtonElement) {
      if (settled) return;
      settled = true;
      window.clearInterval(timer);
      root.querySelectorAll<HTMLButtonElement>(".choice").forEach((button, index) => {
        button.disabled = true;
        if (index === question.answerIndex) button.classList.add("good");
        else if (button === chosen) button.classList.add("bad");
      });
      const feedback = root.querySelector("[data-feedback]")!;
      feedback.className = `feedback ${correct ? "good" : "bad"}`;
      feedback.textContent = correct
        ? "Correct"
        : timedOut
          ? `Time’s up. ${question.explain}`
          : `Not quite. ${question.explain}`;
      window.setTimeout(() => {
        clearOverlay();
        resolve({ correct, timedOut, usedHint });
      }, 900);
    }
  });
}

export function showShop(save: SaveData, onChange: () => void): Promise<void> {
  let previewItem: string | null = save.equipped.hat;
  const root = panel(`<div class="preview-wrap"><canvas class="preview"></canvas></div>
    <p class="kicker">Shop</p>
    <h2>Mara’s outfits</h2>
    <p class="lede">Gold <b data-gold>${save.gold}</b>. Point at a piece to preview it.</p>
    <div data-items></div>
    <div class="actions"><button type="button" data-look>Change appearance</button><button type="button" class="primary" data-close>Leave</button></div>`);

  const draw = () => {
    const hat = itemById(save.equipped.hat ?? "");
    const staff = itemById(save.equipped.staff ?? "");
    const tunic = itemById(save.equipped.tunic ?? "");
    const preview = itemById(previewItem ?? "");
    const appearance = {
      ...save.appearance,
      tunicColor: (preview?.slot === "tunic" ? preview.tunicColor : tunic?.tunicColor) ?? save.appearance.tunicColor,
    };
    const canvas = root.querySelector("canvas");
    if (canvas) {
      paintPortrait(
        canvas,
        appearance,
        preview?.slot === "hat" ? preview.hatStyle ?? 0 : hat?.hatStyle ?? 0,
        preview?.slot === "staff" ? preview.staffStyle ?? 0 : staff?.staffStyle ?? 0,
      );
    }
  };

  const list = root.querySelector<HTMLElement>("[data-items]")!;
  const render = () => {
    root.querySelector("[data-gold]")!.textContent = String(save.gold);
    list.innerHTML = GEAR.map((item) => {
      const owned = save.owned.includes(item.id);
      const worn = save.equipped[item.slot] === item.id;
      const locked = save.level < item.level;
      const label = locked ? `Level ${item.level}` : owned ? (worn ? "Wearing" : "Wear") : `Buy ${item.cost}g`;
      return `<article class="item ${locked ? "locked" : ""}" data-id="${item.id}">
        <div><strong>${item.name}</strong><p>${item.blurb}</p></div>
        <button type="button" ${locked || worn ? "disabled" : ""}>${label}</button>
      </article>`;
    }).join("");
    list.querySelectorAll<HTMLElement>(".item").forEach((row) => {
      row.onpointerenter = () => {
        previewItem = row.dataset.id ?? null;
        draw();
      };
      row.querySelector("button")!.onclick = () => {
        const item = itemById(row.dataset.id ?? "");
        if (!item || save.level < item.level) return;
        if (!save.owned.includes(item.id)) {
          if (save.gold < item.cost) {
            toast("Not enough gold yet.");
            return;
          }
          save.gold -= item.cost;
          save.owned.push(item.id);
          save.hints += item.hints;
        }
        save.equipped[item.slot] = item.id;
        save.health = bonuses(save).maxHealth;
        if (item.tunicColor !== undefined) save.appearance.tunicColor = item.tunicColor;
        previewItem = item.id;
        onChange();
        render();
        draw();
      };
    });
    draw();
  };
  render();

  return new Promise((resolve) => {
    root.querySelector<HTMLButtonElement>("[data-look]")!.onclick = async () => {
      const next = await showCreator(save.appearance);
      save.appearance = next;
      onChange();
      void showShop(save, onChange).then(resolve);
    };
    root.querySelector<HTMLButtonElement>("[data-close]")!.onclick = () => {
      clearOverlay();
      resolve();
    };
  });
}

export async function askGenerated(
  level: number,
  hints: number,
  kicker = "Question",
): Promise<{ result: AnswerResult & { usedHint: boolean }; question: Question }> {
  const question = makeQuestion(level);
  const result = await showQuestion(question, 20, hints, kicker);
  return { result, question };
}
