import { BaseEntity } from "./BaseEntity.js";

/**
 * Chicken - The player character entity using Spine animation
 * Handles chicken rendering and animation with hardware acceleration
 */
export class Chicken extends BaseEntity {
  constructor(x, y, config) {
    super(x, y);

    this.config = config;
    this.baseSize = config.chickenSize || 280;
    this.scale = config.chickenScale || 0.5; // Reduced default scale for Spine
    this.width = this.baseSize * this.scale;
    this.height = this.baseSize * this.scale;

    this.facingRight = true;
    this.currentAnimation = "idle";
    this.spine = null;
  }

  /**
   * Set the Spine animation
   */
  setSpine(spine) {
    // Guard against destroyed container
    if (!this.container) {
      console.warn("Cannot set spine: container is null");
      return;
    }

    if (this.spine) {
      this.spine.destroy();
    }

    this.spine = spine;

    if (!this.spine) {
      console.warn("Spine instance is null");
      return;
    }

    // Set scale
    this.spine.scale.set(this.scale);

    // Center the spine animation
    // Spine animations are typically centered at origin, but we may need to adjust
    this.spine.x = 0;
    this.spine.y = 0;

    // Set initial animation state
    if (this.spine.state) {
      // Try common animation names
      const animationNames = ["idle", "walk", "run", "stand", "animation"];
      let foundAnimation = false;

      for (const animName of animationNames) {
        try {
          this.spine.state.setAnimation(0, animName, true);
          this.currentAnimation = animName;
          foundAnimation = true;
          console.log(`\u2705 Playing Spine animation: ${animName}`);
          break;
        } catch (e) {
          // Animation doesn't exist, try next
        }
      }

      if (!foundAnimation) {
        console.warn(
          "No idle animation found, trying first available animation",
        );
        const animations = this.spine.spineData?.animations;
        if (animations && animations.length > 0) {
          this.spine.state.setAnimation(0, animations[0].name, true);
          this.currentAnimation = animations[0].name;
          console.log(`\u2705 Playing first animation: ${animations[0].name}`);
        }
      }
    }

    // Update scale based on facing direction
    if (!this.facingRight) {
      this.spine.scale.x = -Math.abs(this.spine.scale.x);
    }

    this.container.addChild(this.spine);
  }

  /**
   * Set the direction the chicken is facing
   */
  setDirection(facingRight) {
    this.facingRight = facingRight;
    if (this.spine) {
      this.spine.scale.x =
        Math.abs(this.spine.scale.x) * (facingRight ? 1 : -1);
    }
  }

  /**
   * Play animation
   */
  playAnimation(animationName) {
    if (
      this.spine &&
      this.spine.state &&
      this.currentAnimation !== animationName
    ) {
      try {
        this.spine.state.setAnimation(0, animationName, true);
        this.currentAnimation = animationName;
      } catch (e) {
        console.warn(`Animation ${animationName} not found`);
      }
    }
  }

  /**
   * Update chicken state
   */
  update(deltaTime) {
    super.update(deltaTime);

    if (!this.active) return;

    // Spine animation updates automatically via Pixi ticker
    // No manual update needed
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    if (this.spine) {
      this.spine.destroy();
      this.spine = null;
    }
    super.destroy();
  }
}
