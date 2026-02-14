import "./index.css";
import { DollarIcon } from "../DollarIcon";

export function Header({ balance = 1000000 }) {
  const formatBalance = (num) => {
    return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  return (
    <div className="header">
      <div className="logo-container">
        <img src="/logo.png" alt="Chicken Road" className="logo" />
      </div>

      <div className="header-actions">
        <div className="how-to-play">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="8"
              cy="8"
              r="7"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M8 11V8M8 5H8.01"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span>How to play?</span>
        </div>

        <div className="balance">
          {formatBalance(balance)}
          <DollarIcon />
        </div>

        <div className="fullscreen-button">
          <svg
            width="12"
            height="13"
            viewBox="0 0 12 13"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7.33268 5.1665L11.3327 1.1665M11.3327 1.1665H8.33268M11.3327 1.1665V4.1665M0.666016 1.1665L4.66602 5.1665M0.666016 1.1665V4.1665M0.666016 1.1665H3.66602M7.33268 7.83317L11.3327 11.8332M11.3327 11.8332V8.83317M11.3327 11.8332H8.33268M4.66602 7.83317L0.666016 11.8332M0.666016 11.8332H3.66602M0.666016 11.8332L0.666016 8.83317"
              stroke="white"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
        </div>

        <div className="menu-button">
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line
              x1="2"
              y1="4.5"
              x2="16"
              y2="4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="2"
              y1="9"
              x2="16"
              y2="9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="2"
              y1="13.5"
              x2="16"
              y2="13.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
