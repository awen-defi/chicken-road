import { useState, useCallback } from "react";
import "./App.css";
import { Header, GameArea, ControlPanel } from "./components";

export default function App() {
  const [balance, setBalance] = useState(1000000);
  const [betAmount, setBetAmount] = useState(1);
  const [difficulty, setDifficulty] = useState("Easy"); // Easy, Medium, Hard, Hardcore
  const [gameState, setGameState] = useState("idle"); // idle, playing, won, lost
  const [score, setScore] = useState(0);

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

  return (
    <div className="app-container">
      <Header balance={balance} />
      <GameArea />
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
