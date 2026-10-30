import { IaIcone } from "./IaIcone";
import "./LumenAIButton.css";

export function LumenAIButton({ children, className = "", type = "button", ...props }) {
  return (
    <button type={type} className={`lumen-ai-btn ${className}`.trim()} {...props}>
      <span className="lumen-ai-btn__border" aria-hidden="true">
        <span className="lumen-ai-btn__spin" />
        <span className="lumen-ai-btn__fill" />
      </span>
      <span className="lumen-ai-btn__content">
        <IaIcone size={16} />
        {children}
      </span>
    </button>
  );
}

export default LumenAIButton;
