import {
  positionOverlay,
  watchViewport,
  preserveScroll,
} from "./overlays_ffi.mjs";

export function hsvToHex(hue, saturation, brightness) {
  if (![hue, saturation, brightness].every(Number.isFinite)) return "";
  const h = (((hue % 360) + 360) % 360) / 60;
  const s = Math.max(0, Math.min(100, saturation)) / 100;
  const v = Math.max(0, Math.min(100, brightness)) / 100;
  const channel = (offset) => {
    const k = (offset + h) % 6;
    return Math.round(255 * (v - v * s * Math.max(0, Math.min(k, 4 - k, 1))))
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(5)}${channel(3)}${channel(1)}`;
}

export function hexToHsv(value) {
  if (!/^#[0-9a-f]{6}$/i.test(value)) return null;
  const [r, g, b] = [1, 3, 5].map(
    (index) => parseInt(value.slice(index, index + 2), 16) / 255,
  );
  const high = Math.max(r, g, b);
  const low = Math.min(r, g, b);
  const delta = high - low;
  const hue = !delta
    ? 0
    : high === r
      ? ((g - b) / delta + 6) % 6
      : high === g
        ? (b - r) / delta + 2
        : (r - g) / delta + 4;
  return [hue * 60, high ? (delta / high) * 100 : 0, high * 100];
}

export function setupColourPickers(root, signal) {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  if (typeof view.HTMLDialogElement?.prototype.showModal !== "function")
    return () => {};
  const ready = new Map();
  const owned = (input) => input?.closest?.(".meridian-ui") === root;
  // Wide-gamut and alpha colours keep their native picker.
  const supported = (input) =>
    input?.matches?.('input.meridian-colour[type="color"]') &&
    hexToHsv(input.value) &&
    !input.hasAttribute("alpha") &&
    (!input.getAttribute("colorspace") ||
      input.getAttribute("colorspace") === "limited-srgb");
  let current;
  const element = (tag, className = "", text = "") => {
    const node = doc.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  };
  const close = (restore = true) => {
    if (!current) return;
    const { input, popup, controls } = current;
    current = undefined;
    if (popup.open) popup.close();
    popup.remove();
    if (input.getAttribute("aria-controls") === popup.id) {
      if (controls === null) input.removeAttribute("aria-controls");
      else input.setAttribute("aria-controls", controls);
    }
    if (
      restore &&
      input.isConnected &&
      !input.matches(":disabled") &&
      !input.closest("[hidden], [inert]")
    )
      input.focus({ preventScroll: true });
  };
  const open = (input) => {
    if (current?.input === input) return;
    close(false);
    const popup = element(
      "dialog",
      "meridian-popover meridian-picker-popup meridian-colour-popup",
    );
    popup.id = `${root.id}-colour-picker`;
    popup.dir = view.getComputedStyle(input).direction;
    const label =
      input.getAttribute("aria-label") ||
      input.labels?.[0]?.textContent.trim() ||
      "Colour";
    popup.setAttribute("aria-label", `${label} picker`);
    const state = {
      input,
      popup,
      controls: input.getAttribute("aria-controls"),
      value: input.value,
    };
    current = state;
    let hsv = hexToHsv(input.value);
    const header = element("h2", "meridian-picker-header", label);
    const plane = element("div", "meridian-colour-plane");
    plane.setAttribute("aria-hidden", "true");
    const marker = element("span", "meridian-colour-marker");
    plane.append(marker);
    const swatch = element("div", "meridian-colour-preview");
    swatch.setAttribute("aria-hidden", "true");
    const hexLabel = element("label");
    const hex = element("input", "input");
    hex.type = "text";
    hex.dir = "ltr";
    hex.required = true;
    hex.pattern = "#[0-9a-fA-F]{6}";
    hex.spellcheck = false;
    hex.autocomplete = "off";
    hexLabel.append(element("span", "", "Hex colour"), hex);
    const status = element("p", "meridian-picker-status");
    status.setAttribute("role", "status");
    const actions = element("div", "meridian-picker-actions");
    const cancel = element("button", "button", "Cancel");
    cancel.type = "button";
    cancel.addEventListener("click", () => close());
    const apply = element("button", "button primary-button", "Apply");
    apply.type = "button";
    apply.addEventListener("click", () => {
      if (
        current !== state ||
        !hex.validity.valid ||
        input.matches(":disabled, [readonly]")
      )
        return;
      input.value = hex.value.toLowerCase();
      close();
      input.dispatchEvent(new view.Event("input", { bubbles: true }));
      input.dispatchEvent(new view.Event("change", { bubbles: true }));
    });
    actions.append(cancel, apply);
    const channels = [];
    const draw = (fromHex = false) => {
      const value = hsvToHex(...hsv);
      if (!fromHex) hex.value = value;
      swatch.style.background = value;
      plane.style.setProperty("--colour-hue", hsvToHex(hsv[0], 100, 100));
      marker.style.left = `${hsv[1]}%`;
      marker.style.top = `${100 - hsv[2]}%`;
      channels.forEach(
        (control, index) => (control.value = String(hsv[index])),
      );
      apply.disabled = !hex.validity.valid;
      hex.setAttribute("aria-invalid", String(apply.disabled));
      status.textContent = apply.disabled
        ? "Enter a six-digit hex colour, such as #b41472."
        : "";
    };
    const sliders = element("div", "meridian-colour-channels");
    for (const [index, name] of ["Hue", "Saturation", "Brightness"].entries()) {
      const label = element("label");
      const control = element("input", "meridian-colour-slider");
      control.type = "range";
      control.min = "0";
      control.max = index === 0 ? "360" : "100";
      control.step = "any";
      control.addEventListener("input", () => {
        hsv[index] = control.valueAsNumber;
        draw();
      });
      label.append(element("span", "", name), control);
      sliders.append(label);
      channels.push(control);
    }
    hex.addEventListener("input", () => {
      const value = hexToHsv(hex.value);
      if (value) hsv = value;
      draw(true);
    });
    const point = (event) => {
      const bounds = plane.getBoundingClientRect();
      hsv[1] = Math.max(
        0,
        Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100),
      );
      hsv[2] = Math.max(
        0,
        Math.min(
          100,
          100 - ((event.clientY - bounds.top) / bounds.height) * 100,
        ),
      );
      draw();
    };
    plane.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      plane.setPointerCapture(event.pointerId);
      point(event);
    });
    plane.addEventListener("pointermove", (event) => {
      if (plane.hasPointerCapture(event.pointerId)) point(event);
    });
    for (const type of ["pointerup", "pointercancel"])
      plane.addEventListener(type, (event) => {
        if (plane.hasPointerCapture(event.pointerId))
          plane.releasePointerCapture(event.pointerId);
      });
    popup.addEventListener("cancel", (event) => {
      event.preventDefault();
      close();
    });
    popup.addEventListener("close", () => {
      if (current === state) close();
    });
    popup.addEventListener("keydown", (event) => {
      if (
        event.target === hex &&
        event.key === "Enter" &&
        !event.isComposing &&
        !apply.disabled
      ) {
        event.preventDefault();
        apply.click();
      }
    });
    popup.addEventListener("click", (event) => {
      const box = popup.getBoundingClientRect();
      if (
        event.target === popup &&
        (event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom)
      )
        close();
    });
    const content = element("div", "meridian-colour-content");
    content.append(hexLabel, plane, sliders, swatch, status);
    state.position = () => {
      const height = popup.clientHeight;
      positionOverlay(popup, input, view);
      if (popup.clientHeight !== height && doc.activeElement === hex)
        content.scrollTop = 0;
    };
    popup.append(header, content, actions);
    draw();
    input.setAttribute("aria-controls", popup.id);
    (input.closest("dialog") ?? root).append(popup);
    preserveScroll(view, () => popup.showModal());
    state.position();
    hex.focus({ preventScroll: true });
    content.scrollTop = 0;
  };
  const target = (event) => {
    const input = event.target.closest?.("input.meridian-colour");
    return owned(input) &&
      supported(input) &&
      !input.matches(":disabled, [readonly]")
      ? input
      : null;
  };
  root.addEventListener(
    "pointerdown",
    (event) => {
      if (event.button === 0 && target(event)) event.preventDefault();
    },
    { signal, capture: true },
  );
  root.addEventListener(
    "click",
    (event) => {
      const input = target(event);
      if (input) {
        event.preventDefault();
        open(input);
      }
    },
    { signal },
  );
  root.addEventListener(
    "keydown",
    (event) => {
      const input = target(event);
      if (
        input &&
        !event.isComposing &&
        (event.key === "Enter" ||
          event.key === " " ||
          event.key === "F4" ||
          (event.altKey && event.key === "ArrowDown"))
      ) {
        event.preventDefault();
        open(input);
      }
    },
    { signal },
  );
  root.addEventListener("reset", () => close(false), { signal });
  watchViewport(
    view,
    () => {
      current?.position();
    },
    signal,
  );
  signal.addEventListener(
    "abort",
    () => {
      close(false);
      for (const [input, added] of ready) {
        delete input.dataset.meridianColourReady;
        if (added && input.getAttribute("aria-haspopup") === "dialog")
          input.removeAttribute("aria-haspopup");
      }
      ready.clear();
    },
    { once: true },
  );
  return () => {
    for (const input of root.querySelectorAll("input.meridian-colour")) {
      if (!owned(input) || !supported(input) || ready.has(input)) continue;
      const added = !input.hasAttribute("aria-haspopup");
      if (added) input.setAttribute("aria-haspopup", "dialog");
      input.dataset.meridianColourReady = "true";
      ready.set(input, added);
    }
    for (const [input, added] of ready)
      if (!input.isConnected || !owned(input) || !supported(input)) {
        delete input.dataset.meridianColourReady;
        if (added && input.getAttribute("aria-haspopup") === "dialog")
          input.removeAttribute("aria-haspopup");
        ready.delete(input);
      }
    if (
      current &&
      (!current.input.isConnected ||
        !owned(current.input) ||
        !supported(current.input) ||
        current.input.matches(":disabled, [readonly]") ||
        current.input.closest("[hidden], [inert], dialog:not([open])") ||
        current.input.value !== current.value)
    )
      close(false);
  };
}
