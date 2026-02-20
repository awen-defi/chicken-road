import { BaseEntity } from "./BaseEntity.js";
import { Sprite, Text } from "pixi.js";

/**
 * Coin - Collectible coin entity with number display
 * Shows silver coin by default, turns gold when lane is passed
 */
export class Coin extends BaseEntity {
  constructor(x, y, config) {
    super(x, y);

    this.laneIndex = config.laneIndex || 0;
    this.value = config.value || 1.01;
    this.isCollected = false;
    this.isGold = false;

    this.sprite = null;
    this.text = null;

    this.width = 120;
    this.height = 120;
  }

  /**
   * Set the coin sprite textures
   */
  setTextures(silverTexture, goldTexture) {
    if (!this.container) {
      console.warn("Cannot set textures: container is null");
      return;
    }

    this.silverTexture = silverTexture;
    this.goldTexture = goldTexture;

    // Create sprite with silver texture initially
    this.sprite = new Sprite(silverTexture);
    this.sprite.anchor.set(0.5);
    this.sprite.width = this.width;
    this.sprite.height = this.height;

    this.container.addChild(this.sprite);

    // Create text label for the value with smart formatting
    let displayText;
    if (this.value >= 1000) {
      // For large numbers, use compact notation (e.g., "1.2K", "3.6M")
      if (this.value >= 1000000) {
        displayText = (this.value / 1000000).toFixed(1) + "M x";
      } else {
        displayText = (this.value / 1000).toFixed(1) + "K x";
      }
    } else if (this.value >= 100) {
      displayText = this.value.toFixed(0) + "x";
    } else if (this.value >= 10) {
      displayText = this.value.toFixed(1) + "x";
    } else {
      displayText = this.value.toFixed(2) + "x";
    }

    this.text = new Text({
      text: displayText,
      style: {
        fontFamily: "Arial",
        fontSize: 24,
        fontWeight: "bold",
        fill: "#ffffff",
        stroke: { color: "#000000", width: 4 },
      },
    });
    this.text.anchor.set(0.5);
    this.text.y = 0;

    this.container.addChild(this.text);
  }

  /**
   * Turn coin to gold
   */
  turnGold() {
    if (this.isGold || !this.sprite || !this.goldTexture) return;

    this.isGold = true;
    this.sprite.texture = this.goldTexture;

    // Hide the number text on gold coins
    if (this.text) {
      this.text.visible = false;
    }
  }

  /**
   * Show or hide the coin
   */
  setVisible(visible) {
    this.visible = visible;
    if (this.container) {
      this.container.visible = visible;
    }
  }

  /**
   * Update coin state
   */
  update(deltaTime) {
    super.update(deltaTime);
    // Coins are static, no animation needed
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
    if (this.text) {
      this.text.destroy();
      this.text = null;
    }
    super.destroy();
  }
}
