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
   */
  start() {
    if (!this.initialized || !this.renderer.app) {
      console.error("Game not initialized");
      return;
    }

    this.state = "playing";

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
   */
  gameLoop(ticker) {
    if (this.state !== "playing") return;

    // Delta time in seconds (Pixi ticker provides delta in frames, convert to seconds)
    const deltaTime = ticker.deltaTime / 60; // 60 FPS baseline

    this.update(deltaTime);
    // Pixi handles rendering automatically, no need to call render()
  }

  /**
   * Update game logic
   */
  update(deltaTime) {
    if (this.state !== "playing") return;

    // Update all entities
    if (this.entityManager) {
      this.entityManager.update(deltaTime);
    }

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

    console.log(
      `🔄 Updating difficulty to ${newDifficulty} with ${newConfig.laneCount} lanes`,
    );

    try {
      // 1. Update road lane count
      if (this.road) {
        this.road.updateLaneCount(newConfig.laneCount);
        console.log(`✅ Road updated to ${newConfig.laneCount} lanes`);
      }

      // 2. Update finish scenery position
      if (this.finishScenery && startWidth !== undefined) {
        const newRoadWidth = newConfig.laneWidth * newConfig.laneCount;
        this.finishScenery.x = startWidth + newRoadWidth;
        console.log(
          `✅ Finish scenery repositioned to x=${this.finishScenery.x}`,
        );
      }

      // 3. Update car spawner lanes
      if (this.carSpawner && this.road) {
        this.carSpawner.updateLaneCount(this.road);
        console.log(`✅ Car spawner updated with new lanes`);
      }

      // 4. Clear and reset gate manager
      if (this.gateManager) {
        this.gateManager.destroy();
        console.log(`✅ Gates cleared`);
      }

      // 5. Update coin manager
      if (this.coinManager) {
        this.coinManager.updateDifficulty(newDifficulty);
        console.log(`✅ Coins updated for ${newDifficulty} difficulty`);
      }

      console.log(
        `✅ Difficulty successfully updated to ${newDifficulty} with ${newConfig.laneCount} lanes`,
      );
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

    console.log("🔄 Game reset to initial state");
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
      } catch (e) {
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
