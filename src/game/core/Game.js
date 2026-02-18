import { PixiRenderer } from "./PixiRenderer.js";
import { CarSpawner } from "../systems/CarSpawner.js";

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

    if (this.entityManager) {
      this.entityManager.clear();
    }

    if (this.renderer) {
      this.renderer.destroy();
    }

    this.initialized = false;
  }
}
