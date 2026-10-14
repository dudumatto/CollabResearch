import { useCallback, useEffect, useRef, useState } from "react";
import { Tooltip } from "antd";

const LONG_PRESS_MS = 500;
const AUTO_CLOSE_MS = 4000;

const isTouchOnly = () =>
  typeof window !== "undefined" && Boolean(window.matchMedia?.("(hover: none)").matches);

/**
 * Tooltip do botão Lumen.
 * Desktop: aparece no hover/foco.
 * Touch: um toque só aciona o botão; o tooltip abre apenas com toque longo.
 */
export function LumenTooltip({ title, placement = "top", className, children }) {
  const [touch] = useState(isTouchOnly);
  const [open, setOpen] = useState(false);
  const pressTimer = useRef(null);
  const closeTimer = useRef(null);

  const clearTimers = useCallback(() => {
    clearTimeout(pressTimer.current);
    clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const style = { maxWidth: 340 };

  if (!touch) {
    return (
      <Tooltip title={title} placement={placement} styles={{ root: style }}>
        {children}
      </Tooltip>
    );
  }

  const cancelPress = () => clearTimeout(pressTimer.current);

  const startPress = () => {
    clearTimers();
    setOpen(false);
    pressTimer.current = setTimeout(() => {
      setOpen(true);
      closeTimer.current = setTimeout(() => setOpen(false), AUTO_CLOSE_MS);
    }, LONG_PRESS_MS);
  };

  return (
    <Tooltip title={title} placement={placement} trigger={[]} open={open} styles={{ root: style }}>
      <span
        className={className}
        style={{ display: "inline-flex",WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none" }}
        onTouchStart={startPress}
        onTouchMove={cancelPress}
        onTouchEnd={cancelPress}
        onTouchCancel={cancelPress}
        onContextMenu={(event) => event.preventDefault()}
      >
        {children}
      </span>
    </Tooltip>
  );
}

export default LumenTooltip;
