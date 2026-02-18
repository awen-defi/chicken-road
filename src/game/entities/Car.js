import { BaseEntity } from "./BaseEntity.js";
import { Sprite } from "pixi.js";

/**
 * Car - Vehicle obstacle entity using Pixi sprites
 * Handles car rendering, movement, and lifecycle with hardware acceleration
 */
export class Car extends BaseEntity {
  constructor(x, y, config) {
    super(x, y);

    this.config = config;
    this.lane = config.lane || 0;
    this.speed = config.speed || 200; // pixels per second (moving down)
    this.carType = config.carType || "truck"; // truck, car, etc.
    this.roadBottomY = config.roadBottomY || 1000; // Bottom boundary for offscreen detection

    // Size: 20px smaller than lane width (300px -> 280px)
    this.width = 280;
    this.height = 140; // Will be recalculated based on image aspect ratio

    this.sprite = null;
    this.isOffscreen = false;

    // For object pooling
    this.inUse = true;
  }

  /**
   * Set the car sprite texture and calculate height to maintain aspect ratio
   */
  setTexture(texture) {
    // Guard against destroyed container
    if (!this.container) {
      console.warn("Cannot set texture: container is null");
      return;
    }

    if (this.sprite) {
      this.sprite.destroy();
    }

    this.sprite = new Sprite(texture);

    // Set anchor to center
    this.sprite.anchor.set(0.5);

    // Calculate height to maintain texture aspect ratio (prevent distortion)
    if (texture && texture.width > 0 && texture.height > 0) {
      const aspectRatio = texture.height / texture.width;
      this.height = this.width * aspectRatio;
    }

    // Set sprite size
    this.sprite.width = this.width;
    this.sprite.height = this.height;

    this.container.addChild(this.sprite);
  }

  /**
   * Reset car for object pool reuse
   */
  reset(x, y, config) {
    this.x = x;
    this.y = y;
    this.lane = config.lane || 0;
    this.speed = config.speed || 200;
    this.carType = config.carType || "truck";
    this.roadBottomY = config.roadBottomY || 1000;
    this.active = true;
    this.visible = true;
    this.isOffscreen = false;
    this.inUse = true;

    // Guard against null container
    if (this.container) {
      this.container.position.set(x, y);
      this.container.visible = true;
    }
  }

  /**
   * Update car position
   */
  update(deltaTime) {
    super.update(deltaTime);

    if (!this.active) return;

    // Move car downward along the lane
    this.y += this.speed * deltaTime;
  }

  /**
   * Release car back to pool
   */
  release() {
    this.inUse = false;
    this.active = false;
    this.visible = false;
    if (this.container) {
      this.container.visible = false;
    }
  }

  /**
   * Check collision with another entity (for future use)
   */
  checkCollision(entity) {
    const bounds = this.getBounds();
    const otherBounds = entity.getBounds();

    return (
      bounds.x < otherBounds.x + otherBounds.width &&
      bounds.x + bounds.width > otherBounds.x &&
      bounds.y < otherBounds.y + otherBounds.height &&
      bounds.y + bounds.height > otherBounds.y
    );
  }

  /**
   * Check if car is visible in viewport (for optimized cleanup)
   */
  isInViewport(scrollX, scrollY, viewportWidth, viewportHeight) {
    const bounds = this.getBounds();

    // Add buffer zone to keep cars slightly outside viewport
    const buffer = 300;

    return (
      bounds.x + bounds.width > scrollX - buffer &&
      bounds.x < scrollX + viewportWidth + buffer &&
      bounds.y + bounds.height > scrollY - buffer &&
      bounds.y < scrollY + viewportHeight + buffer
    );
  }

  /**
   * Get actual bounds (accounting for centered position)
   */
  getBounds() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height,
    };
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
    super.destroy();
  }
}
