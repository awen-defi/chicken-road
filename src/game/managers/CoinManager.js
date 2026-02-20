import { Coin } from "../entities/Coin.js";
import { DIFFICULTY_SETTINGS } from "../../config/gameConfig.js";

/**
 * CoinManager - Manages all coins across lanes
 * Handles coin creation, visibility, and state updates
 */
export class CoinManager {
  constructor(config) {
    this.config = config;
    this.pixiRenderer = null;
    this.road = null;
    this.chicken = null;
    this.entityManager = null;

    this.coins = []; // All coins indexed by lane
    this.currentLaneIndex = -1; // Current lane the chicken is on (-1 means not on road yet)
    this.highestPassedLane = -1; // Highest lane index the chicken has passed

    this.silverTexture = null;
    this.goldTexture = null;

    // Get coin multipliers based on difficulty
    const difficulty = config.difficulty || "Easy";
    this.coinMultipliers =
      DIFFICULTY_SETTINGS[difficulty]?.coinMultipliers ||
      DIFFICULTY_SETTINGS.Easy.coinMultipliers;
  }

  /**
   * Initialize the coin manager
   */
  initialize(entityManager, pixiRenderer, road, chicken) {
    this.entityManager = entityManager;
    this.pixiRenderer = pixiRenderer;
    this.road = road;
    this.chicken = chicken;

    // Load textures
    this.silverTexture = this.pixiRenderer.getTexture("coin");
    this.goldTexture = this.pixiRenderer.getTexture("coin-gold");

    if (!this.silverTexture || !this.goldTexture) {
      console.error("Coin textures not found");
      return;
    }

    // Create coins for all lanes
    this.createCoins();
  }

  /**
   * Create one coin per lane (up to the number of multipliers available)
   */
  createCoins() {
    const laneCount = this.road.laneCount;
    const laneWidth = this.road.laneWidth;

    // Position coins 50px above chicken's Y level (where chicken will jump)
    const coinY = this.chicken.y - 50;

    // Only create as many coins as we have multipliers
    const coinsToCreate = Math.min(laneCount, this.coinMultipliers.length);

    for (let i = 0; i < coinsToCreate; i++) {
      // Calculate coin position (center of lane)
      const coinX = this.road.x + (i + 0.5) * laneWidth;

      // Get coin value from difficulty multipliers array
      const coinValue = this.coinMultipliers[i];

      // Create coin
      const coin = new Coin(coinX, coinY, {
        laneIndex: i,
        value: coinValue,
      });

      coin.setTextures(this.silverTexture, this.goldTexture);

      // Add to entity manager stage
      if (this.entityManager && this.entityManager.stage && coin.container) {
        this.entityManager.stage.addChild(coin.container);
        // Ensure coin is visible
        coin.container.visible = true;
        coin.container.zIndex = 100; // High z-index to ensure coins are on top
      }

      this.coins.push(coin);
    }

    // Sort stage children by zIndex
    if (this.entityManager && this.entityManager.stage) {
      this.entityManager.stage.sortableChildren = true;
    }

    console.log(
      `✨ Created ${this.coins.length} coins at Y position: ${coinY}`,
    );
  }

  /**
   * Update coin manager state
   */
  update(deltaTime) {
    if (!this.chicken || !this.road) return;

    // Calculate current lane based on chicken position
    const chickenLaneIndex = this.road.getLaneAtPosition(this.chicken.x);

    if (chickenLaneIndex !== this.currentLaneIndex) {
      // Chicken moved to a new lane (or position changed)
      if (chickenLaneIndex !== -1) {
        this.onLaneChanged(chickenLaneIndex);
      } else {
        // Chicken is not on the road (might be on start scenery)
        if (this.currentLaneIndex !== -1) {
          console.log(
            `🪙 Chicken left road, was on lane ${this.currentLaneIndex}`,
          );
          this.currentLaneIndex = -1;
        }
      }
    }

    // Update visibility of coins
    this.updateCoinVisibility();

    // Update all coins
    for (const coin of this.coins) {
      if (coin.active) {
        coin.update(deltaTime);
      }
    }
  }

