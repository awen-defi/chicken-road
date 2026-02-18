/**
 * Game Configuration
 * Central configuration for all game parameters and settings
 */

/**
 * Core game configuration
 */
export const GAME_CONFIG = {
  // Road settings
  laneWidth: 210,
  laneCount: 30,
  roadColor: "#716c69",
  lineColor: "#ffffff",
  roadLineWidth: 3.5,
  dashPattern: [28, 28],

  // Chicken settings
  chickenSize: 196,
  chickenScale: 0.7,

  // Performance
  targetFPS: 60,

  // Asset paths
  assets: {
    start: "/start.png",
    finish: "/finish.png",
    chicken: "/assets/chicken.png",
    // Coin assets
    coin: "/coin.png",
    "coin-gold": "/coin-gold.png",
    // Car assets
    cars: {
      "truck-orange": "/assets/truck-orange.png",
      "truck-blue": "/assets/truck-blue.png",
      "car-yellow": "/assets/car-yellow.png",
      "car-police": "/assets/car-police.png",
    },
  },

  // Car spawner settings (vertical traffic) - optimized for performance
  carSpawner: {
    minSpawnInterval: 0.3, // Much faster spawning
    maxSpawnInterval: 1.2, // More frequent cars
    minSpeed: 200, // Significantly faster (vertical movement)
    maxSpeed: 450, // Much faster max speed
    poolSize: 30, // Larger pool for more simultaneous cars
  },
};

/**
 * Difficulty settings for future game modes
 */
export const DIFFICULTY_SETTINGS = {
  Easy: {
    obstacleSpawnChance: 0.3,
    obstacleSpeed: 2,
    rewardChance: 0.8,
  },
  Medium: {
    obstacleSpawnChance: 0.5,
    obstacleSpeed: 3,
    rewardChance: 0.6,
  },
  Hard: {
    obstacleSpawnChance: 0.7,
    obstacleSpeed: 4,
    rewardChance: 0.4,
  },
  Hardcore: {
    obstacleSpawnChance: 0.9,
    obstacleSpeed: 5,
    rewardChance: 0.2,
  },
};

/**
 * Get default game configuration
 */
export function getDefaultConfig() {
  return { ...GAME_CONFIG };
}
