import { GameLoop } from "./GameLoop.js";
import { Renderer } from "./Renderer.js";
import { CarSpawner } from "../systems/CarSpawner.js";

/**
 * Game - Main game class that orchestrates all game systems
 * Manages game state, entities, and rendering
 */
export class Game {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.config = config;
    this.state = "idle"; // idle, playing, paused, gameover

    // Core systems
    this.renderer = new Renderer(canvas);
    this.gameLoop = null;

    // Managers
    this.entityManager = null;
    this.assetManager = null;
    this.inputSystem = null;
    this.carSpawner = null;
  }

  /**
   * Initialize game systems
   */
  async initialize(entityManager, assetManager, inputSystem) {
    this.entityManager = entityManager;
    this.assetManager = assetManager;
    this.inputSystem = inputSystem;

    // Initialize car spawner
    this.carSpawner = new CarSpawner(this.config.carSpawner || {});
  }

  /**
   * Start the game loop
   */
  start() {
    if (this.gameLoop) {
      this.gameLoop.stop();
    }

    this.state = "playing";
    this.gameLoop = new GameLoop(
      this.update.bind(this),
      this.render.bind(this),
    );
    this.gameLoop.start();
  }

  /**
   * Pause the game
   */
  pause() {
    if (this.gameLoop) {
      this.gameLoop.stop();
    }
    this.state = "paused";
  }

  /**
   * Resume the game
   */
  resume() {
    if (this.gameLoop && this.state === "paused") {
      this.gameLoop.start();
      this.state = "playing";
    }
  }

  /**
   * Reset the game
   */
  reset() {
    if (this.gameLoop) {
      this.gameLoop.stop();
    }
    this.state = "idle";
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
   * Render game
   */
  render() {
    // Clear canvas
    this.renderer.clear();

    // Begin rendering (prepares offscreen buffer if using double buffering)
    this.renderer.begin();

    // Render all entities without camera transform
    // (using container scroll instead for better performance)
    if (this.entityManager) {
      this.entityManager.render(this.renderer);
    }

    // End rendering (swaps buffers if using double buffering)
    this.renderer.end();
  }

  /**
   * Resize canvas
   */
  resize(width, height) {
    this.renderer.resize(width, height);
  }

  /**
   * Destroy game and cleanup resources
   */
  destroy() {
    if (this.gameLoop) {
      this.gameLoop.destroy();
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
  }
}
