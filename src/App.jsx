import { useState, useCallback, useRef, useEffect } from "react";
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
  const [finishCurrentLaneFn, setFinishCurrentLaneFn] = useState(null);
  const [resetGameFn, setResetGameFn] = useState(null);
  const [registerCollisionCallbackFn, setRegisterCollisionCallbackFn] =
    useState(null);
  const scrollContainerRef = useRef(null);

  // Handle when jump function is ready from game
  const handleJumpReady = useCallback(
    (jumpFn, getMultiplierFn, finishLaneFn, resetFn, registerCollisionFn) => {
      setJumpChickenFn(() => jumpFn);
      setGetCurrentMultiplierFn(() => getMultiplierFn);
      setFinishCurrentLaneFn(() => finishLaneFn);
      setResetGameFn(() => resetFn);
      setRegisterCollisionCallbackFn(() => registerCollisionFn);
    },
    [],
  );

  // Handle play/go button click
  const handlePlay = useCallback(() => {
    // REQUIREMENT: Block input during death sequence (when gameState is "lost")
    // Input is restored when handleResetComplete() is called after death sequence
    if (gameState === "lost") {
      return; // Block all input during death/reset - will be restored by handleResetComplete
    }

    if (gameState === "idle" || gameState === "won") {
      // Start new game
      if (balance < betAmount) {
        alert("Insufficient balance!");
        return;
      }

      // Reset game if coming from won state
      if (gameState === "won" && resetGameFn) {
        resetGameFn();
      }

      setBalance((prev) => prev - betAmount);
      setGameState("playing");
      setScore(0);

      // CRITICAL: Start the PixiJS game engine (enables car spawning & movement)
      const game = window.__GAME_INSTANCE__;
      if (game) {
        game.state = "playing";
      }

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
      // Jump chicken (only when playing)
      if (jumpChickenFn) {
        const success = jumpChickenFn();
        if (success) {
          setScore((prev) => prev + 1);
        } else {
          // Chicken reached the end - turn current lane's coin to gold and calculate winnings
          if (finishCurrentLaneFn) {
            finishCurrentLaneFn();
          }

          if (getCurrentMultiplierFn) {
            const multiplier = getCurrentMultiplierFn();
            const winnings = betAmount * multiplier;
            const totalPayout = betAmount + winnings; // Return original bet + winnings

            setBalance((prev) => prev + totalPayout);
            setGameState("won");
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
    finishCurrentLaneFn,
    resetGameFn,
  ]);

  // Handle collision with car
  // REQUIREMENT: Set gameState to "lost" to lock input during death sequence
  // Death animation, timing, and reset are handled by game logic (decoupled)
  const handleCollision = useCallback(() => {
    if (gameState !== "playing") return;

    // REQUIREMENT: Set state to "lost" to immediately lock user input
    setGameState("lost");

    // REQUIREMENT: Reset score (current run's "Golds") - NOT permanent balance/possessions
    setScore(0);

    // Note: Death sequence (animation + delay + reset) is handled in game logic
    // After reset completes, game will call onResetComplete to restore state
  }, [gameState]);

  // Handle reset complete - restore game state after death sequence
  const handleResetComplete = useCallback(() => {
    // CRITICAL: Set gameState to "idle" to show Play button
    // User must click Play to start a new game
    setGameState("idle");
  }, []);

  // Register collision callback when game is ready
  useEffect(() => {
    if (registerCollisionCallbackFn) {
      registerCollisionCallbackFn(handleCollision, handleResetComplete);
    }
  }, [registerCollisionCallbackFn, handleCollision, handleResetComplete]);

  // Handle cashout button click
  const handleCashout = useCallback(() => {
    if (gameState !== "playing") return;

    // Turn current lane's coin to gold before cashing out
    if (finishCurrentLaneFn) {
      finishCurrentLaneFn();
    }

    // Get current multiplier from game
    const multiplier = getCurrentMultiplierFn ? getCurrentMultiplierFn() : 1.0;

    // Calculate final price: bet amount * multiplier + original bet
    const winnings = betAmount * multiplier;
    const totalPayout = betAmount + winnings; // Return original bet + winnings

    setBalance((prev) => prev + totalPayout);
    setGameState("won");

    // Reset game after cashout
    if (resetGameFn) {
      setTimeout(() => {
        resetGameFn();
      }, 100);
    }
  }, [
    gameState,
    betAmount,
    getCurrentMultiplierFn,
    finishCurrentLaneFn,
    resetGameFn,
  ]);

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
