import { BaseEntity } from "./BaseEntity.js";
import { Sprite } from "pixi.js";

/**
 * Scenery - Represents start and finish images using Pixi sprites
 * Handles scenery rendering with hardware acceleration
 */
export class Scenery extends BaseEntity {
  constructor(x, y, type, texture = null) {
    super(x, y);

    this.type = type; // 'start' or 'finish'
    this.sprite = null;

    if (texture) {
      this.setTexture(texture);
    }
  }

  /**
   * Set the scenery texture (Pixi texture)
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
    this.sprite.position.set(0, 0);
    this.container.addChild(this.sprite);

    this.width = texture.width;
    this.height = texture.height;
  }

  /**
   * Update scenery (static)
   */
  update(deltaTime) {
    super.update(deltaTime);
    // Static entity
    void deltaTime;
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
