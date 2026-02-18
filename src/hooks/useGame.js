import { useEffect, useRef, useState, useCallback } from "react";
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
export function useGame(canvasRef, config, scrollContainerRef) {
  const gameRef = useRef(null);
  const entityManagerRef = useRef(null);
  const chickenRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Lane tracking for chicken jumps
  const currentLaneRef = useRef(0); // 0 = start sidewalk, 1-N = road lanes, N+1 = finish sidewalk
  const lanePositionsRef = useRef([]); // Array of X positions for each lane
  const totalLanesRef = useRef(0); // Total number of lanes including sidewalks
  const startWidthRef = useRef(0); // Store start scenery width for camera calculations
  const roadWidthRef = useRef(0); // Store total road width

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
          // Coin images
          { key: "coin", url: "/coin.png" },
          { key: "coin-gold", url: "/coin-gold.png" },
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

        // Scaling factor for all elements
        const sceneryScale = 0.7;

        // Calculate layout using scaled texture dimensions
        const startWidth = startTexture.width * sceneryScale;
        const startHeight = startTexture.height * sceneryScale;
        const finishWidth = finishTexture.width * sceneryScale;
        const finishHeight = finishTexture.height * sceneryScale;
        const roadHeight = startHeight;
        const roadWidth = config.laneWidth * config.laneCount;

        // Set canvas size
        const totalWidth = startWidth + roadWidth + finishWidth / 2;
        const totalHeight = Math.max(roadHeight, finishHeight);

        // Update game renderer with new size
        game.resize(totalWidth, totalHeight);

        // Move scenery up to reveal walking road
        const sceneryOffsetY = -50;

        // Create entities with Pixi texture

        // Start scenery
        const startScenery = new Scenery(
          0,
          sceneryOffsetY,
          "start",
          startTexture,
          sceneryScale,
        );
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
          sceneryOffsetY,
          "finish",
          finishTexture,
          sceneryScale,
        );
        entityManager.addEntity(finishScenery);

        // Chicken with Spine animation
        const chickenX = startWidth - 160;
        const chickenY = roadHeight * 0.7 + 70;
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

        // Calculate lane positions for jumping
        // Lane 0: starting position (on start scenery/sidewalk)
        // Lanes 1 to laneCount: road lanes (center of each lane)
        // Lane laneCount+1: finish position (on finish scenery/sidewalk)
        const lanePositions = [];

        // Starting position (current chicken position)
        lanePositions.push(chickenX);

        // Road lane positions (center of each lane)
        for (let i = 0; i < config.laneCount; i++) {
          const laneCenter =
            startWidth + i * config.laneWidth + config.laneWidth / 2;
          lanePositions.push(laneCenter);
        }

        // Finish position (on finish sidewalk)
        const finishX = startWidth + roadWidth + 160;
        lanePositions.push(finishX);

        lanePositionsRef.current = lanePositions;
        totalLanesRef.current = lanePositions.length;
        currentLaneRef.current = 0; // Start at position 0

        // Store layout dimensions for camera scrolling
        startWidthRef.current = startWidth;
        roadWidthRef.current = roadWidth;

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

        // Initialize coin manager with road and chicken
        if (game.coinManager) {
          game.coinManager.initialize(
            entityManager,
            game.renderer,
            road,
            chicken,
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

  // Jump function to move chicken to next lane (memoized to prevent re-renders)
  const jumpChicken = useCallback(() => {
    const chicken = chickenRef.current;
    const game = gameRef.current;
    if (!chicken || chicken.isJumping || !game) return false; // Can't jump if already jumping

    const currentLane = currentLaneRef.current;
    const totalLanes = totalLanesRef.current;

    // Check if chicken can jump forward
    if (currentLane >= totalLanes - 1) {
      console.log("Chicken has reached the end!");
      return false; // Already at finish
    }

    // Move to next lane
    const nextLane = currentLane + 1;
    const targetX = lanePositionsRef.current[nextLane];

    console.log(
      `Jumping from lane ${currentLane} to lane ${nextLane}, position ${targetX}`,
    );

    // Start moving world when jumping FROM lane 2 TO lane 3 (nextLane >= 3)
    const shouldMoveWorld = nextLane >= 3;
    const wasMovingWorld = currentLane >= 3;

    if (shouldMoveWorld && scrollContainerRef?.current) {
      const container = scrollContainerRef.current;
      const containerWidth = container.clientWidth;
      const fixedChickenX = containerWidth * 0.4;

      // If this is the first time entering world-move mode, set chicken to fixed position
      if (!wasMovingWorld) {
        chicken.container.position.x = fixedChickenX;
        console.log(
          `🐔 Setting chicken to fixed viewport position: ${fixedChickenX}px`,
        );
      }

      // Calculate world offset animation
      const stage = game.renderer?.app?.stage;
      if (stage) {
        // Current world offset (where we are now)
        // On first transition to world-move mode, calculate based on chicken's actual position
        // On subsequent moves, use the stage's current offset
        const currentWorldOffset = wasMovingWorld
          ? -stage.x
          : chicken.x - fixedChickenX;

        // Target world offset (where we want to be)
        const targetWorldOffset = targetX - fixedChickenX;

        console.log(
          `🌍 Animating world from ${currentWorldOffset}px to ${targetWorldOffset}px over ${chicken.jumpDuration}s`,
        );

        // Pass world animation data to chicken
        const worldAnimationData = {
          stage: stage,
          startOffset: currentWorldOffset,
          endOffset: targetWorldOffset,
          fixedViewportX: fixedChickenX,
        };

        // Chicken jumps with world movement animation
        chicken.jumpTo(targetX, shouldMoveWorld, worldAnimationData);
      } else {
        // Fallback if stage not available
        chicken.jumpTo(targetX, shouldMoveWorld);
      }
    } else {
      // First three lanes (0, 1, 2): chicken moves normally without world movement
      chicken.jumpTo(targetX, shouldMoveWorld);
    }

    currentLaneRef.current = nextLane;

    return true;
  }, [scrollContainerRef]);

  return {
    gameRef,
    entityManagerRef,
    chickenRef,
    isLoading,
    jumpChicken,
  };
}
