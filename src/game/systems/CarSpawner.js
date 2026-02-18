import { Car } from "../entities/Car.js";

/**
 * CarSpawner - Manages car spawning and object pooling
 * Implements efficient memory management and optimal spawn timing
 */
export class CarSpawner {
  constructor(config) {
    this.config = config;
    this.entityManager = null;
    this.pixiRenderer = null; // Use Pixi renderer instead of AssetManager
    this.road = null;
    this.chicken = null; // Reference to chicken for smart spawning
    this.containerElement = null; // For viewport detection

    // Object pool for cars
    this.carPool = [];
    this.activeCars = [];
    this.poolSize = 30; // Increased pool size for more cars

    // Spawn timing - faster and more random
    this.spawnTimer = 0;
    this.minSpawnInterval = 0.3; // Much faster spawning
    this.maxSpawnInterval = 1.2; // More frequent cars
    this.nextSpawnTime = this.getRandomSpawnInterval();

    // Lane configuration
    this.lanes = [];
    this.laneCooldowns = new Map(); // Track cooldown per lane (lane index -> timestamp)
    this.cooldownDuration = 3.0; // 3 seconds cooldown after car leaves lane
    this.startX = 0;
    this.roadWidth = 0;
    this.roadY = 0;
    this.roadHeight = 0;
    this.laneWidth = 300;

    // Car types and their probabilities
    this.carTypes = [
      { type: "truck-orange", weight: 0.3, imageKey: "truck-orange" },
      { type: "truck-blue", weight: 0.3, imageKey: "truck-blue" },
      { type: "car-yellow", weight: 0.2, imageKey: "car-yellow" },
      { type: "car-police", weight: 0.2, imageKey: "car-police" },
    ];

    // Speed variation (pixels per second) - much faster vertical movement
    this.minSpeed = 200; // Significantly faster
    this.maxSpeed = 450; // Much faster max speed

    // Cleanup optimization - throttle checks to reduce flickering
    this.cleanupFrameCounter = 0;
    this.cleanupInterval = 10; // Check every 10 frames instead of every frame
  }

  /**
   * Initialize the spawner
   */
  initialize(entityManager, pixiRenderer, road, chicken, containerElement) {
    this.entityManager = entityManager;
    this.pixiRenderer = pixiRenderer; // Use Pixi renderer for texture access
    this.road = road;
    this.chicken = chicken; // Store chicken reference for smart spawning
    this.containerElement = containerElement; // For viewport detection

    // Calculate lane positions and road boundaries
    this.startX = road.x;
    this.roadWidth = road.width;
    this.roadY = road.y;
    this.roadHeight = road.height;
    this.laneWidth = road.laneWidth;
    this.setupLanes();

    // Pre-populate object pool
    this.initializePool();
  }

  /**
   * Setup lane configurations
   */
  setupLanes() {
    const laneCount = this.road.laneCount;
    const laneWidth = this.road.laneWidth;

    // Setup all lanes for vertical traffic (cars move down)
    for (let i = 0; i < laneCount; i++) {
      this.lanes.push({
        index: i,
        centerX: this.startX + (i + 0.5) * laneWidth, // Center X of the lane
        spawnChance: 0.4 + Math.random() * 0.3, // Vary traffic density per lane
      });
    }
  }

  /**
   * Initialize object pool
   */
  initializePool() {
    for (let i = 0; i < this.poolSize; i++) {
      const car = new Car(0, 0, {});
      car.inUse = false;
      car.active = false;
      this.carPool.push(car);
    }
  }

  /**
   * Get a car from the pool or create new one
   */
  acquireCar() {
    // Try to find an unused car in the pool with valid container
    let car = this.carPool.find((c) => !c.inUse && c.container);

    // If pool is exhausted or all cars invalid, create a new car
    if (!car) {
      car = new Car(0, 0, {});

      // Verify the car was created with a valid container
      if (!car.container) {
        console.error("Car created with null container - pool corrupted");
        return null;
      }

      this.carPool.push(car);
    }

    return car;
  }

