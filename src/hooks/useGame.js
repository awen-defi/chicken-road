import { useEffect, useRef, useState } from "react";
import { Game } from "../game/core/Game.js";
import { EntityManager } from "../game/managers/EntityManager.js";
import { AssetManager } from "../game/managers/AssetManager.js";
import { InputSystem } from "../game/systems/InputSystem.js";
import { Chicken } from "../game/entities/Chicken.js";
import { Road } from "../game/entities/Road.js";
import { Scenery } from "../game/entities/Scenery.js";

/**
 * useGame - Custom hook to manage game instance lifecycle
 * Initializes game, loads assets, creates entities, and manages game state
 */
export function useGame(canvasRef, config) {
  const gameRef = useRef(null);
  const entityManagerRef = useRef(null);
  const assetManagerRef = useRef(null);
  const chickenRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    let isInitialized = false;

    const initializeGame = async () => {
      try {
        // Create managers
        const entityManager = new EntityManager();
        const assetManager = new AssetManager();
        const inputSystem = new InputSystem(canvas);

        entityManagerRef.current = entityManager;
        assetManagerRef.current = assetManager;

        // Create game instance
        const game = new Game(canvas, config);
        gameRef.current = game;

        // Initialize game with managers
        await game.initialize(entityManager, assetManager, inputSystem);

        // Load assets
        await assetManager.loadImages([
          { key: "start", url: "/start.png" },
          { key: "finish", url: "/finish.png" },
          { key: "chicken", url: "/assets/chicken.png" },
          // Car images
          { key: "truck-orange", url: "/assets/truck-orange.png" },
          { key: "truck-blue", url: "/assets/truck-blue.png" },
          { key: "car-yellow", url: "/assets/car-yellow.png" },
          { key: "car-police", url: "/assets/car-police.png" },
        ]);

        // Get loaded images
        const startImage = assetManager.getImage("start");
        const finishImage = assetManager.getImage("finish");
        const chickenImage = assetManager.getImage("chicken");

        // Calculate layout
        const startWidth = startImage.width;
        const startHeight = startImage.height;
        const finishWidth = finishImage.width;
        const finishHeight = finishImage.height;
        const roadHeight = startHeight;
        const roadWidth = config.laneWidth * config.laneCount;

        // Set canvas size
        canvas.width = startWidth + roadWidth + finishWidth / 2;
        canvas.height = Math.max(roadHeight, finishHeight);

        // Update game renderer with new size
        game.resize(canvas.width, canvas.height);

        // Create entities
        // Start scenery
        const startScenery = new Scenery(0, 0, "start", startImage);
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
          finishImage,
        );
        entityManager.addEntity(finishScenery);

        // Chicken
        const chickenX = startWidth - 80;
        const chickenY = roadHeight * 0.7;
        const chicken = new Chicken(chickenX, chickenY, {
          chickenSize: config.chickenSize,
          chickenScale: config.chickenScale,
        });
        chicken.setImage(chickenImage);
        chicken.setDirection(true); // Facing right
        entityManager.addEntity(chicken);
        chickenRef.current = chicken;

        // Initialize car spawner with road, chicken, and container element
        // Get container element (parent of canvas)
        const containerElement = canvas.parentElement;
        if (game.carSpawner) {
          game.carSpawner.initialize(
            entityManager,
            assetManager,
            road,
            chicken,
            containerElement,
          );
        }

        // Start game loop
        game.start();

        isInitialized = true;
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize game:", error);
        setIsLoading(false);
      }
    };

    initializeGame();

    // Cleanup
    return () => {
      if (isInitialized && gameRef.current) {
        gameRef.current.destroy();
      }
    };
  }, [canvasRef, config]);

  return {
    gameRef,
    entityManagerRef,
    assetManagerRef,
    chickenRef,
    isLoading,
  };
}
