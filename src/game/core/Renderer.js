/**
 * Renderer - Handles all canvas rendering operations with advanced anti-flickering
 * Uses double buffering and optimized rendering pipeline
 */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d", {
      alpha: false, // Disable alpha for better performance
      desynchronized: true, // Allow desynchronized rendering for smoother animations
      willReadFrequently: false, // Optimize for write-heavy operations
    });

    // Create offscreen canvas for double buffering (anti-flickering)
    this.offscreenCanvas = null;
    this.offscreenContext = null;
    this.useDoubleBuffering = this.initDoubleBuffering();

    // Optimize image rendering for anti-flickering
    const contextToOptimize = this.useDoubleBuffering
      ? this.offscreenContext
      : this.context;
    contextToOptimize.imageSmoothingEnabled = true;
    contextToOptimize.imageSmoothingQuality = "high";

    // Main context optimization
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = "high";

    this.width = canvas.width;
    this.height = canvas.height;

    // Performance optimization: reduce unnecessary operations
    this.lastClearColor = null;
  }

  /**
   * Initialize double buffering with OffscreenCanvas
   */
  initDoubleBuffering() {
    try {
      // Try to create OffscreenCanvas for better performance
      if (typeof OffscreenCanvas !== "undefined") {
        this.offscreenCanvas = new OffscreenCanvas(
          this.canvas.width,
          this.canvas.height,
        );
        this.offscreenContext = this.offscreenCanvas.getContext("2d", {
          alpha: false,
          desynchronized: true,
          willReadFrequently: false,
        });
        console.log("✅ Double buffering enabled with OffscreenCanvas");
        return true;
      }
    } catch {
      // OffscreenCanvas not supported, fallback to regular rendering
      console.log("ℹ️ OffscreenCanvas not supported, using standard rendering");
    }

    // Fallback: create regular canvas for double buffering
    try {
      this.offscreenCanvas = document.createElement("canvas");
      this.offscreenCanvas.width = this.canvas.width;
      this.offscreenCanvas.height = this.canvas.height;
      this.offscreenContext = this.offscreenCanvas.getContext("2d", {
        alpha: false,
        willReadFrequently: false,
      });
      console.log("✅ Double buffering enabled with regular canvas");
      return true;
    } catch (error) {
      console.warn("⚠️ Double buffering initialization failed:", error);
      return false;
    }
  }

  /**
   * Clear the canvas (with double buffering)
   */
  clear(color = "#2a2a2a") {
    const ctx = this.useDoubleBuffering ? this.offscreenContext : this.context;

    // Optimize: only change fillStyle if color changed
    if (this.lastClearColor !== color) {
      ctx.fillStyle = color;
      this.lastClearColor = color;
    }

    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Swap buffers - copy offscreen canvas to main canvas
   */
  swapBuffers() {
    if (this.useDoubleBuffering && this.offscreenCanvas) {
      // Optimized: copy offscreen buffer to main canvas in one operation (prevents flickering)
      // Using direct drawImage is faster than getImageData/putImageData
      this.context.drawImage(this.offscreenCanvas, 0, 0);
    }
  }

  /**
   * Begin rendering
   */
  begin() {
    // Prepare offscreen buffer if using double buffering
  }

  /**
   * End rendering and swap buffers
   */
  end() {
    // Swap buffers after all rendering is complete
    if (this.useDoubleBuffering) {
      this.swapBuffers();
    }
  }

  /**
   * Draw an image
   */
  drawImage(image, x, y, width, height) {
    if (!image) return;

    const ctx = this.getContext();
    if (width !== undefined && height !== undefined) {
      ctx.drawImage(image, x, y, width, height);
    } else {
      ctx.drawImage(image, x, y);
    }
  }

  /**
   * Draw a rectangle
   */
  drawRect(x, y, width, height, color) {
    const ctx = this.getContext();
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  }

  /**
   * Draw a stroked rectangle
   */
  strokeRect(x, y, width, height, color, lineWidth = 1) {
    const ctx = this.getContext();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(x, y, width, height);
  }

  /**
   * Draw text
   */
  drawText(text, x, y, font = "16px Arial", color = "#000000", align = "left") {
    const ctx = this.getContext();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
  }

  /**
   * Draw a line
   */
  drawLine(x1, y1, x2, y2, color = "#000000", lineWidth = 1, lineDash = []) {
    const ctx = this.getContext();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(lineDash);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * Draw a circle
   */
  drawCircle(x, y, radius, color) {
    const ctx = this.getContext();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Update canvas size (and offscreen buffer)
   */
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;

    // Resize offscreen buffer
    if (this.useDoubleBuffering && this.offscreenCanvas) {
      if (
        typeof OffscreenCanvas !== "undefined" &&
        this.offscreenCanvas instanceof OffscreenCanvas
      ) {
        // OffscreenCanvas
        this.offscreenCanvas.width = width;
        this.offscreenCanvas.height = height;
      } else {
        // Regular canvas
        this.offscreenCanvas.width = width;
        this.offscreenCanvas.height = height;
      }

      // Re-apply rendering optimizations after resize
      this.offscreenContext.imageSmoothingEnabled = true;
      this.offscreenContext.imageSmoothingQuality = "high";
    }

    // Re-apply main context optimizations
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = "high";
  }

  /**
   * Get the rendering context (returns offscreen context if double buffering)
   */
  getContext() {
    return this.useDoubleBuffering ? this.offscreenContext : this.context;
  }
}
