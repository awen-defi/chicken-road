// Game configuration and asset paths
export const GAME_CONFIG = {
  // Canvas dimensions
  width: 800,
  height: 600,
  
  // Game mechanics
  laneCount: 6,
  laneHeight: 80,
  scrollSpeed: 2,
  carSpeed: 3,
  jumpDuration: 300, // ms
  jumpHeight: 80,
  
  // Chicken properties
  chicken: {
    width: 60,
    height: 60,
    startX: 370,
    startY: 480,
    idleFrames: 8,
    jumpFrames: 6,
    frameRate: 100, // ms per frame
  },
  
  // Car properties
  car: {
    width: 80,
    height: 50,
    minSpeed: 2,
    maxSpeed: 5,
    spawnInterval: 2000, // ms
  },
  
  // Coin properties
  coin: {
    width: 40,
    height: 40,
    rotationSpeed: 0.05,
  },
  
  // Asset paths (easily replaceable)
  assets: {
    background: '/assets/background.png',
    road: '/assets/road.png',
    chicken: '/assets/chicken.png',
    car: '/assets/car.png',
    coin: '/assets/coin.png',
  },
};

// Difficulty settings
export const DIFFICULTY_SETTINGS = {
  Easy: {
    carSpawnChance: 0.3,
    carSpeed: 2,
    coinChance: 0.8,
  },
  Medium: {
    carSpawnChance: 0.5,
    carSpeed: 3,
    coinChance: 0.6,
  },
  Hard: {
    carSpawnChance: 0.7,
    carSpeed: 4,
    coinChance: 0.4,
  },
  Hardcore: {
    carSpawnChance: 0.9,
    carSpeed: 5,
    coinChance: 0.2,
  },
};
