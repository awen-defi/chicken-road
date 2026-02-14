import { useState, useCallback } from "react";
import "./App.css";
import { Header, GameArea, ControlPanel } from "./components";

export default function App() {
  const [balance, setBalance] = useState(1000000);
  const [betAmount, setBetAmount] = useState(1);
  const [difficulty, setDifficulty] = useState("Easy");
  const [gameState, setGameState] = useState("idle"); // idle, playing, won, lost
  const [score, setScore] = useState(0);
  const [multipliers] = useState([1.01, 1.03, 1.06, 1.1, 1.15, 1.19]);

  // Handle play/go button click
  const handlePlay = useCallback(() => {
    if (gameState === "idle") {
      // Start new game
      if (balance < betAmount) {
        alert("Insufficient balance!");
        return;
      }
      setBalance((prev) => prev - betAmount);
      setGameState("playing");
      setScore(0);
    }
  }, [gameState, betAmount, balance]);

  // Handle game over
  const handleGameOver = useCallback(() => {
    setGameState("lost");
    setTimeout(() => {
      setGameState("idle");
      setScore(0);
    }, 2000);
  }, []);

  // Handle coin collection
  const handleCoinCollect = useCallback((coinValue) => {
    setScore((prev) => prev + coinValue);
    // Add coin value to potential winnings
    setBalance((prev) => prev + coinValue);
  }, []);

  // Handle jump (Go button click during gameplay)
  const handleJump = useCallback(() => {
    // Jump logic is handled in CanvasGameArea
    // This is just for tracking jumps if needed
  }, []);

  return (
    <div className="app-container">
      <Header balance={balance} />
      <GameArea
        gameState={gameState}
        difficulty={difficulty}
        onGameOver={handleGameOver}
        onCoinCollect={handleCoinCollect}
        onJump={handleJump}
      />
      <ControlPanel
        betAmount={betAmount}
        setBetAmount={setBetAmount}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        onPlay={handlePlay}
        gameState={gameState}
        score={score}
        disabled={gameState === "playing"}
      />
    </div>
  );
}
