// Ícones Phosphor inline (herdam currentColor). Lista explícita: o bundle leva só o que a página usa.
import i0 from "@phosphor-icons/core/assets/regular/arrow-right.svg?raw";
import i1 from "@phosphor-icons/core/assets/regular/arrow-up-right.svg?raw";
import i2 from "@phosphor-icons/core/assets/regular/brackets-curly.svg?raw";
import i3 from "@phosphor-icons/core/assets/regular/browser.svg?raw";
import i4 from "@phosphor-icons/core/assets/regular/buildings.svg?raw";
import i5 from "@phosphor-icons/core/assets/regular/calendar-check.svg?raw";
import i6 from "@phosphor-icons/core/assets/regular/caret-right.svg?raw";
import i7 from "@phosphor-icons/core/assets/regular/chalkboard-teacher.svg?raw";
import i8 from "@phosphor-icons/core/assets/regular/chat-circle-text.svg?raw";
import i9 from "@phosphor-icons/core/assets/regular/chats-circle.svg?raw";
import i10 from "@phosphor-icons/core/assets/regular/check.svg?raw";
import i11 from "@phosphor-icons/core/assets/bold/check-bold.svg?raw";
import i12 from "@phosphor-icons/core/assets/regular/check-circle.svg?raw";
import i13 from "@phosphor-icons/core/assets/regular/clipboard-text.svg?raw";
import i14 from "@phosphor-icons/core/assets/regular/clock.svg?raw";
import i15 from "@phosphor-icons/core/assets/fill/cursor-fill.svg?raw";
import i16 from "@phosphor-icons/core/assets/regular/desktop-tower.svg?raw";
import i17 from "@phosphor-icons/core/assets/regular/device-mobile.svg?raw";
import i18 from "@phosphor-icons/core/assets/regular/envelope-simple.svg?raw";
import i19 from "@phosphor-icons/core/assets/regular/file-pdf.svg?raw";
import i20 from "@phosphor-icons/core/assets/regular/folder-open.svg?raw";
import i21 from "@phosphor-icons/core/assets/regular/graduation-cap.svg?raw";
import i22 from "@phosphor-icons/core/assets/regular/info.svg?raw";
import i23 from "@phosphor-icons/core/assets/regular/magnifying-glass.svg?raw";
import i24 from "@phosphor-icons/core/assets/regular/paperclip.svg?raw";
import i25 from "@phosphor-icons/core/assets/regular/push-pin.svg?raw";
import i26 from "@phosphor-icons/core/assets/regular/scales.svg?raw";
import i27 from "@phosphor-icons/core/assets/regular/seal-check.svg?raw";
import i28 from "@phosphor-icons/core/assets/regular/shield-check.svg?raw";
import i29 from "@phosphor-icons/core/assets/fill/sparkle-fill.svg?raw";
import i30 from "@phosphor-icons/core/assets/regular/squares-four.svg?raw";
import i31 from "@phosphor-icons/core/assets/regular/star.svg?raw";
import i32 from "@phosphor-icons/core/assets/fill/star-fill.svg?raw";
import i33 from "@phosphor-icons/core/assets/regular/table.svg?raw";
import i34 from "@phosphor-icons/core/assets/regular/trend-up.svg?raw";
import i35 from "@phosphor-icons/core/assets/regular/users.svg?raw";
import i36 from "@phosphor-icons/core/assets/regular/warning-circle.svg?raw";
import i37 from "@phosphor-icons/core/assets/regular/x.svg?raw";
import logoIcon from "./assets/logo-icon.svg?raw";
import logoFull from "./assets/logo-full.svg?raw";

const ICONS = {
  "arrow-right": i0,
  "arrow-up-right": i1,
  "brackets-curly": i2,
  "browser": i3,
  "buildings": i4,
  "calendar-check": i5,
  "caret-right": i6,
  "chalkboard-teacher": i7,
  "chat-circle-text": i8,
  "chats-circle": i9,
  "check": i10,
  "check-bold": i11,
  "check-circle": i12,
  "clipboard-text": i13,
  "clock": i14,
  "cursor-fill": i15,
  "desktop-tower": i16,
  "device-mobile": i17,
  "envelope-simple": i18,
  "file-pdf": i19,
  "folder-open": i20,
  "graduation-cap": i21,
  "info": i22,
  "magnifying-glass": i23,
  "paperclip": i24,
  "push-pin": i25,
  "scales": i26,
  "seal-check": i27,
  "shield-check": i28,
  "sparkle-fill": i29,
  "squares-four": i30,
  "star": i31,
  "star-fill": i32,
  "table": i33,
  "trend-up": i34,
  "users": i35,
  "warning-circle": i36,
  "x": i37,
};

// marca: verde vira currentColor no ícone; no logo completo só o texto acompanha o tema
const mark = logoIcon.replace(/#1F7A5A/gi, "currentColor").replace(/width="28" height="28"/, 'width="100%" height="100%"');
const full = logoFull.replace(/#0A0A0A/gi, "currentColor").replace(/width="101" height="20"/, 'width="101" height="20" role="img" aria-hidden="true"');

export function mountIcons(root = document) {
  root.querySelectorAll("[data-i]").forEach((el) => {
    if (!el.firstElementChild && ICONS[el.dataset.i]) el.innerHTML = ICONS[el.dataset.i];
  });
  root.querySelectorAll("[data-logo-mark]").forEach((el) => (el.innerHTML = mark));
  root.querySelectorAll("[data-logo-full]").forEach((el) => (el.innerHTML = full));
}
