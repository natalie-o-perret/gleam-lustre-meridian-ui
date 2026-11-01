import { expect } from "playwright/test";

async function observe(host) {
  await host.evaluate((host) => {
    host.rippleObserver?.disconnect();
    host.rippleProbe = null;
    host.rippleObserver = new MutationObserver((records) => {
      const added = records.flatMap((record) => [...record.addedNodes]);
      const effect = added
        .map((node) =>
          node.matches?.(".meridian-ripple-effect")
            ? node
            : node.querySelector?.(".meridian-ripple-effect"),
        )
        .find(Boolean);
      if (!effect) return;
      const clip = effect.parentElement;
      const x = parseFloat(effect.style.left) + effect.offsetWidth / 2;
      const y = parseFloat(effect.style.top) + effect.offsetHeight / 2;
      host.rippleProbe = {
        animated: effect
          .getAnimations()
          .some((animation) => animation.animationName === "meridian-ripple"),
        clipped: getComputedStyle(clip).overflow === "hidden",
        originInside:
          x >= -1 &&
          y >= -1 &&
          x <= clip.clientWidth + 1 &&
          y <= clip.clientHeight + 1,
      };
      host.rippleObserver.disconnect();
    });
    host.rippleObserver.observe(host, { childList: true, subtree: true });
  });
}

async function observed(host, enabled) {
  if (enabled)
    await expect
      .poll(() => host.evaluate((node) => node.rippleProbe))
      .toEqual({ animated: true, clipped: true, originInside: true });
  else
    await expect
      .poll(() => host.evaluate((node) => node.rippleProbe))
      .toBeNull();
}

export async function pointerRipple(
  page,
  control,
  host = control,
  enabled = true,
) {
  await observe(host);
  await control.hover();
  await page.mouse.down();
  try {
    await observed(host, enabled);
  } finally {
    await page.mouse.move(0, 0);
    await page.mouse.up();
  }
}

export async function keyboardRipple(
  page,
  control,
  host = control,
  key = "Space",
  enabled = true,
) {
  await control.focus();
  await observe(host);
  await page.keyboard.down(key);
  try {
    await observed(host, enabled);
  } finally {
    await page.keyboard.up(key);
  }
}

export async function touchRipple(control, host = control) {
  await observe(host);
  await control.tap();
  await observed(host, true);
}
