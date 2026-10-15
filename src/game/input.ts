export const pad = {
  up: false,
  down: false,
  left: false,
  right: false,
  interactQueued: false,
};

export function bindPad(): void {
  const root = document.getElementById("pad");
  if (!root || root.dataset.bound === "yes") return;
  root.dataset.bound = "yes";

  root.querySelectorAll<HTMLButtonElement>("[data-dir]").forEach((button) => {
    const dir = button.dataset.dir as "up" | "down" | "left" | "right";
    const press = (event: Event) => {
      event.preventDefault();
      pad[dir] = true;
    };
    const release = () => {
      pad[dir] = false;
    };
    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointerleave", release);
    button.addEventListener("pointercancel", release);
  });

  const interact = document.getElementById("interact");
  const queueInteract = (event: Event) => {
    event.preventDefault();
    pad.interactQueued = true;
  };
  interact?.addEventListener("pointerdown", queueInteract);
  interact?.addEventListener("click", queueInteract);
}

export function takeInteract(): boolean {
  const queued = pad.interactQueued;
  pad.interactQueued = false;
  return queued;
}
