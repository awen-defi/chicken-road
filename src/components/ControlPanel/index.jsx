import { useState, useEffect } from "react";
import { DollarIcon } from "../DollarIcon";
import "./index.css";

/**
 * Helper function to round currency to 2 decimal places
 * Prevents floating-point precision issues
 */
const roundCurrency = (amount) => {
  return Math.round(amount * 100) / 100;
};

export function ControlPanel({
  betAmount,
  setBetAmount,
  difficulty,
  setDifficulty,
  onPlay,
  onCashout,
  gameState = "idle",
  disabled = false,
  currentMultiplier = 1.0,
}) {
  const [sliderValue, setSliderValue] = useState(1);

  const betOptions = [0.5, 1, 2, 7];
  const difficultyLevels = ["Easy", "Medium", "Hard", "Hardcore"];

  // Sync slider value with bet amount
  useEffect(() => {
    setSliderValue(betAmount);
  }, [betAmount]);

  const handleSliderChange = (value) => {
    const newValue = parseFloat(value);
    setSliderValue(newValue);
    setBetAmount(newValue);
  };

  const isPlaying = gameState === "playing";
  const buttonText = isPlaying ? "GO" : "Play";

  // Calculate cashout value with proper rounding
  const cashoutValue = roundCurrency(betAmount * currentMultiplier);

  return (
    <div className="control-panel">
      <div className="control-panel-content">
        {/* Bet Amount and Slider Section */}
        <div className="bet-section">
          <div className="slider-container">
            <button
              className="slider-label"
              onClick={() => !disabled && handleSliderChange(1)}
              disabled={disabled}
            >
              MIN
            </button>
            <div className="slider-value">{sliderValue.toFixed(1)}</div>
            <button
              className="slider-label"
              onClick={() => !disabled && handleSliderChange(200)}
              disabled={disabled}
            >
              MAX
            </button>
          </div>

          <div className="bet-buttons">
            {betOptions.map((amount) => (
              <button
                key={amount}
                className={`bet-button ${betAmount === amount ? "active" : ""}`}
                onClick={() => !disabled && setBetAmount(amount)}
                disabled={disabled}
              >
                {amount} <DollarIcon size="small" />
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Section */}
        <div className="difficulty-section">
          <div className="section-header">
            <span>Difficulty</span>
            <span className="chance">Chance of being shot down</span>
          </div>
          <div className="difficulty-buttons">
            {difficultyLevels.map((level) => (
              <span
                key={level}
                className={`difficulty-button ${difficulty === level ? "active" : ""}`}
                onClick={() => !disabled && setDifficulty(level)}
                disabled={disabled}
              >
                {level}
              </span>
            ))}
          </div>
        </div>

        <div className="buttons">
          {/* Cashout Button - only visible when playing */}
          {isPlaying && (
            <button className="cashout-button" onClick={onCashout}>
              CASH OUT
              <br />
              {cashoutValue.toFixed(2)} USD
            </button>
          )}

          {/* Play Button */}
          <button
            className={`play-button ${isPlaying ? "go-button" : ""}`}
            onClick={onPlay}
            disabled={gameState === "won" || gameState === "lost"}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
