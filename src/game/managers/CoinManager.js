import { Coin } from "../entities/Coin.js";

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
   * Create one coin per lane
   */
  createCoins() {
    const laneCount = this.road.laneCount;
    const laneWidth = this.road.laneWidth;

    // Position coins 50px above chicken's Y level (where chicken will jump)
    const coinY = this.chicken.y - 50;

    for (let i = 0; i < laneCount; i++) {
      // Calculate coin position (center of lane)
      const coinX = this.road.x + (i + 0.5) * laneWidth;

      // Calculate coin value (1.01, 1.02, 1.03, etc.)
      const coinValue = 1.01 + i * 0.01;

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
