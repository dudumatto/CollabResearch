import logo from "./assets/logo-icon.svg?raw";
import atom from "@phosphor-icons/core/assets/light/atom-light.svg?raw";
import microscope from "@phosphor-icons/core/assets/light/microscope-light.svg?raw";
import usersThree from "@phosphor-icons/core/assets/light/users-three-light.svg?raw";
import calendarCheck from "@phosphor-icons/core/assets/light/calendar-check-light.svg?raw";
import chartLineUp from "@phosphor-icons/core/assets/light/chart-line-up-light.svg?raw";
import stack from "@phosphor-icons/core/assets/light/stack-light.svg?raw";
import magnifyingGlass from "@phosphor-icons/core/assets/light/magnifying-glass-light.svg?raw";
import fileArrowUp from "@phosphor-icons/core/assets/light/file-arrow-up-light.svg?raw";
import chatCircleDots from "@phosphor-icons/core/assets/light/chat-circle-dots-light.svg?raw";
import sealCheck from "@phosphor-icons/core/assets/light/seal-check-light.svg?raw";
import folderOpen from "@phosphor-icons/core/assets/light/folder-open-light.svg?raw";
import arrowUpRight from "@phosphor-icons/core/assets/light/arrow-up-right-light.svg?raw";
import sparkle from "@phosphor-icons/core/assets/light/sparkle-light.svg?raw";
import checkCircle from "@phosphor-icons/core/assets/light/check-circle-light.svg?raw";
import envelope from "@phosphor-icons/core/assets/light/envelope-simple-light.svg?raw";
import table from "@phosphor-icons/core/assets/light/table-light.svg?raw";
import eyeSlash from "@phosphor-icons/core/assets/light/eye-slash-light.svg?raw";
import graduationCap from "@phosphor-icons/core/assets/light/graduation-cap-light.svg?raw";
import teacher from "@phosphor-icons/core/assets/light/chalkboard-teacher-light.svg?raw";

export const ICONS = {
  atom, microscope, "users-three": usersThree, "calendar-check": calendarCheck,
  "chart-line-up": chartLineUp, stack, "magnifying-glass": magnifyingGlass,
  "file-arrow-up": fileArrowUp, "chat-circle-dots": chatCircleDots, "seal-check": sealCheck,
  "folder-open": folderOpen, "arrow-up-right": arrowUpRight, sparkle, "check-circle": checkCircle,
  "envelope-simple": envelope, table, "eye-slash": eyeSlash, "graduation-cap": graduationCap,
  "chalkboard-teacher": teacher,
};

/** Troca [data-icon] e [data-logo] pelo SVG inline (herda currentColor). */
export function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((el) => {
    if (!el.firstElementChild && ICONS[el.dataset.icon]) el.innerHTML = ICONS[el.dataset.icon];
  });
  const mark = logo.replace(/#1F7A5A/gi, "currentColor").replace(/width="28" height="28"/, 'width="100%" height="100%"');
  root.querySelectorAll("[data-logo]").forEach((el) => (el.innerHTML = mark));
}