  /**
   * Handle lane change
   */
  onLaneChanged(newLaneIndex) {
    const oldLaneIndex = this.currentLaneIndex;
    this.currentLaneIndex = newLaneIndex;

    // If chicken moved forward (to a higher lane index)
    if (newLaneIndex > this.highestPassedLane) {
      // Turn all coins from 0 to oldLaneIndex to gold
      for (let i = 0; i <= oldLaneIndex; i++) {
        if (i < this.coins.length) {
          this.coins[i].turnGold();
        }
      }

      // Update highest passed lane
      this.highestPassedLane = oldLaneIndex;
    }

    console.log(`🪙 Lane changed: ${oldLaneIndex} -> ${newLaneIndex}`);
  }

  /**
   * Update coin visibility based on chicken position
   */
  updateCoinVisibility() {
    for (let i = 0; i < this.coins.length; i++) {
      const coin = this.coins[i];

      // Hide coin on current lane, show all others
      // If currentLaneIndex is -1 (not on road), show all coins
      if (this.currentLaneIndex !== -1 && i === this.currentLaneIndex) {
        coin.setVisible(false);
      } else {
        coin.setVisible(true);
      }
    }
  }

  /**
   * Get total collected value (sum of gold coins)
   */
  getCollectedValue() {
    let total = 0;
    for (const coin of this.coins) {
      if (coin.isGold) {
        total += coin.value;
      }
    }
    return total;
  }

  /**
   * Update difficulty and recreate coins
   */
  updateDifficulty(newDifficulty) {
    console.log(`🔄 Updating difficulty to ${newDifficulty}...`);

    // Validate that we have all required dependencies
    if (!this.entityManager || !this.road || !this.chicken) {
      console.warn("Cannot update difficulty: missing dependencies");
      return;
    }

    // Save current state
    const savedCurrentLane = this.currentLaneIndex;
    const savedHighestPassedLane = this.highestPassedLane;

    // Update multipliers based on new difficulty
    const newMultipliers = DIFFICULTY_SETTINGS[newDifficulty]?.coinMultipliers;
    if (!newMultipliers) {
      console.warn(`Invalid difficulty: ${newDifficulty}, using Easy`);
      this.coinMultipliers = DIFFICULTY_SETTINGS.Easy.coinMultipliers;
    } else {
      this.coinMultipliers = newMultipliers;
    }

    // Clean up existing coins safely
    try {
      this.cleanup();
    } catch (error) {
      console.error("Error cleaning up coins:", error);
    }

    // Recreate coins with new multipliers
    try {
      this.createCoins();
    } catch (error) {
      console.error("Error creating coins:", error);
      return;
    }

    // Restore state and update coin visibility/colors
    this.currentLaneIndex = savedCurrentLane;
    this.highestPassedLane = savedHighestPassedLane;

    // Update coins based on saved state
    if (savedHighestPassedLane >= 0) {
      // Turn all passed coins to gold
      for (
        let i = 0;
        i <= savedHighestPassedLane && i < this.coins.length;
        i++
      ) {
        const coin = this.coins[i];
        if (coin && !coin.isGold) {
          try {
            coin.turnGold();
          } catch (error) {
            console.error(`Error turning coin ${i} gold:`, error);
          }
        }
      }
    }

    // Update visibility
    try {
      this.updateCoinVisibility();
    } catch (error) {
      console.error("Error updating coin visibility:", error);
    }

    console.log(
      `✅ Updated coins for ${newDifficulty} difficulty (preserved state: lane ${savedCurrentLane}, passed ${savedHighestPassedLane})`,
    );
  }

  /**
   * Get the current coin multiplier (highest lane reached)
   */
  getCurrentMultiplier() {
    if (
      this.highestPassedLane >= 0 &&
      this.highestPassedLane < this.coins.length
    ) {
      return this.coins[this.highestPassedLane].value;
    }
    return 1.0; // Default multiplier if no coins passed
  }

  /**
   * Reset all coins to silver
   */
  reset() {
    this.currentLaneIndex = -1;
    this.highestPassedLane = -1;

    for (const coin of this.coins) {
      coin.isGold = false;
      if (coin.sprite && coin.silverTexture) {
        coin.sprite.texture = coin.silverTexture;
      }
      // Show text on silver coins
      if (coin.text) {
        coin.text.visible = true;
      }
      coin.setVisible(true);
    }
  }

  /**
   * Clean up all coins
   */
  cleanup() {
    for (const coin of this.coins) {
      if (coin.container && this.entityManager && this.entityManager.stage) {
        try {
          if (coin.container.parent === this.entityManager.stage) {
            this.entityManager.stage.removeChild(coin.container);
          }
        } catch {
          // Container might already be removed
        }
      }
      coin.destroy();
    }
    this.coins = [];
  }
}
