import { gameEvents } from "../game/core/GameEventBus.js";

/**
 * LiveWinService - Social Proof Engine
 * Generates realistic "live wins" to create engagement without impacting game performance
 * Uses variable intervals and weighted multiplier distribution for authenticity
 */
class LiveWinService {
  constructor() {
    this.isRunning = false;
    this.timeoutId = null;
    this.winCounter = 0;

    // Avatar pool (3 provided PNG images)
    this.avatars = ["/avatar1.png", "/avatar2.png", "/avatar3.png"];

    // Flag pool (provided flags)
    this.flags = [
      "/nl.svg",
      "/in.svg",
      "/tj.svg",
      "/tg.svg",
      "/uz.svg",
      "/si.svg",
      "/kz.svg",
    ];

    // User name pool
    this.names = [
      "Alexander",
      "Isabella",
      "Christopher",
      "Anastasia",
      "Benjamin",
      "Valentina",
      "Nicholas",
      "Gabriella",
      "Sebastian",
      "Francesca",
      "Maximilian",
      "Alessandra",
      "Theodore",
      "Penelope",
      "Dominic",
      "Seraphina",
      "Jonathan",
      "Evangeline",
      "Santiago",
      "Katerina",
      "Leonardo",
      "Arabella",
      "Frederick",
      "Josephine",
    ];

    // Base bet amounts for realistic calculations
    this.baseBets = [0.5, 1, 2, 5, 7, 10, 15, 20];
  }

  /**
   * Generate a realistic multiplier with weighted distribution
   * 80% - 1.2x to 5.0x
   * 15% - 5.0x to 20.0x
   * 5% - 20.0x+
   */
  generateMultiplier() {
    const roll = Math.random();

    if (roll < 0.8) {
      // 80% - Small to medium wins
      return parseFloat((1.2 + Math.random() * 3.8).toFixed(2));
    } else if (roll < 0.95) {
      // 15% - Big wins
      return parseFloat((5.0 + Math.random() * 15.0).toFixed(2));
    } else {
      // 5% - Huge wins
      return parseFloat((20.0 + Math.random() * 80.0).toFixed(2));
    }
  }

  /**
   * Generate a mock win event
   */
  generateMockWin() {
    const name = this.names[Math.floor(Math.random() * this.names.length)];
    const avatar =
      this.avatars[Math.floor(Math.random() * this.avatars.length)];
    const flag = this.flags[Math.floor(Math.random() * this.flags.length)];
    const multiplier = this.generateMultiplier();

    // Generate amount in range [465, 5879]
    const amount = parseFloat((465 + Math.random() * (5879 - 465)).toFixed(2));

    this.winCounter++;

    return {
      id: `win-${Date.now()}-${this.winCounter}`,
      name,
      avatar,
      flag,
      multiplier,
      amount,
      timestamp: Date.now(),
    };
  }

  /**
   * Get random interval between 2-5 seconds for organic feel
   */
  getRandomInterval() {
    return 2000 + Math.random() * 3000; // 2000-5000ms
  }

  /**
   * Recursive generation with variable intervals
   */
  scheduleNextWin() {
    if (!this.isRunning) return;

    const interval = this.getRandomInterval();

    this.timeoutId = setTimeout(() => {
      // Generate and emit win event
      const win = this.generateMockWin();
      gameEvents.emit("live:win", win);

      // Schedule next win
      this.scheduleNextWin();
    }, interval);
  }

  /**
   * Start generating wins
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.scheduleNextWin();
  }

  /**
   * Stop generating wins and cleanup
   */
  stop() {
    this.isRunning = false;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Reset counter
   */
  reset() {
    this.stop();
    this.winCounter = 0;
  }
}

// Export singleton instance
export const liveWinService = new LiveWinService();
