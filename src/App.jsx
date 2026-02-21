import { useState, useCallback, useRef, useEffect } from "react";
import "./App.css";
import { Header, GameArea, ControlPanel } from "./components";

/**
 * Helper function to round currency to 2 decimal places
 * Prevents floating-point precision issues
 */
const roundCurrency = (amount) => {
  return Math.round(amount * 100) / 100;
};

export default function App() {
  const [balance, setBalance] = useState(1000000);
  const [betAmount, setBetAmount] = useState(1);
  const [difficulty, setDifficulty] = useState("Easy"); // Easy, Medium, Hard, Hardcore
  const [gameState, setGameState] = useState("idle"); // idle, playing, won, lost
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0); // Current multiplier for dynamic cashout button
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

      // Hide any existing win notification
      const game = window.__GAME_INSTANCE__;
      if (game && game.hideWinNotification) {
        game.hideWinNotification();
      }

      setBalance((prev) => roundCurrency(prev - betAmount));
      setGameState("playing");

      // CRITICAL: Start the PixiJS game engine (enables car spawning & movement)
      if (game) {
        game.state = "playing";
      }

      // Automatically jump to first road line when game starts
      if (jumpChickenFn) {
        setTimeout(() => {
          jumpChickenFn();
        }, 100); // Small delay to ensure game state is updated
      }
    } else if (gameState === "playing") {
      // Jump chicken (only when playing)
      if (jumpChickenFn) {
        // Define win sequence callback to trigger automatically on finish line landing
        const triggerWinSequence = () => {
          // AUTOMATIC WIN SEQUENCE - triggered when chicken lands on finish line
          // Step 1: Final coin already turned gold (before jump started)

          // Step 2: Calculate winnings with proper rounding
          if (getCurrentMultiplierFn) {
            const multiplier = getCurrentMultiplierFn();
            const winnings = roundCurrency(betAmount * multiplier);
            const totalPayout = roundCurrency(betAmount + winnings); // Original bet + winnings

            // Step 3: Update balance and lock controls immediately
            setBalance((prev) => roundCurrency(prev + totalPayout));
            setGameState("won");

            // Step 4: Show win notification
            const game = window.__GAME_INSTANCE__;
            if (game && game.showWinNotification) {
              game.showWinNotification(winnings, 3000); // 3 seconds for auto-win
            }

            // Step 5: Pause game systems (stop car spawning)
            if (game) {
              game.state = "idle"; // Stop car spawning during win sequence
            }

            // Step 6: Wait 3 seconds, then auto-reset to start position
            setTimeout(() => {
              if (resetGameFn) {
                resetGameFn();
              }
              // Return to idle state to show PLAY button
              setGameState("idle");
            }, 3000); // 3-second victory display
          }
        };

        // Jump with finish callback
        jumpChickenFn(triggerWinSequence);
        // Note: Win sequence now triggers automatically via callback, no manual trigger needed
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

  // Handle collision with car
  // REQUIREMENT: Set gameState to "lost" to lock input during death sequence
  // Death animation, timing, and reset are handled by game logic (decoupled)
  const handleCollision = useCallback(() => {
    if (gameState !== "playing") return;

    // REQUIREMENT: Set state to "lost" to immediately lock user input
    setGameState("lost");

    // REQUIREMENT: Reset score (current run's "Golds") - NOT permanent balance/possessions

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

  // Update current multiplier in real-time while playing
  // PERFORMANCE: Use requestAnimationFrame for smooth 60fps updates synced with render
  useEffect(() => {
    if (gameState !== "playing" || !getCurrentMultiplierFn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentMultiplier(1.0);
      return;
    }

    let animationFrameId;
    let lastUpdateTime = 0;
    const updateInterval = 100; // Update state max every 100ms to avoid excessive re-renders

    const updateMultiplier = (timestamp) => {
      // Throttle updates to every 100ms to prevent excessive React re-renders
      if (timestamp - lastUpdateTime >= updateInterval) {
        const multiplier = getCurrentMultiplierFn();
        setCurrentMultiplier(multiplier);
        lastUpdateTime = timestamp;
      }
      animationFrameId = requestAnimationFrame(updateMultiplier);
    };

    animationFrameId = requestAnimationFrame(updateMultiplier);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [gameState, getCurrentMultiplierFn]);

  // Handle cashout button click
  const handleCashout = useCallback(() => {
    if (gameState !== "playing") return;

    // Turn current lane's coin to gold before cashing out
    if (finishCurrentLaneFn) {
      finishCurrentLaneFn();
    }

    // Get current multiplier from game
    const multiplier = getCurrentMultiplierFn ? getCurrentMultiplierFn() : 1.0;

    // Calculate final price with proper rounding: bet amount * multiplier + original bet
    const winnings = roundCurrency(betAmount * multiplier);
    const totalPayout = roundCurrency(winnings); // Return original bet + winnings

    setBalance((prev) => roundCurrency(prev + totalPayout));
    setGameState("won");

    // Show win notification
    const game = window.__GAME_INSTANCE__;
    if (game && game.showWinNotification) {
      game.showWinNotification(winnings, 2000); // 2 seconds for manual cashout
    }

    // Pause game systems (stop car spawning)
    if (game) {
      game.state = "idle"; // Stop car spawning during cashout
    }

    // Reset game after notification is visible (2-second delay for manual cashout)
    if (resetGameFn) {
      setTimeout(() => {
        resetGameFn();
        // Return to idle state to show PLAY button
        setGameState("idle");
      }, 2100); // Slightly longer than notification duration
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
        disabled={gameState === "playing"}
        currentMultiplier={currentMultiplier}
      />
    </div>
  );
}
