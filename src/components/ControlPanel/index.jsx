import { useState, useEffect } from "react";
import { DollarIcon } from "../DollarIcon";
import "./index.css";

export function ControlPanel({
  betAmount,
  setBetAmount,
  difficulty,
  setDifficulty,
  onPlay,
  gameState = "idle",
  score = 0,
  disabled = false,
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
  const buttonText = isPlaying ? "GO" : "PLAY";

  return (
    <div className="control-panel">
      <div className="control-panel-content">
        {/* Bet Amount and Slider Section */}
        <div className="bet-section">
          <div className="slider-container">
            <button
              className="slider-label"
              onClick={() => !disabled && handleSliderChange(0.1)}
              disabled={disabled}
            >
              MIN
            </button>
            <div className="slider-value">{sliderValue.toFixed(1)}</div>
            <button
              className="slider-label"
              onClick={() => !disabled && handleSliderChange(10)}
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
          </div>
          <div className="difficulty-buttons">
            {difficultyLevels.map((level) => (
              <button
                key={level}
                className={`difficulty-button ${difficulty === level ? "active" : ""}`}
                onClick={() => !disabled && setDifficulty(level)}
                disabled={disabled}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Chance Indicator */}
        <div className="chance-section">
          <div className="section-header">
            <span>
              {isPlaying ? `Score: ${score}` : "Chance of being shot down"}
            </span>
          </div>
        </div>

        {/* Play Button */}
        <button
          className={`play-button ${isPlaying ? "go-button" : ""}`}
          onClick={onPlay}
          disabled={isPlaying}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
