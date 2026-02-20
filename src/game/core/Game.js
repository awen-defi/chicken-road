import { PixiRenderer } from "./PixiRenderer.js";
import { CarSpawner } from "../systems/CarSpawner.js";
import { CoinManager } from "../managers/CoinManager.js";
import { GateManager } from "../managers/GateManager.js";

/**
 * Game - Main game class that orchestrates all game systems using Pixi.js
 * Manages game state, entities, and hardware-accelerated rendering
 */
export class Game {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.config = config;
    this.state = "idle"; // idle, playing, paused, gameover

    // Core systems - using Pixi renderer
    this.renderer = new PixiRenderer(canvas, config.renderer || {});
    this.initialized = false;

    // Managers
    this.entityManager = null;
    this.assetManager = null;
    this.inputSystem = null;
    this.carSpawner = null;
    this.coinManager = null;
    this.gateManager = null;

    // Entity references for dynamic updates
    this.road = null;
    this.finishScenery = null;
  }

  /**
   * Initialize game systems with Pixi
   */
  async initialize(entityManager, assetManager, inputSystem) {
    // Initialize Pixi renderer first
    await this.renderer.initialize();

    this.entityManager = entityManager;
    this.assetManager = assetManager;
    this.inputSystem = inputSystem;

    // Connect EntityManager to Pixi stage
    if (this.entityManager) {
      this.entityManager.setPixiRenderer(this.renderer);
    }

    // Initialize car spawner
    this.carSpawner = new CarSpawner(this.config.carSpawner || {});

    // Initialize coin manager
    this.coinManager = new CoinManager(this.config);

    // Initialize gate manager
    this.gateManager = new GateManager(this.config);

    this.initialized = true;
  }

  /**
   * Start the game loop - Pixi uses its own ticker
   * NOTE: Game loop starts, but state remains "idle" until Play button clicked
   */
  start() {
    if (!this.initialized || !this.renderer.app) {
      console.error("Game not initialized");
      return;
    }

    // CRITICAL: Start in "idle" state - wait for Play button
    // Game loop will run but won't spawn cars or update systems until state = "playing"
    this.state = "idle";

    // Use Pixi's built-in ticker for optimal performance
    this.renderer.app.ticker.add(this.gameLoop, this);
  }

  /**
   * Pause the game
   */
  pause() {
    if (this.renderer.app) {
      this.renderer.app.ticker.remove(this.gameLoop, this);
    }
    this.state = "paused";
  }

  /**
   * Resume the game
   */
  resume() {
    if (this.state === "paused" && this.renderer.app) {
      this.renderer.app.ticker.add(this.gameLoop, this);
      this.state = "playing";
    }
  }

  /**
   * Reset the game
   */
  reset() {
    if (this.renderer.app) {
      this.renderer.app.ticker.remove(this.gameLoop, this);
    }
    this.state = "idle";
  }

  /**
   * Main game loop - called by Pixi ticker
   * CRITICAL: This must ALWAYS run to render the scene, regardless of game state
   */
  gameLoop(ticker) {
    // Delta time in seconds (Pixi ticker provides delta in frames, convert to seconds)
    const deltaTime = ticker.deltaTime / 60; // 60 FPS baseline

    // ALWAYS update entities for rendering (chicken, road, scenery must be visible in idle state)
    this.update(deltaTime);
    // Pixi handles rendering automatically, no need to call render()
  }

  /**
   * Update game logic
   * CRITICAL: Entities must ALWAYS update for rendering, game systems only update when playing
   */
  update(deltaTime) {
    // ALWAYS update all entities for rendering (chicken, road, scenery visible in all states)
    // This ensures the scene is rendered even in "idle" state
    if (this.entityManager) {
      this.entityManager.update(deltaTime);
    }

    // Only update game systems when playing (car spawning, collision, coins, gates)
    // During "idle": no cars spawn, no collision checks
    // During "gameover": only entities update (for death animation)
    if (this.state === "playing") {
      // Update car spawner
      if (this.carSpawner) {
        this.carSpawner.update(deltaTime);
      }

      // Update coin manager
      if (this.coinManager) {
        this.coinManager.update(deltaTime);
      }

      // Update gate manager
      if (this.gateManager) {
        this.gateManager.update(deltaTime);
      }
    }
  }

  /**
   * Handle chicken death sequence with timing
   * REQUIREMENT: Proper sequence timing
   *   1. Collision detected -> set state to "gameover" (halt game systems)
   *   2. Play death animation and wait for completion
   *   3. Add 1-second visual buffer
   *   4. Trigger reset callback (cleanup and restore state)
   *
   * @param {Function} onComplete - Callback to execute after full death sequence
   * @returns {Promise} - Resolves when death sequence is complete
   */
  async handleChickenDeath(onComplete) {
    // REQUIREMENT: Set state to gameover to halt all game systems and prevent input
    // This is the internal game state - App.jsx gameState is managed separately
    this.state = "gameover";

    // Find chicken entity (look for entity with playDeath method)
    const chicken = this.entityManager
      ? this.entityManager.entities.find(
          (e) => e.playDeath && typeof e.playDeath === "function",
        )
      : null;

    if (!chicken) {
      console.warn("Chicken entity not found for death animation");
      if (onComplete) onComplete();
      return;
    }

    // REQUIREMENT: Play death animation and wait for completion
    await new Promise((resolve) => {
      chicken.playDeath(() => {
        resolve();
      });
    });

    // REQUIREMENT: 1-second buffer delay for visual beat
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Trigger reset callback
    if (onComplete) {
      onComplete();
    }
  }

  /**
   * Get current coin multiplier from CoinManager
   */
  getCurrentMultiplier() {
    if (this.coinManager) {
      return this.coinManager.getCurrentMultiplier();
    }
    return 1.0;
  }

  /**
   * Finish current lane (turn current lane's coin to gold)
   */
  finishCurrentLane() {
    if (this.coinManager) {
      this.coinManager.finishCurrentLane();
    }
  }

  /**
   * Set entity references for dynamic updates
   */
  setEntityReferences(road, finishScenery) {
    this.road = road;
    this.finishScenery = finishScenery;
  }

  /**
   * Update game difficulty and recreate coins
   */
  updateDifficulty(newDifficulty, newConfig, startWidth) {
    if (!this.initialized) {
      console.warn("Cannot update difficulty: game not initialized");
      return;
    }

    try {
      // 1. Update road lane count
      if (this.road) {
        this.road.updateLaneCount(newConfig.laneCount);
      }

      // 2. Update finish scenery position
      if (this.finishScenery && startWidth !== undefined) {
        const newRoadWidth = newConfig.laneWidth * newConfig.laneCount;
        this.finishScenery.x = startWidth + newRoadWidth;
      }

      // 3. Update car spawner lanes
      if (this.carSpawner && this.road) {
        this.carSpawner.updateLaneCount(this.road);
      }

      // 4. Clear and reset gate manager
      if (this.gateManager) {
        this.gateManager.destroy();
      }

      // 5. Update coin manager
      if (this.coinManager) {
        this.coinManager.updateDifficulty(newDifficulty);
      }
    } catch (error) {
      console.error("Error updating difficulty:", error);
    }
  }

  /**
   * Reset game to initial state (for new game)
   */
  resetGame() {
    if (!this.initialized) {
      console.warn("Cannot reset game: game not initialized");
      return;
    }

    // CRITICAL: Keep game in "idle" state - wait for Play button to start
    // The Play button handler will set state to "playing"
    this.state = "idle";

    // Reset coin manager
    if (this.coinManager) {
      try {
        this.coinManager.reset();
      } catch (error) {
        console.error("Error resetting coins:", error);
      }
    }

    // Reset gate manager
    if (this.gateManager) {
      try {
        this.gateManager.destroy();
      } catch (error) {
        console.error("Error resetting gates:", error);
      }
    }

    // Reset car spawner - REQUIREMENT: Remove all active cars and reset state
    if (this.carSpawner) {
      try {
        this.carSpawner.reset();
      } catch (error) {
        console.error("Error resetting car spawner:", error);
      }
    }
  }

  /**
   * Resize canvas
   */
  resize(width, height) {
    if (this.renderer) {
      this.renderer.resize(width, height);
    }
  }

  /**
   * Destroy game and cleanup resources
   */
  destroy() {
    // Stop game first
    this.state = "idle";

    // Remove ticker callback safely
    if (this.renderer && this.renderer.app && this.renderer.app.ticker) {
      try {
        this.renderer.app.ticker.remove(this.gameLoop, this);
      } catch {
        // Ticker might already be destroyed
      }
    }

    if (this.inputSystem) {
      this.inputSystem.destroy();
    }

    if (this.carSpawner) {
      this.carSpawner.cleanup();
    }

    if (this.coinManager) {
      this.coinManager.cleanup();
    }

    if (this.gateManager) {
      this.gateManager.destroy();
    }

    if (this.entityManager) {
      this.entityManager.clear();
    }

    if (this.renderer) {
      this.renderer.destroy();
    }

    this.initialized = false;
  }
}
