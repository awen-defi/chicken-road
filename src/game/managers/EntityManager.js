/**
 * EntityManager - Manages all game entities with Pixi.js integration
 * Handles entity lifecycle, batch operations, and stage management
 */
export class EntityManager {
  constructor(pixiRenderer = null) {
    this.entities = [];
    this.entitiesToAdd = [];
    this.entitiesToRemove = [];
    this.pixiRenderer = pixiRenderer;
    this.stage = pixiRenderer ? pixiRenderer.getStage() : null;
  }

  /**
   * Set the Pixi renderer (for adding entities to stage)
   */
  setPixiRenderer(pixiRenderer) {
    this.pixiRenderer = pixiRenderer;
    this.stage = pixiRenderer ? pixiRenderer.getStage() : null;

    // Enable sortable children for z-index support
    if (this.stage) {
      this.stage.sortableChildren = true;
    }
  }

  /**
   * Add an entity
   */
  addEntity(entity) {
    this.entitiesToAdd.push(entity);
  }

  /**
   * Remove an entity
   */
  removeEntity(entity) {
    this.entitiesToRemove.push(entity);
  }

  /**
   * Get all entities
   */
  getEntities() {
    return this.entities;
  }

  /**
   * Get entities of a specific type
   */
  getEntitiesOfType(type) {
    return this.entities.filter((entity) => entity instanceof type);
  }

  /**
   * Update all entities
   */
  update(deltaTime) {
    // Process additions (batch operation)
    if (this.entitiesToAdd.length > 0) {
      console.log(
        `🎯 Adding ${this.entitiesToAdd.length} entities to stage...`,
      );
      for (let i = 0; i < this.entitiesToAdd.length; i++) {
        const entity = this.entitiesToAdd[i];
        if (!entity) continue;

        this.entities.push(entity);

        // Add entity's display object to Pixi stage
        if (this.stage && entity.getDisplayObject) {
          const displayObject = entity.getDisplayObject();
          if (displayObject && !displayObject.destroyed) {
            try {
              this.stage.addChild(displayObject);
              console.log(
                `  ✅ Added ${entity.constructor.name} to stage at position (${entity.x}, ${entity.y})`,
              );
            } catch (e) {
              console.error(
                `  ❌ Failed to add ${entity.constructor.name} to stage:`,
                e,
              );
            }
          } else {
            console.warn(
              `  ⚠️ ${entity.constructor.name} has no valid display object`,
            );
          }
        } else {
          if (!this.stage) console.error("  ❌ Stage is null!");
          if (!entity.getDisplayObject)
            console.warn(
              `  ⚠️ ${entity.constructor.name} has no getDisplayObject method`,
            );
        }
      }
      this.entitiesToAdd.length = 0; // Faster than = []
      console.log(`🎯 Total entities in manager: ${this.entities.length}`);
      if (this.stage) {
        console.log(
          `🎯 Total children on stage: ${this.stage.children.length}`,
        );
      }
    }

    // Update active entities
    for (let i = 0; i < this.entities.length; i++) {
      const entity = this.entities[i];
      if (entity && entity.active) {
        try {
          entity.update(deltaTime);
        } catch (e) {
          console.warn("Error updating entity:", e);
        }
      }
    }

    // Process removals (batch operation)
    if (this.entitiesToRemove.length > 0) {
      // Use filter for better performance with many removals
      const toRemoveSet = new Set(this.entitiesToRemove);
      this.entities = this.entities.filter((entity) => {
        if (!entity || toRemoveSet.has(entity)) {
          if (entity) {
            // Remove from Pixi stage
            if (this.stage && entity.getDisplayObject) {
              const displayObject = entity.getDisplayObject();
              if (displayObject && displayObject.parent) {
                try {
                  this.stage.removeChild(displayObject);
                } catch {
                  // Display object might already be removed
                }
              }
            }
            try {
              entity.destroy();
            } catch {
              // Entity might already be destroyed
            }
          }
          return false;
        }
        return true;
      });
      this.entitiesToRemove.length = 0;
    }
  }

  /**
   * Render all entities - Pixi handles this automatically via stage
   */
  render(renderer) {
    // Pixi automatically renders all display objects in the stage
    // This method is kept for compatibility but rendering is handled by Pixi
    void renderer;
  }

  /**
   * Clear all entities
   */
  clear() {
    // Optimized: destroy all and clear arrays efficiently
    for (let i = 0; i < this.entities.length; i++) {
      const entity = this.entities[i];
      if (!entity) continue;

      // Remove from Pixi stage
      if (this.stage && entity.getDisplayObject) {
        const displayObject = entity.getDisplayObject();
        if (displayObject && displayObject.parent) {
          try {
            this.stage.removeChild(displayObject);
          } catch {
            // Display object might already be removed
          }
        }
      }

      try {
        entity.destroy();
      } catch {
        // Entity might already be destroyed
      }
    }
    this.entities.length = 0;
    this.entitiesToAdd.length = 0;
    this.entitiesToRemove.length = 0;
  }

  /**
   * Get entity count
   */
  getEntityCount() {
    return this.entities.length;
  }
}
