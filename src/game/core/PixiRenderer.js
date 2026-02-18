import { Application, Assets, Container, Graphics } from "pixi.js";
import { Spine } from "@esotericsoftware/spine-pixi-v8";

/**
 * PixiRenderer - Advanced WebGL-based rendering using Pixi.js
 * Provides hardware-accelerated rendering with optimal performance
 */
export class PixiRenderer {
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.app = null;
    this.stage = null;
    this.initialized = false;

    // Configuration with optimal defaults
    this.config = {
      backgroundColor: config.backgroundColor || 0x2a2a2a,
      resolution: config.resolution || window.devicePixelRatio || 1,
      antialias: config.antialias !== false,
      autoDensity: true,
      ...config,
    };
  }

  /**
   * Initialize Pixi.js Application with optimal settings
   */
  async initialize() {
    if (this.initialized) return;

    // Create Pixi Application with WebGL renderer
    this.app = new Application();

    await this.app.init({
      canvas: this.canvas,
      background: this.config.backgroundColor,
      resolution: this.config.resolution,
      antialias: this.config.antialias,
      autoDensity: this.config.autoDensity,
      powerPreference: "high-performance", // Use high-performance GPU
      hello: false, // Disable Pixi.js banner in console
      roundPixels: true, // Prevent sub-pixel rendering for sharper graphics
    });

    // Check if app was destroyed during async init (race condition)
    if (!this.app) {
      console.log("PixiRenderer was destroyed during initialization");
      return;
    }

    this.stage = this.app.stage;
    this.initialized = true;

    console.log("✅ Pixi.js WebGL renderer initialized");
    console.log(`   Resolution: ${this.config.resolution}x`);
    console.log(
      `   WebGL: ${this.app.renderer.type === 1 ? "Yes" : "Canvas fallback"}`,
    );
  }

  /**
   * Get the main stage container
   */
  getStage() {
    return this.stage;
  }

  /**
   * Create a new container for organizing sprites
   */
  createContainer() {
    return new Container();
  }

  /**
   * Create a graphics object for drawing shapes
   */
  createGraphics() {
    return new Graphics();
  }

  /**
   * Load texture from URL using Pixi's asset system
   */
  async loadTexture(key, url) {
    try {
      Assets.add({ alias: key, src: url });
      const texture = await Assets.load(key);
      return texture;
    } catch (error) {
      console.error(`Failed to load texture ${key}:`, error);
      return null;
    }
  }

  /**
   * Load multiple textures in parallel
   */
  async loadTextures(assets) {
    const assetArray = [];

    // Only add assets that aren't already loaded
    for (const { key, url } of assets) {
      if (!Assets.cache.has(key)) {
        assetArray.push({ alias: key, src: url });
      }
    }

    if (assetArray.length > 0) {
      Assets.add(assetArray);
    }

    try {
      const allKeys = assets.map((a) => a.key);
      const textures = await Assets.load(allKeys);
      console.log(`✅ Loaded ${Object.keys(textures).length} textures`);
      return textures;
    } catch (error) {
      console.error("Failed to load textures:", error);
      return {};
    }
  }

  /**
   * Get loaded texture
   */
  getTexture(key) {
    return Assets.get(key);
  }

  /**
   * Load Spine animation from JSON file
   * The spine-pixi-v8 loader automatically handles atlas loading
   */
  async loadSpineAnimation(key, jsonUrl, atlasUrl) {
    try {
      console.log(`Loading Spine animation: ${key}`);

      // Load atlas and skeleton separately as required by spine-pixi-v8
      Assets.add({ alias: `${key}_atlas`, src: atlasUrl });
      Assets.add({ alias: `${key}_skeleton`, src: jsonUrl });

      await Assets.load([`${key}_atlas`, `${key}_skeleton`]);

      console.log(`✅ Loaded Spine animation files for: ${key}`);
      return { skeleton: `${key}_skeleton`, atlas: `${key}_atlas` };
    } catch (error) {
      console.error(`Failed to load Spine animation ${key}:`, error);
      throw error;
    }
  }

  /**
   * Create a Spine instance from loaded data
   */
  createSpine(assetKeys) {
    try {
      console.log(`Creating Spine instance from:`, assetKeys);

      // Create Spine instance - spine-pixi-v8 format
      // Expects { skeleton: 'skeleton-key', atlas: 'atlas-key' }
      const spine = Spine.from(assetKeys);
      console.log(`✅ Created Spine instance`);

      return spine;
    } catch (error) {
      console.error(`Failed to create Spine instance:`, error);
      console.error("Error:", error);
      return null;
    }
  }

  /**
   * Resize renderer
   */
  resize(width, height) {
    if (this.app) {
      this.app.renderer.resize(width, height);
    }
  }

  /**
   * Add child to stage
   */
  addToStage(displayObject) {
    if (this.stage && displayObject) {
      this.stage.addChild(displayObject);
    }
  }

  /**
   * Remove child from stage
   */
  removeFromStage(displayObject) {
    if (this.stage && displayObject) {
      this.stage.removeChild(displayObject);
    }
  }

  /**
   * Clear stage
   */
  clear() {
    if (this.stage) {
      this.stage.removeChildren();
    }
  }

  /**
   * Render frame (handled automatically by Pixi's ticker)
   */
  render() {
    // Pixi automatically renders, but we can force a render if needed
    if (this.app && this.app.renderer) {
      this.app.renderer.render(this.stage);
    }
  }

  /**
   * Get renderer instance
   */
  getRenderer() {
    return this.app ? this.app.renderer : null;
  }

  /**
   * Destroy renderer and cleanup
   */
  destroy() {
    if (this.app) {
      // Stop ticker first (if it exists)
      if (this.app.ticker) {
        try {
          this.app.ticker.stop();
        } catch {
          // Ticker might already be stopped or destroyed
        }
      }

      // Clear stage
      if (this.stage) {
        try {
          this.stage.removeChildren();
        } catch {
          // Stage might already be destroyed
        }
      }

      // Destroy app but keep canvas element
      try {
        this.app.destroy(false, {
          children: true,
          texture: false, // Keep textures cached
          baseTexture: false,
        });
      } catch {
        // App might already be destroyed
      }

      this.app = null;
      this.stage = null;
      this.initialized = false;
    }
  }
}
