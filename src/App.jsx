import { useState, useCallback, useRef, useEffect } from "react";
import "./App.css";
import {
  Header,
  GameArea,
  ControlPanel,
  LoadingScreen,
  HandIndicator,
} from "./components";
import { gameEvents } from "./game/core/GameEventBus.js";

/**
 * Helper function to round currency to 2 decimal places
 * Prevents floating-point precision issues
 */
const roundCurrency = (amount) => {
  return Math.round(amount * 100) / 100;
};

export default function App() {
  // Financial state
  const [balance, setBalance] = useState(20);
  const [betAmount, setBetAmount] = useState(1);
  const [difficulty, setDifficulty] = useState("Easy");

  // Game state: idle, playing, atFinish, won, lost
  const [gameState, setGameState] = useState("idle");

  // UI state
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);

  // Game function references
  const [jumpChickenFn, setJumpChickenFn] = useState(null);
  const [getCurrentMultiplierFn, setGetCurrentMultiplierFn] = useState(null);
  const [finishCurrentLaneFn, setFinishCurrentLaneFn] = useState(null);
  const [resetGameFn, setResetGameFn] = useState(null);
  const [registerCollisionCallbackFn, setRegisterCollisionCallbackFn] =
    useState(null);
  const scrollContainerRef = useRef(null);

  // Loading state
  const [isGameLoading, setIsGameLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);

  // Refs for instant access
  const multiplierRef = useRef(1.0);
  const currentLaneRef = useRef(0);

  // Handle loading state from GameArea
  const handleLoadingChange = useCallback(({ isLoading, loadingError }) => {
    setIsGameLoading(isLoading);
    setLoadingError(loadingError || null);
  }, []);

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
    // Block input during death sequence or at finish
    if (gameState === "lost" || gameState === "atFinish") {
      return;
    }

    if (gameState === "idle" || gameState === "won") {
      // Start new game
      if (balance < betAmount) {
        alert("Insufficient balance!");
        return;
      }

      if (gameState === "won" && resetGameFn) {
        resetGameFn();
      }

      const game = window.__GAME_INSTANCE__;
      if (game && game.hideWinNotification) {
        game.hideWinNotification();
      }

      setBalance((prev) => roundCurrency(prev - betAmount));
      setGameState("playing");
      setCurrentMultiplier(1.0);
      multiplierRef.current = 1.0;

      if (game) {
        game.state = "playing";
      }

      // Auto-jump to first lane
      if (jumpChickenFn) {
        setTimeout(() => jumpChickenFn(), 100);
      }
    } else if (gameState === "playing") {
      // Normal jump during gameplay
      if (jumpChickenFn) {
        jumpChickenFn();
      }
    }
  }, [gameState, betAmount, balance, jumpChickenFn, resetGameFn]);

  // Handle collision with car
  const handleCollision = useCallback(() => {
    if (gameState !== "playing" && gameState !== "atFinish") return;

    setGameState("lost");
  }, [gameState]);

  // Handle reset complete - restore game state after death sequence
  const handleResetComplete = useCallback(() => {
    setGameState("idle");
    setCurrentMultiplier(1.0);
    multiplierRef.current = 1.0;
  }, []);

  // Handle win complete - restore game state after win animation
  const handleWinComplete = useCallback(() => {
    if (resetGameFn) {
      resetGameFn();
    }

    setGameState("idle");
    setCurrentMultiplier(1.0);
    multiplierRef.current = 1.0;
  }, [resetGameFn]);

  // Register collision callback when game is ready
  useEffect(() => {
    if (registerCollisionCallbackFn) {
      registerCollisionCallbackFn(handleCollision, handleResetComplete);
    }
  }, [registerCollisionCallbackFn, handleCollision, handleResetComplete]);

  // Listen for lane changes to detect finish line
  useEffect(() => {
    if (gameState !== "playing") return;

    const handleLaneChange = ({ laneIndex }) => {
      const game = window.__GAME_INSTANCE__;
      const totalLanes = game?.coinManager?.coins?.length || 0;

      currentLaneRef.current = laneIndex;

      // Check if reached finish line (beyond all coins)
      if (laneIndex >= totalLanes) {
        setGameState("atFinish");
        gameEvents.emit("game:finished", {
          laneIndex,
          multiplier: multiplierRef.current,
        });
      }
    };

    const unsubscribe = gameEvents.on("lane:changed", handleLaneChange);
    return () => unsubscribe();
  }, [gameState]);

  // Update current multiplier in real-time while playing
  useEffect(() => {
    if (gameState !== "playing" && gameState !== "atFinish") {
      return;
    }

    if (!getCurrentMultiplierFn) {
      return;
    }

    let animationFrameId;
    let lastUpdateTime = 0;
    const updateInterval = 100; // Update every 100ms

    const updateMultiplier = (timestamp) => {
      if (timestamp - lastUpdateTime >= updateInterval) {
        const multiplier = getCurrentMultiplierFn();

        // Update both state (for UI) and ref (for instant access)
        setCurrentMultiplier(multiplier);
        multiplierRef.current = multiplier;

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

  // Handle cashout - trigger win animation and payout
  const handleCashout = useCallback(() => {
    if (gameState !== "atFinish") return;

    // Turn current lane's coin to gold
    if (finishCurrentLaneFn) {
      finishCurrentLaneFn();
    }

    // Calculate winnings using ref for instant value
    const multiplier = multiplierRef.current;
    const winnings = roundCurrency(betAmount * multiplier);

    // Update balance
    setBalance((prev) => roundCurrency(prev + winnings));

    // Show win notification animation
    const game = window.__GAME_INSTANCE__;
    if (game && game.showWinNotification) {
      game.showWinNotification(winnings, 3000);
    }

    // Transition to won state
    setGameState("won");

    // Reset to idle after win animation completes
    setTimeout(() => {
      handleWinComplete();
    }, 3100); // Slightly longer than notification duration
  }, [gameState, finishCurrentLaneFn, betAmount, handleWinComplete]);

  return (
    <div className="app-container">
      <LoadingScreen isLoading={isGameLoading} />
      {loadingError && (
        <div className="loading-error">
          <p>Error: {loadingError}</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      )}
      <Header balance={balance} />
      <GameArea
        onJumpReady={handleJumpReady}
        scrollContainerRef={scrollContainerRef}
        difficulty={difficulty}
        onLoadingChange={handleLoadingChange}
      />
      <ControlPanel
        betAmount={betAmount}
        setBetAmount={setBetAmount}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        onPlay={handlePlay}
        onCashout={handleCashout}
        gameState={gameState}
        disabled={gameState === "playing" || gameState === "atFinish"}
        currentMultiplier={currentMultiplier}
        goButtonDisabled={
          gameState === "won" ||
          gameState === "lost" ||
          gameState === "atFinish"
        }
        cashoutButtonDisabled={gameState !== "atFinish"}
      />

      {/* Hand indicator - points to GO during playing, CASHOUT at finish */}
      {(gameState === "playing" || gameState === "atFinish") && (
        <HandIndicator
          targetButton={gameState === "atFinish" ? "CASHOUT" : "GO"}
          visible={true}
        />
      )}
    </div>
  );
}
