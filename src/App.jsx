import { useState, useCallback, useRef } from "react";
import "./App.css";
import { Header, GameArea, ControlPanel } from "./components";

export default function App() {
  const [balance, setBalance] = useState(1000000);
  const [betAmount, setBetAmount] = useState(1);
  const [difficulty, setDifficulty] = useState("Easy"); // Easy, Medium, Hard, Hardcore
  const [gameState, setGameState] = useState("idle"); // idle, playing, won, lost
  const [score, setScore] = useState(0);
  const [jumpChickenFn, setJumpChickenFn] = useState(null);
  const [getCurrentMultiplierFn, setGetCurrentMultiplierFn] = useState(null);
  const [resetGameFn, setResetGameFn] = useState(null);
  const scrollContainerRef = useRef(null);

  // Handle when jump function is ready from game
  const handleJumpReady = useCallback((jumpFn, getMultiplierFn, resetFn) => {
    setJumpChickenFn(() => jumpFn);
    setGetCurrentMultiplierFn(() => getMultiplierFn);
    setResetGameFn(() => resetFn);
  }, []);

  // Handle play/go button click
  const handlePlay = useCallback(() => {
    if (gameState === "idle" || gameState === "won" || gameState === "lost") {
      // Start new game
      if (balance < betAmount) {
        alert("Insufficient balance!");
        return;
      }

      // Reset game if coming from won/lost state
      if ((gameState === "won" || gameState === "lost") && resetGameFn) {
        resetGameFn();
      }

      setBalance((prev) => prev - betAmount);
      setGameState("playing");
      setScore(0);

      // Automatically jump to first road line when game starts
      if (jumpChickenFn) {
        setTimeout(() => {
          const success = jumpChickenFn();
          if (success) {
            setScore(1); // First jump counts as score
          }
        }, 100); // Small delay to ensure game state is updated
      }
    } else if (gameState === "playing") {
      // Jump chicken
      if (jumpChickenFn) {
        const success = jumpChickenFn();
        if (success) {
          setScore((prev) => prev + 1);
        } else {
          // Chicken reached the end - calculate winnings
          if (getCurrentMultiplierFn) {
            const multiplier = getCurrentMultiplierFn();
            const winnings = betAmount * multiplier;
            const totalPayout = betAmount + winnings; // Return original bet + winnings

            setBalance((prev) => prev + totalPayout);
            setGameState("won");

            console.log(
              `🎉 Game Won! Multiplier: ${multiplier}x, Winnings: $${winnings.toFixed(2)}, Total Payout: $${totalPayout.toFixed(2)}`,
            );
          }
        }
      }
    }
  }, [
    gameState,
    betAmount,
    balance,
    jumpChickenFn,
    getCurrentMultiplierFn,
    resetGameFn,
  ]);

  // Handle cashout button click
  const handleCashout = useCallback(() => {
    if (gameState !== "playing") return;

    // Get current multiplier from game
    const multiplier = getCurrentMultiplierFn ? getCurrentMultiplierFn() : 1.0;

    // Calculate final price: bet amount * multiplier + original bet
    const winnings = betAmount * multiplier;
    const totalPayout = betAmount + winnings; // Return original bet + winnings

    setBalance((prev) => prev + totalPayout);
    setGameState("won");

    console.log(
      `💰 Cashed out! Multiplier: ${multiplier}x, Winnings: $${winnings.toFixed(2)}, Total Payout: $${totalPayout.toFixed(2)}`,
    );
  }, [gameState, betAmount, getCurrentMultiplierFn]);

  return (
    <div className="app-container">
      <Header balance={balance} />
      <GameArea
        onJumpReady={handleJumpReady}
        scrollContainerRef={scrollContainerRef}
        difficulty={difficulty}
      />
      <ControlPanel
        betAmount={betAmount}
        setBetAmount={setBetAmount}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        onPlay={handlePlay}
        onCashout={handleCashout}
        gameState={gameState}
        score={score}
        disabled={gameState === "playing"}
      />
    </div>
  );
}