  /**
   * Release car back to pool (don't destroy - reuse)
   */
  releaseCar(car) {
    // Hide car but keep container for pooling
    car.release();

    // Remove from active cars list
    const index = this.activeCars.indexOf(car);
    if (index !== -1) {
      this.activeCars.splice(index, 1);
    }

    // Remove from stage (but don't destroy container)
    if (this.entityManager && this.entityManager.stage && car.container) {
      try {
        const stage = this.entityManager.stage;
        if (car.container.parent === stage) {
          stage.removeChild(car.container);
        }
      } catch (e) {
        // Container might already be removed
      }
    }
  }

  /**
   * Get random spawn interval
   */
  getRandomSpawnInterval() {
    return (
      this.minSpawnInterval +
      Math.random() * (this.maxSpawnInterval - this.minSpawnInterval)
    );
  }

  /**
   * Get random car type based on weights
   */
  getRandomCarType() {
    const totalWeight = this.carTypes.reduce(
      (sum, type) => sum + type.weight,
      0,
    );
    let random = Math.random() * totalWeight;

    for (const carType of this.carTypes) {
      random -= carType.weight;
      if (random <= 0) {
        return carType;
      }
    }

    return this.carTypes[0]; // Fallback
  }

  /**
   * Spawn a car in a lane near the chicken (next 5 lanes ahead)
   */
  spawnCar() {
    // Don't spawn if not properly initialized
    if (!this.entityManager || !this.pixiRenderer || this.lanes.length === 0) {
      return;
    }

    if (!this.chicken) {
      // Fallback to random lane if chicken not available
      this.spawnCarInLane(Math.floor(Math.random() * this.lanes.length));
      return;
    }

    // Calculate chicken's current lane
    const chickenLaneX = this.chicken.x - this.startX;
    const chickenLaneIndex = Math.floor(chickenLaneX / this.laneWidth);

    // Spawn in next 5 lanes ahead (in direction chicken is facing)
    // Since chicken moves right, spawn ahead on the road
    const minLane = Math.max(0, chickenLaneIndex);
    const maxLane = Math.min(this.lanes.length - 1, chickenLaneIndex + 5);

    // Prefer lanes closer to chicken (weighted randomization)
    let targetLane;
    const rand = Math.random();
    if (rand < 0.5) {
      // 50% chance: spawn in next 2 lanes
      targetLane =
        minLane +
        Math.floor(Math.random() * Math.min(2, maxLane - minLane + 1));
    } else {
      // 50% chance: spawn in next 3-5 lanes
      targetLane =
        minLane + Math.floor(Math.random() * (maxLane - minLane + 1));
    }

    targetLane = Math.max(minLane, Math.min(maxLane, targetLane));
    this.spawnCarInLane(targetLane);
  }

  /**
   * Check if a lane is available for spawning (no cooldown)
   */
  isLaneAvailable(laneIndex) {
    const now = performance.now() / 1000; // Convert to seconds
    const cooldownEnd = this.laneCooldowns.get(laneIndex);

    if (cooldownEnd === undefined) {
      return true; // Lane never used
    }

    return now >= cooldownEnd; // Check if cooldown expired
  }

  /**
   * Set cooldown for a lane
   */
  setLaneCooldown(laneIndex) {
    const now = performance.now() / 1000;
    this.laneCooldowns.set(laneIndex, now + this.cooldownDuration);
  }

  /**
   * Spawn a car in a specific lane
   */
  spawnCarInLane(laneIndex) {
    // Guard against invalid state
    if (!this.pixiRenderer || !this.entityManager) return;
    if (laneIndex < 0 || laneIndex >= this.lanes.length) return;

    const lane = this.lanes[laneIndex];

    // Check if lane is on cooldown
    if (!this.isLaneAvailable(laneIndex)) {
      return; // Lane is on cooldown, don't spawn
    }

    // Check spawn chance for this lane
    if (Math.random() > lane.spawnChance) {
      return; // Don't spawn this time
    }

    // Get car from pool
    const car = this.acquireCar();

    // Validate car from pool
    if (!car || !car.container) {
      console.warn("Failed to acquire valid car from pool");
      return;
    }

    // Get random car type
    const carType = this.getRandomCarType();

    // Get car texture from Pixi renderer
    const texture = this.pixiRenderer.getTexture(carType.imageKey);
    if (!texture) {
      console.warn(`Car texture not found: ${carType.imageKey}`);
      return;
    }

    // Random speed with wider variation
    const speed =
      this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed);

