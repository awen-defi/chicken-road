import { useEffect, useRef, useState } from "react";
import { Game } from "../game/core/Game.js";
import { EntityManager } from "../game/managers/EntityManager.js";
import { InputSystem } from "../game/systems/InputSystem.js";
import { Chicken } from "../game/entities/Chicken.js";
import { Road } from "../game/entities/Road.js";
import { Scenery } from "../game/entities/Scenery.js";

/**
 * useGame - Custom hook to manage game instance lifecycle with Pixi.js
 * Initializes game, loads assets, creates entities, and manages game state
 */
export function useGame(canvasRef, config) {
  const gameRef = useRef(null);
  const entityManagerRef = useRef(null);
  const chickenRef = useRef(null);
  const isInitializedRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!canvasRef.current || isInitializedRef.current) return;

    const canvas = canvasRef.current;
    let game = null;
    let aborted = false;

    const initializeGame = async () => {
      try {
        // Prevent double initialization
        if (isInitializedRef.current) return;
        isInitializedRef.current = true;

        // Create managers
        const entityManager = new EntityManager();
        const inputSystem = new InputSystem(canvas);

        entityManagerRef.current = entityManager;

        // Create game instance with Pixi
        game = new Game(canvas, config);
        gameRef.current = game;

        // Initialize game with managers (this also initializes Pixi renderer)
        await game.initialize(entityManager, null, inputSystem);

        // Check if cleanup happened during async initialization
        if (aborted || !game || !game.renderer) {
          console.log("Game initialization aborted");
          return;
        }

        // Load assets using Pixi's asset system
        const textures = await game.renderer.loadTextures([
          { key: "start", url: "/start.png" },
          { key: "finish", url: "/finish.png" },
          // Car images
          { key: "truck-orange", url: "/assets/truck-orange.png" },
          { key: "truck-blue", url: "/assets/truck-blue.png" },
          { key: "car-yellow", url: "/assets/car-yellow.png" },
          { key: "car-police", url: "/assets/car-police.png" },
        ]);

        // Load Spine animation for chicken
        const chickenKeys = await game.renderer.loadSpineAnimation(
          "chicken",
          "/assets/chicken.json",
          "/assets/chiken.atlas",
        );

        // Check if cleanup happened during async loading
        if (aborted || !game || !game.renderer) {
          console.log("Game initialization aborted after texture loading");
          return;
        }

        // Get loaded textures
        const startTexture = textures.start;
        const finishTexture = textures.finish;

        // Calculate layout using texture dimensions
        const startWidth = startTexture.width;
        const startHeight = startTexture.height;
        const finishWidth = finishTexture.width;
        const finishHeight = finishTexture.height;
        const roadHeight = startHeight;
        const roadWidth = config.laneWidth * config.laneCount;

        // Set canvas size
        const totalWidth = startWidth + roadWidth + finishWidth / 2;
        const totalHeight = Math.max(roadHeight, finishHeight);

        // Update game renderer with new size
        game.resize(totalWidth, totalHeight);

        // Create entities with Pixi textures
        // Start scenery
        const startScenery = new Scenery(0, 0, "start", startTexture);
        entityManager.addEntity(startScenery);

        // Road
        const road = new Road(startWidth, 0, {
          laneWidth: config.laneWidth,
          laneCount: config.laneCount,
          roadHeight: roadHeight,
          roadColor: config.roadColor,
          lineColor: config.lineColor,
          roadLineWidth: config.roadLineWidth,
          dashPattern: config.dashPattern,
        });
        entityManager.addEntity(road);

        // Finish scenery (only half visible)
        const finishScenery = new Scenery(
          startWidth + roadWidth,
          0,
          "finish",
          finishTexture,
        );
        entityManager.addEntity(finishScenery);

        // Chicken with Spine animation
        const chickenX = startWidth - 80;
        const chickenY = roadHeight * 0.7;
        const chicken = new Chicken(chickenX, chickenY, {
          chickenSize: config.chickenSize,
          chickenScale: config.chickenScale || 0.5,
        });

        // Create Spine instance for chicken using loaded asset keys
        const chickenSpine = game.renderer.createSpine(chickenKeys);
        if (chickenSpine) {
          chicken.setSpine(chickenSpine);
        } else {
          console.error("Failed to create chicken Spine animation");
        }

        chicken.setDirection(true); // Facing right
        entityManager.addEntity(chicken);
        chickenRef.current = chicken;

        // Initialize car spawner with road, chicken, and container element
        // Get container element (parent of canvas)
        const containerElement = canvas.parentElement;
        if (game.carSpawner) {
          game.carSpawner.initialize(
            entityManager,
            game.renderer,
            road,
            chicken,
            containerElement,
          );
        }

        // Start game loop
        game.start();

        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize game:", error);
        isInitializedRef.current = false;
        setIsLoading(false);
      }
    };

    initializeGame();

    // Cleanup
    return () => {
      aborted = true;
      isInitializedRef.current = false;

      if (game) {
        try {
          game.destroy();
        } catch (e) {
          console.warn("Error during cleanup:", e);
        }
        game = null;
      }
      gameRef.current = null;
    };
  }, []); // Empty deps - only run once

  return {
    gameRef,
    entityManagerRef,
    chickenRef,
    isLoading,
  };
}
