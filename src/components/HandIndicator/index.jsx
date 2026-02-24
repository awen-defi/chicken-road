import { memo, useLayoutEffect, useRef } from "react";
import "./index.css";

/**
 * HandIndicator - Animated hand pointer for UI guidance
 * Points to target button with GPU-accelerated animations
 */
export const HandIndicator = memo(function HandIndicator({
  targetButton, // "GO" or "CASHOUT"
  visible = false,
}) {
  const handRef = useRef(null);

  useLayoutEffect(() => {
    if (!visible || !targetButton || !handRef.current) return;

    const updatePosition = () => {
      const button = document.querySelector(
        targetButton === "GO" ? ".play-button" : ".cashout-button",
      );

      if (button && handRef.current) {
        const rect = button.getBoundingClientRect();
        // Position hand 80px left of button, centered vertically
        handRef.current.style.left = `${rect.left - 80}px`;
        handRef.current.style.top = `${rect.top + rect.height / 2 - 30}px`;
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [visible, targetButton]);

  if (!visible) return null;

  return (
    <div ref={handRef} className="hand-indicator">
      <div className="hand-emoji">👉</div>
    </div>
  );
});
