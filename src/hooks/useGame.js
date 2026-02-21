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
  const roadRef = useRef(null); // Store road reference for updates
  const finishSceneryRef = useRef(null); // Store finish scenery reference for updates
  const isInitializedRef = useRef(false);

  // Lane tracking for chicken jumps
  const currentLaneRef = useRef(0); // 0 = start sidewalk, 1-N = road lanes, N+1 = finish sidewalk
  const lanePositionsRef = useRef([]); // Array of X positions for each lane
  const totalLanesRef = useRef(0); // Total number of lanes including sidewalks
  const startWidthRef = useRef(0); // Store start scenery width for camera calculations
  const roadWidthRef = useRef(0); // Store total road width

  // Layout dimensions for canvas resizing
  const finishWidthRef = useRef(0); // Store finish scenery width
  const roadHeightRef = useRef(0); // Store road height
  const canvasWidthRef = useRef(0); // Store total canvas width for clamping

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
          return;
        }

        // Load assets using Pixi's asset system
        const textures = await game.renderer.loadTextures([
          { key: "start", url: "/start.png" },
          { key: "finish", url: "/finish.png" },
          // Gate image
          { key: "gate", url: "/gate.png" },
          // Coin images
          { key: "coin", url: "/coin.png" },
          { key: "coin-gold", url: "/coin-gold.png" },
          // Chicken tooltip
          { key: "chicken-tooltip", url: "/chicken-tooltip.png" },
          // Win notification
          { key: "win-notification", url: "/winNotification.png" },
          // Car images
          { key: "truck-orange", url: "/truck-orange.png" },
          { key: "truck-blue", url: "/truck-blue.png" },
          { key: "car-yellow", url: "/car-yellow.png" },
          { key: "car-police", url: "/car-police.png" },
        ]);

        // Load Spine animation for chicken
        const chickenKeys = await game.renderer.loadSpineAnimation(
          "chicken",
          "/chicken.json",
          "/chicken.atlas",
        );

        // Check if cleanup happened during async loading
        if (aborted || !game || !game.renderer) {
          return;
        }

        // CRITICAL: Initialize win notification AFTER textures are loaded
        // This ensures the win-notification texture exists
        if (game.initializeWinDisplay) {
          game.initializeWinDisplay();
        }

        // Get loaded textures
        const startTexture = textures.start;
        const finishTexture = textures.finish;

        // Scaling factor for all elements
        const sceneryScale = 1.1; // Increased by 1.2x from previous 0.84 (0.84 * 1.2)

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

        // Store layout dimensions for later resizing
        finishWidthRef.current = finishWidth;
        roadHeightRef.current = roadHeight;
        canvasWidthRef.current = totalWidth; // Store for world offset clamping

        // Update game renderer with new size
        game.resize(totalWidth, totalHeight);

        // Move scenery up to reveal walking road (isolated from road centering)
        const sceneryOffsetY = -600; // Scenery stays at current position

        // Calculate positions for game elements (chicken, coins, gates, road)
        // Position chicken higher up on canvas for better visual centering
        const gameElementsCenterY = totalHeight * 0.35; // Position in upper-middle area
        const roadY = gameElementsCenterY - roadHeight / 2; // Road aligned with chicken

        // Create entities with Pixi texture

        // Start scenery (isolated positioning - unchanged)
        const startScenery = new Scenery(
          0,
          sceneryOffsetY,
          "start",
          startTexture,
          sceneryScale,
        );
        entityManager.addEntity(startScenery);

        // Road (positioned to align with chicken)
        const road = new Road(startWidth, roadY, {
          laneWidth: config.laneWidth,
          laneCount: config.laneCount,
          roadHeight: roadHeight,
          roadColor: config.roadColor,
          lineColor: config.lineColor,
          roadLineWidth: config.roadLineWidth,
          dashPattern: config.dashPattern,
        });
        entityManager.addEntity(road);
        roadRef.current = road; // Store reference for updates

        // Finish scenery (isolated positioning - unchanged)
        const finishScenery = new Scenery(
          startWidth + roadWidth,
          sceneryOffsetY,
          "finish",
          finishTexture,
          sceneryScale,
        );
        entityManager.addEntity(finishScenery);
        finishSceneryRef.current = finishScenery; // Store reference for updates

        // Chicken with Spine animation (positioned in upper-middle for visual centering)
        const chickenX = startWidth - 160;
        const chickenY = gameElementsCenterY; // Chicken at visual center (upper-middle)

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

        // Set tooltip texture
        const tooltipTexture = game.renderer.getTexture("chicken-tooltip");
        if (tooltipTexture) {
          chicken.setTooltipTexture(tooltipTexture);
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

        // Initialize car spawner with road, chicken, gate manager, and container element
        // Get container element (parent of canvas)
        const containerElement = canvas.parentElement;

        // Store container element in game for win notification positioning
        if (game.setContainerElement && containerElement) {
          game.setContainerElement(containerElement);
        }

        if (game.carSpawner) {
          try {
            game.carSpawner.initialize(
              entityManager,
              game.renderer,
              road,
              chicken,
              containerElement,
              game.gateManager, // Pass gate manager
            );
          } catch (error) {
            console.error("CarSpawner initialization failed:", error);
          }
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

        // Initialize gate manager with road and chicken
        if (game.gateManager) {
          game.gateManager.initialize(
            entityManager,
            game.renderer,
            road,
            chicken,
          );
        }

        // Set entity references in game for dynamic updates
        game.setEntityReferences(road, finishScenery);

        // Store game instance for React access (Play button control)
        window.__GAME_INSTANCE__ = game;

        // Start game loop (but state will be "idle" until Play button clicked)
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

      // Clear global game instance reference
      if (window.__GAME_INSTANCE__) {
        window.__GAME_INSTANCE__ = null;
      }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initialize once - handle difficulty changes separately

  // Jump function to move chicken to next lane (memoized to prevent re-renders)
  const jumpChicken = useCallback(
    (onFinishCallback = null) => {
      const chicken = chickenRef.current;
      const game = gameRef.current;
      if (!chicken || chicken.isJumping || !game) return false; // Can't jump if already jumping

      const currentLane = currentLaneRef.current;
      const totalLanes = totalLanesRef.current;

      // Check if chicken can jump forward
      if (currentLane >= totalLanes - 1) {
        return false; // Already at finish
      }

      // Move to next lane
      const nextLane = currentLane + 1;
      const isJumpingToFinish = nextLane >= totalLanes - 1; // Detect if jumping TO finish line

      // If jumping to finish, hide tooltip and turn current coin gold IMMEDIATELY (before jump starts)
      if (isJumpingToFinish) {
        chicken.hideTooltip(); // Hide tooltip before jumping to finish
        if (game.coinManager) {
          game.coinManager.finishCurrentLane();
        }
      }
      const targetX = lanePositionsRef.current[nextLane];

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
        }

        // Calculate world offset animation
        const stage = game.renderer?.app?.stage;
        if (stage) {
          const containerWidth = container.clientWidth;
          const canvasWidth = canvasWidthRef.current;

          // Calculate maximum allowed world offset to prevent black space
          const maxWorldOffset = Math.max(0, canvasWidth - containerWidth);

          // Current world offset (where we are now)
          // On first transition to world-move mode, calculate based on chicken's actual position
          // On subsequent moves, use the stage's current offset
          const currentWorldOffset = wasMovingWorld
            ? -stage.x
            : chicken.x - fixedChickenX;

          // Target world offset (where we want to be) - clamped to valid range
          let targetWorldOffset = targetX - fixedChickenX;
          targetWorldOffset = Math.max(
            0,
            Math.min(targetWorldOffset, maxWorldOffset),
          );

          // Pass world animation data to chicken
          const worldAnimationData = {
            stage: stage,
            startOffset: currentWorldOffset,
            endOffset: targetWorldOffset,
            maxWorldOffset: maxWorldOffset,
            fixedViewportX: fixedChickenX,
          };

          // Chicken jumps with world movement animation
          // If jumping to finish, pass callback to trigger win sequence on landing
          const landingCallback = isJumpingToFinish ? onFinishCallback : null;
          chicken.jumpTo(
            targetX,
            shouldMoveWorld,
            worldAnimationData,
            landingCallback,
          );
        } else {
          // Fallback if stage not available
          const landingCallback = isJumpingToFinish ? onFinishCallback : null;
          chicken.jumpTo(targetX, shouldMoveWorld, null, landingCallback);
        }
      } else {
        // First three lanes (0, 1, 2): chicken moves normally without world movement
        const landingCallback = isJumpingToFinish ? onFinishCallback : null;
        chicken.jumpTo(targetX, shouldMoveWorld, null, landingCallback);
      }

      currentLaneRef.current = nextLane;

      // Update tooltip with new multiplier after landing (unless jumping to finish)
      if (!isJumpingToFinish && game.coinManager) {
        // Show tooltip on first lane (lane 1)
        if (nextLane === 1) {
          chicken.showTooltip();
        }
        // Schedule tooltip update after jump completes
        setTimeout(() => {
          const multiplier = game.coinManager.getCurrentMultiplier();
          chicken.updateTooltipText(multiplier);
        }, 400); // Match jump duration
      }

      return true;
    },
    [scrollContainerRef],
  );

  // Get current coin multiplier
  const getCurrentMultiplier = useCallback(() => {
    const game = gameRef.current;
    if (!game) return 1.0;
    return game.getCurrentMultiplier();
  }, []);

  // Finish current lane (turn current lane's coin to gold)
  const finishCurrentLane = useCallback(() => {
    const game = gameRef.current;
    if (game) {
      game.finishCurrentLane();
    }
  }, []);

  // Update game difficulty dynamically
  const updateDifficulty = useCallback(
    (newDifficulty, newConfig) => {
      const game = gameRef.current;
      const road = roadRef.current;
      const chicken = chickenRef.current;

      if (!game || !road || !chicken) {
        console.warn("Cannot update difficulty: game not fully initialized");
        return;
      }

      // Get start width from ref
      const startWidth = startWidthRef.current;

      // Call game updateDifficulty with all required params
      game.updateDifficulty(newDifficulty, newConfig, startWidth);

      // Recalculate lane positions for chicken jumping
      const lanePositions = [];
      const chickenStartX = lanePositionsRef.current[0]; // Original start position

      // Starting position (same as before)
      lanePositions.push(chickenStartX);

      // Road lane positions (center of each lane)
      for (let i = 0; i < newConfig.laneCount; i++) {
        const laneCenter =
          startWidth + i * newConfig.laneWidth + newConfig.laneWidth / 2;
        lanePositions.push(laneCenter);
      }

      // Finish position (on finish sidewalk)
      const newRoadWidth = newConfig.laneWidth * newConfig.laneCount;
      const finishX = startWidth + newRoadWidth + 160;
      lanePositions.push(finishX);

      // Update refs
      lanePositionsRef.current = lanePositions;
      totalLanesRef.current = lanePositions.length;
      roadWidthRef.current = newRoadWidth;

      // Reset chicken to starting position
      chicken.x = chickenStartX;
      chicken.container.position.x = chickenStartX;
      currentLaneRef.current = 0;

      // Reset world position
      const stage = game.renderer?.app?.stage;
      if (stage) {
        stage.x = 0;
      }

      // Resize canvas to match new layout
      const finishWidth = finishWidthRef.current;
      const roadHeight = roadHeightRef.current;
      const newTotalWidth = startWidth + newRoadWidth + finishWidth / 2;
      const newTotalHeight = roadHeight; // Height doesn't change

      canvasWidthRef.current = newTotalWidth; // Update canvas width ref

      game.resize(newTotalWidth, newTotalHeight);

      // Force container to recalculate scroll bounds by triggering reflow
      if (scrollContainerRef?.current) {
        const container = scrollContainerRef.current;
        // Reset scroll position to ensure proper bounds
        container.scrollLeft = 0;
        // Force reflow to recalculate scrollable area
        void container.offsetWidth;
      }
    },
    [scrollContainerRef],
  );

  // Reset game to initial state
  const resetGame = useCallback(() => {
    const game = gameRef.current;
    const chicken = chickenRef.current;
    if (!game || !chicken) return;

    // Reset game entities (coins, gates, etc.)
    game.resetGame();

    // Reset chicken to starting position
    if (lanePositionsRef.current.length > 0) {
      const startX = lanePositionsRef.current[0];
      chicken.x = startX;
      chicken.container.position.x = startX;

      // Reset Y position to ground level
      chicken.container.position.y = chicken.jumpStartY;
      chicken.y = chicken.jumpStartY;

      currentLaneRef.current = 0;

      // Hide tooltip on reset
      chicken.hideTooltip();

      // Reset chicken jump state
      chicken.isJumping = false;
      chicken.jumpProgress = 0;
      chicken.hasStartedJumpAnimation = false;

      // Reset world movement state
      chicken.shouldMoveWorld = false;
      chicken.stage = null;
      chicken.startWorldOffset = 0;
      chicken.endWorldOffset = 0;
      chicken.maxWorldOffset = 0;
      chicken.fixedViewportX = null;

      // Reset animation to idle
      if (chicken.spine && chicken.spine.state) {
        try {
          const idleAnimations = ["idle", "idle_front", "stand"];
          for (const anim of idleAnimations) {
            try {
              chicken.spine.state.setAnimation(0, anim, true);
              chicken.currentAnimation = anim;
              break;
            } catch {
              // Try next animation
            }
          }
        } catch (e) {
          console.warn("Could not reset chicken animation:", e);
        }
      }
    }

    // Reset world position to eliminate extra space
    const stage = game.renderer?.app?.stage;
    if (stage) {
      stage.x = 0;
    }

    // Reset scroll position
    if (scrollContainerRef?.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [scrollContainerRef]);

  // Register collision callback
  // REQUIREMENT: Complete death sequence with proper timing and state restoration
  //
  // FLOW:
  //   1. Collision detected -> hasCollided flag set (prevents multiple triggers)
  //   2. Car continues moving (not stopped) until naturally removed during cleanup
  //   3. onCollisionFromApp() called -> App.jsx sets gameState to "lost" (locks input)
  //   4. game.state set to "gameover" (allows animations, stops game systems)
  //   5. Death animation plays
  //   6. 1-second visual buffer
  //   7. Reset sequence: wipe cars -> reset chicken -> reset scene -> reset objects
  //   8. game.state set to "playing" (re-enable game systems)
  //   9. onResetComplete() called -> App.jsx sets gameState to "playing" (unlock input)
  //
  const registerCollisionCallback = useCallback(
    (onCollisionFromApp, onResetComplete) => {
      const game = gameRef.current;
      const chicken = chickenRef.current;

      if (!game || !game.carSpawner || !chicken) {
        return;
      }

      // Set up collision callback (decoupled from detection logic)
      game.carSpawner.onCollision = async () => {
        // REQUIREMENT: Immediately halt all user input by notifying App
        // This sets gameState to "lost" which blocks handlePlay
        if (onCollisionFromApp) {
          onCollisionFromApp();
        }

        // REQUIREMENT: Execute death sequence with timing (animation + 1s delay)
        await game.handleChickenDeath(async () => {
          // REQUIREMENT: Complete Reset Sequence (executed after death animation + 1s delay)
          // Proper Order: 1. Stop collision checks & wipe cars
          //              2. Reset chicken position & state
          //              3. Reset camera/scene view
          //              4. Reset game objects (coins, gates)
          //              5. Re-enable input & restore game state

          // STEP 1: WIPE ALL CARS FIRST (including the one that caused collision)
          // This ensures the stage is completely clean before visual reset
          if (game.carSpawner) {
            try {
              game.carSpawner.reset();
            } catch (error) {
              console.error("Error resetting car spawner:", error);
            }
          }

          // STEP 2: RESET CHICKEN TO STARTING POSITION
          if (lanePositionsRef.current.length > 0) {
            const startX = lanePositionsRef.current[0];
            chicken.x = startX;
            chicken.container.position.x = startX;

            // Reset Y position to ground level
            chicken.container.position.y = chicken.jumpStartY;
            chicken.y = chicken.jumpStartY;

            currentLaneRef.current = 0;

            // Reset chicken jump state
            chicken.isJumping = false;
            chicken.jumpProgress = 0;
            chicken.hasStartedJumpAnimation = false;

            // Reset world movement state
            chicken.shouldMoveWorld = false;
            chicken.stage = null;
            chicken.startWorldOffset = 0;
            chicken.endWorldOffset = 0;
            chicken.maxWorldOffset = 0;
            chicken.fixedViewportX = null;

            // REQUIREMENT: Set chicken to ready/idle state
            if (chicken.spine && chicken.spine.state) {
              try {
                const idleAnimations = ["idle", "idle_front", "stand"];
                for (const anim of idleAnimations) {
                  try {
                    chicken.spine.state.setAnimation(0, anim, true);
                    chicken.currentAnimation = anim;
                    break;
                  } catch {
                    // Try next animation
                  }
                }
              } catch (e) {
                console.warn("Could not reset chicken animation:", e);
              }
            }
          }

          // STEP 3: RESET CAMERA/SCENE VIEW TO STARTING STATE
          const stage = game.renderer?.app?.stage;
          if (stage) {
            stage.x = 0;
          }

          // Reset scroll position
          if (scrollContainerRef?.current) {
            scrollContainerRef.current.scrollLeft = 0;
          }

          // STEP 4: RESET GAME OBJECTS
          // 4a. Reset coins (Golds to 0, NOT permanent balance)
          if (game.coinManager) {
            try {
              game.coinManager.reset();
            } catch (error) {
              console.error("Error resetting coins:", error);
            }
          }

          // 4b. Reset gates
          if (game.gateManager) {
            try {
              game.gateManager.destroy();
            } catch (error) {
              console.error("Error resetting gates:", error);
            }
          }

          // STEP 5: RE-ENABLE INPUT & RESTORE GAME STATE TO IDLE
          // CRITICAL: Set game to "idle" so it waits for Play button click
          // This stops car spawning and movement until user starts new game
          game.state = "idle";

          // Then, notify App.jsx to restore React gameState to "idle"
          // This shows the Play button and allows user to start a new game
          if (onResetComplete) {
            onResetComplete();
          }
        });
      };
    },
    [scrollContainerRef],
  );

  return {
    gameRef,
    entityManagerRef,
    chickenRef,
    isLoading,
    jumpChicken,
    getCurrentMultiplier,
    finishCurrentLane,
    updateDifficulty,
    resetGame,
    registerCollisionCallback,
  };
}