    // Spawn position: at the top of viewport or slightly above
    const spawnX = lane.centerX;

    // Get current scroll position for viewport-aware spawning
    let spawnY = this.roadY - 150; // Default spawn above road
    if (this.containerElement) {
      const scrollY = this.containerElement.scrollTop || 0;
      spawnY = scrollY - 200; // Spawn above current viewport
    }

    // Reset car with new configuration
    car.reset(spawnX, spawnY, {
      lane: lane.index,
      speed: speed,
      carType: carType.type,
      roadBottomY: this.roadY + this.roadHeight,
    });

    car.setTexture(texture);

    // Set cooldown for this lane
    this.setLaneCooldown(lane.index);

    // Add to active cars
    this.activeCars.push(car);

    // Manually add to stage (don't use entityManager for pooled objects)
    if (this.entityManager && this.entityManager.stage && car.container) {
      try {
        this.entityManager.stage.addChild(car.container);
      } catch (e) {
        console.warn("Failed to add car to stage:", e);
      }
    }
  }

  /**
   * Update spawner (optimized)
   */
  update(deltaTime) {
    // Don't spawn if not properly initialized
    if (!this.entityManager || !this.pixiRenderer || !this.road) {
      return;
    }

    // Update all active cars
    for (let i = 0; i < this.activeCars.length; i++) {
      const car = this.activeCars[i];
      if (car && car.active) {
        car.update(deltaTime);
      }
    }

    // Update spawn timer
    this.spawnTimer += deltaTime;

    // Check if it's time to spawn
    if (this.spawnTimer >= this.nextSpawnTime) {
      this.spawnCar();
      this.spawnTimer = 0;
      this.nextSpawnTime = this.getRandomSpawnInterval();
    }

    // Throttled cleanup - only check every N frames to reduce flickering
    this.cleanupFrameCounter++;

    if (this.cleanupFrameCounter >= this.cleanupInterval) {
      this.cleanupFrameCounter = 0;

      // Viewport-based cleanup - only remove cars far outside viewport
      if (this.containerElement) {
        const scrollX = this.containerElement.scrollLeft || 0;
        const scrollY = this.containerElement.scrollTop || 0;
        const viewportWidth = this.containerElement.clientWidth || 800;
        const viewportHeight = this.containerElement.clientHeight || 600;

        for (let i = this.activeCars.length - 1; i >= 0; i--) {
          const car = this.activeCars[i];

          // Remove if not in viewport (with buffer)
          if (
            !car.active ||
            !car.isInViewport(scrollX, scrollY, viewportWidth, viewportHeight)
          ) {
            // Don't call entityManager.removeEntity - we're pooling
            this.releaseCar(car);
          }
        }
      } else {
        // Fallback cleanup if no container element
        for (let i = this.activeCars.length - 1; i >= 0; i--) {
          const car = this.activeCars[i];
          if (car.isOffscreen || !car.active) {
            // Don't call entityManager.removeEntity - we're pooling
            this.releaseCar(car);
          }
        }
      }
    }
  }

  /**
   * Get active car count (for debugging)
   */
  getActiveCarCount() {
    return this.activeCars.length;
  }

  /**
   * Get pool statistics (for debugging)
   */
  getPoolStats() {
    return {
      poolSize: this.carPool.length,
      inUse: this.carPool.filter((c) => c.inUse).length,
      available: this.carPool.filter((c) => !c.inUse).length,
      active: this.activeCars.length,
    };
  }

  /**
   * Clean up all cars
   */
  cleanup() {
    // Release all active cars back to pool (don't destroy)
    for (const car of this.activeCars) {
      if (car) {
        this.releaseCar(car);
      }
    }
    this.activeCars = [];

    // Now destroy all pooled cars since we're shutting down
    for (const car of this.carPool) {
      if (car && car.container) {
        try {
          car.destroy();
        } catch (e) {
          // Car might already be destroyed
        }
      }
    }
    this.carPool = [];
  }
}
