# 🐔 Chicken Road Game - Complete Technical Documentation

**Project Hand-off Document for AI Engineer**

---

## 📋 Table of Contents

1. [Quick Reference Guide](#-quick-reference-guide)
2. [Game State Lifecycle](#1-game-state-lifecycle)
3. [User Actions Mapping](#2-user-actions-mapping)
4. [Collision & Win/Loss Mechanics](#3-collision--winloss-mechanics)
5. [Project Structure](#4-project-structure)
6. [Tech Stack Integration](#5-tech-stack-integration)
7. [Critical Implementation Details](#6-critical-implementation-details)
8. [Canvas & Animation Architecture](#7-canvas--animation-architecture)
9. [Responsiveness System - Vertical-Anchor Adaptive Viewport](#8-responsiveness-system---vertical-anchor-adaptive-viewport)
   - [Architecture Overview](#architecture-overview)
   - [System Components](#system-components)
   - [Vertical-Anchor Scaling Strategy](#vertical-anchor-scaling-strategy)
   - [Atomic Viewport Updates](#atomic-viewport-updates)
   - [Frame-Perfect Camera System](#frame-perfect-camera-system)
   - [Real-Time Resize Detection](#real-time-resize-detection)
   - [Call Chain Visualization](#call-chain-visualization)
   - [Device Support Matrix](#device-support-matrix)
   - [Performance Characteristics](#performance-characteristics)
   - [Testing and Verification](#testing-and-verification)
   - [Troubleshooting Guide](#troubleshooting-guide)
10. [Frontend Architecture Patterns](#9-frontend-architecture-patterns)
11. [Single-File Build Architecture](#10-single-file-build-architecture)

---

## 🚀 Quick Reference Guide

### Most Important Sections by Role

**For Game Logic Changes**:

- [Game State Lifecycle](#1-game-state-lifecycle) - Understand idle/playing/won/lost states
- [User Actions Mapping](#2-user-actions-mapping) - Button handlers and callbacks
- [Collision & Win/Loss Mechanics](#3-collision--winloss-mechanics) - AABB collision and win conditions

**For Rendering/Animation Work**:

- [Canvas & Animation Architecture](#7-canvas--animation-architecture) - PixiJS rendering pipeline
- [Jump Animation with Easing](#jump-animation-with-easing) - Interpolation and world movement
- [Spine Animation System](#spine-animation-system) - Skeletal animations

**For UI/Responsiveness Work**:

- [Responsiveness System - Vertical-Anchor Adaptive Viewport](#8-responsiveness-system---vertical-anchor-adaptive-viewport) - Complete viewport system
- [Vertical-Anchor Scaling Strategy](#vertical-anchor-scaling-strategy) - Height-only scaling formula
- [Frame-Perfect Camera System](#frame-perfect-camera-system) - Zero-lag camera tracking
- [Device Support Matrix](#device-support-matrix) - Universal device compatibility

**For Architecture Understanding**:

- [Frontend Architecture Patterns](#9-frontend-architecture-patterns) - Design patterns used
- [Tech Stack Integration](#5-tech-stack-integration) - React + PixiJS communication

**For Debugging**:

- [Critical Implementation Details](#6-critical-implementation-details) - Common gotchas and fixes
- [Critical Code Locations](#critical-code-locations) - Quick file/line reference

### Common Tasks Quick Links

| Task                    | Key Files                                                                                    | Key Functions                                           |
| ----------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Add new game state      | [App.jsx](src/App.jsx), [Game.js](src/game/core/Game.js)                                     | `handlePlay()`, `update()`                              |
| Modify jump behavior    | [Chicken.js](src/game/entities/Chicken.js), [useGame.js](src/hooks/useGame.js)               | `jumpTo()`, `jumpChicken()`                             |
| Adjust collision        | [CarSpawner.js](src/game/systems/CarSpawner.js)                                              | `checkCarChickenCollision()`                            |
| Change spawn timing     | [CarSpawner.js](src/game/systems/CarSpawner.js)                                              | `spawnCar()`, `update()`                                |
| Add new animation       | [Chicken.js](src/game/entities/Chicken.js)                                                   | `setSpine()`, Spine state calls                         |
| Adjust viewport scaling | [PixiRenderer.js](src/game/core/PixiRenderer.js)                                             | `updateViewport()`, `updateCamera()`                    |
| Change zoom multiplier  | [PixiRenderer.js](src/game/core/PixiRenderer.js#L46-L47)                                     | `BASE_LOGICAL_HEIGHT`, `ZOOM_MULTIPLIER` constants      |
| Fix camera tracking     | [PixiRenderer.js](src/game/core/PixiRenderer.js), [Game.js](src/game/core/Game.js#L227-L230) | `updateCamera()`, `setCameraTarget()`                   |
| Debug resize issues     | [useResponsiveCanvas.js](src/hooks/useResponsiveCanvas.js)                                   | `handleResize()`, ResizeObserver setup                  |
| Modify multipliers      | [CoinManager.js](src/game/managers/CoinManager.js)                                           | `getCurrentMultiplier()`                                |
| Add new entity          | [entities/](src/game/entities/)                                                              | Extend [BaseEntity.js](src/game/entities/BaseEntity.js) |

### Architecture at a Glance

```
React UI (App.jsx)
    ↕ useGame.js (Bridge)
PixiJS Game Engine (Game.js)
    ├── Managers (CoinManager, GateManager, EntityManager)
    ├── Systems (CarSpawner, InputSystem)
    └── Entities (Chicken, Car, Coin, Gate, Road, Scenery)
```

---

## 1. Game State Lifecycle

### State Machine Overview

The game uses **two parallel state systems**:

#### **React State (App.jsx)** - UI & Financial Logic

```javascript
gameState: "idle" | "playing" | "won" | "lost";
```

#### **PixiJS State (Game.js)** - Rendering & Game Systems

```javascript
game.state: "idle" | "playing" | "paused" | "gameover"
```

### State Transition Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      IDLE STATE                             │
│  React: gameState="idle"                                    │
│  PixiJS: game.state="idle"                                  │
│                                                             │
│  What's Active:                                             │
│  ✅ PixiJS ticker running (gameLoop active)                 │
│  ✅ EntityManager updating (entities rendered)              │
│  ✅ Chicken, Road, Scenery visible                          │
│  ❌ Car spawner disabled (no cars spawning)                 │
│  ❌ Collision detection disabled                            │
│  ❌ Coin/Gate systems disabled                              │
│                                                             │
│  User Action: Click "Play" button                          │
│                      ↓                                      │
└─────────────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    PLAYING STATE                            │
│  React: gameState="playing"                                 │
│  PixiJS: game.state="playing"                               │
│                                                             │
│  What's Active:                                             │
│  ✅ PixiJS ticker running                                   │
│  ✅ EntityManager updating                                  │
│  ✅ Car spawner spawning cars                               │
│  ✅ Collision detection active                              │
│  ✅ Coin/Gate systems active                                │
│  ✅ "Go" button enabled for jumps                           │
│  ✅ "Cashout" button enabled                                │
│                                                             │
│  Possible Actions:                                          │
│  • Click "Go" → jumpChicken() → continues playing          │
│  • Collision → Death sequence → Lost state                 │
│  • Reach finish → Win sequence → Won state                 │
│  • Click "Cashout" → Manual exit → Idle state              │
│                      ↓ (collision)                          │
└─────────────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                     LOST STATE                              │
│  React: gameState="lost"                                    │
│  PixiJS: game.state="gameover"                              │
│                                                             │
│  What's Active:                                             │
│  ✅ PixiJS ticker running                                   │
│  ✅ EntityManager updating (death animation visible)        │
│  ✅ Car spawner updating (cars maintain momentum)           │
│  ❌ Collision detection disabled (hasCollided=true)         │
│  ❌ Coin/Gate systems disabled                              │
│  ❌ All buttons disabled                                    │
│                                                             │
│  Death Sequence:                                            │
│  1. Collision detected → App.handleCollision() called       │
│  2. Set gameState="lost" (locks buttons)                    │
│  3. Call game.handleChickenDeath() (async)                  │
│     a. Set game.state="gameover"                            │
│     b. Play death animation (chicken.playDeath())           │
│     c. Wait for animation completion                        │
│     d. Add 1-second visual buffer                           │
│  4. Cleanup callback triggered                              │
│     → cleanupAfterDeath() → Reset to Idle                   │
│                                                             │
│  Duration: ~2-3 seconds (animation + buffer)                │
│                      ↓ (auto-reset)                         │
└─────────────────────────────────────────────────────────────┘
                       ↓
                   IDLE STATE
                   (back to top)

┌─────────────────────────────────────────────────────────────┐
│                      WON STATE                              │
│  React: gameState="won"                                     │
│  PixiJS: game.state="playing" (briefly during final jump)   │
│                                                             │
│  What's Active:                                             │
│  ✅ PixiJS ticker running                                   │
│  ✅ EntityManager updating (chicken visible at finish)      │
│  ❌ Car spawner disabled                                    │
│  ❌ Collision detection disabled                            │
│  ❌ Coin/Gate systems disabled                              │
│  ❌ All buttons disabled                                    │
│                                                             │
│  Win Sequence:                                              │
│  1. User clicks "Go" on finish line lane                    │
│  2. useGame detects isJumpingToFinish=true                  │
│  3. Instantly convert final coin to gold                    │
│     (coinManagerRef.current.finishCurrentLane())            │
│  4. Start jump animation with callback                      │
│     (chicken.jumpTo(..., onComplete: triggerWinSequence))   │
│  5. Chicken lands at finish → callback fires                │
│  6. triggerWinSequence() called:                            │
│     a. Calculate payout with multiplier                     │
│     b. Add winnings to balance (roundCurrency)              │
│     c. Set gameState="won" (shows victory display)          │
│  7. Wait 3 seconds (victory display visible)                │
│  8. Auto-reset to Idle state                                │
│                                                             │
│  Duration: 3 seconds (fixed victory display)                │
│                      ↓ (auto-reset)                         │
└─────────────────────────────────────────────────────────────┘
                       ↓
                   IDLE STATE
                   (back to top)
```

### Key State Rules

1. **PixiJS Ticker Always Runs**: The game loop is always active for rendering, even in "idle"
2. **Game Systems Conditional**: Car spawning, collision, coins only active during "playing"
3. **Button Locking**: Buttons disabled during "won" and "lost" to prevent double-actions
4. **Car Momentum**: Cars continue moving during "gameover" for natural death animation
5. **Auto-Reset**: Both "won" and "lost" states automatically return to "idle" after delays
6. **State Separation**: React manages UI/financial, PixiJS manages rendering/gameplay

---

## 2. User Actions Mapping

### Play Button

**Location**: [src/components/ControlPanel/index.jsx](src/components/ControlPanel/index.jsx)  
**Handler**: `App.handlePlay()` in [src/App.jsx](src/App.jsx#L41-L118)

#### First Click (Starting the Game)

```javascript
// User Clicks "Play" → Triggers:

1. Validation
   if (betAmount <= 0 || betAmount > balance) {
     alert("Invalid bet amount");
     return;
   }

2. Financial Transaction
   const newBalance = roundCurrency(balance - betAmount);
   setBalance(newBalance);  // Deduct bet from balance

3. Game Initialization
   gameRef.current.state = "playing";  // Enable game systems
   setGameState("playing");            // Enable Go/Cashout buttons

4. First Jump (Auto-start)
   gameContextValue.jumpChicken(
     onFinishCallback: null  // No callback for first jump
   );

5. Visual Feedback
   // "Play" button text changes to "Go"
   // "Cashout" button becomes enabled
```

**Internal Logic Flow**:

- Deducts bet from balance using `roundCurrency()` helper
- Starts PixiJS game systems (car spawner, collision, coins)
- Automatically jumps chicken to first lane (no click needed)
- Game state transitions: `idle` → `playing`

#### Subsequent Clicks (Jumping Forward)

```javascript
// User Clicks "Go" → Triggers:

1. Calculate if this is the final jump
   const currentLaneIndex = gameRef?.current?.coinManager?.currentLaneIndex;
   const totalLanes = gameRef?.current?.coinManager?.totalLanes;
   const isJumpingToFinish = (currentLaneIndex !== undefined &&
                               totalLanes !== undefined &&
                               currentLaneIndex === totalLanes - 1);

2. If final jump → Convert coin to gold BEFORE jump starts
   if (isJumpingToFinish) {
     coinManagerRef.current.finishCurrentLane();  // Instant gold conversion
   }

3. Execute jump with callback
   gameContextValue.jumpChicken(
     onFinishCallback: isJumpingToFinish
       ? () => triggerWinSequence()  // Auto-win on landing
       : null                        // No callback for mid-game jumps
   );
```

**Internal Logic Flow**:

- Checks if jump targets finish line
- Converts final coin to gold BEFORE animation starts
- Passes callback to chicken entity for automatic win trigger
- Chicken lands → callback fires → win sequence executes

---

### Cashout Button

**Location**: [src/components/ControlPanel/index.jsx](src/components/ControlPanel/index.jsx)  
**Handler**: `App.handleCashout()` in [src/App.jsx](src/App.jsx#L166-L194)

```javascript
// User Clicks "Cashout" → Triggers:

1. Calculate Current Multiplier
   const currentMultiplier = gameRef?.current?.coinManager?.getCurrentMultiplier?.() ?? 1;

2. Calculate Payout
   const winAmount = betAmount * currentMultiplier;
   const newBalance = roundCurrency(balance + winAmount);

3. Update Balance
   setBalance(newBalance);  // Add winnings

4. Visual Feedback (brief)
   setGameState("won");  // Show victory display for 100ms

5. Immediate Reset
   setTimeout(() => {
     cleanupAfterCashout();  // Reset to idle
   }, 100);  // Nearly instant transition
```

**Key Differences from Auto-Win**:

- **Manual Action**: User chooses when to exit
- **Multiplier-based**: Pays current position value (not final coin)
- **Instant Reset**: 100ms display vs. 3-second auto-win display
- **No Animation**: Immediate cleanup, no jump completion needed

---

### Collision (Automatic Event)

**Location**: [src/game/systems/CarSpawner.js](src/game/systems/CarSpawner.js#L540-L570)  
**Handler**: `App.handleCollision()` in [src/App.jsx](src/App.jsx#L127-L137)

```javascript
// Car Hits Chicken → Triggers:

1. Collision Detection (CarSpawner.checkCarChickenCollision)
   if (car.lane === chickenLaneIndex && AABB_collision) {
     car.hasCollided = true;        // Prevent multiple triggers
     this.hasCollided = true;       // Global flag for spawner
     if (this.onCollision) {
       this.onCollision();          // Call App.handleCollision()
     }
   }

2. App.handleCollision() Execution
   setGameState("lost");            // Lock all buttons
   gameRef.current.handleChickenDeath(
     onComplete: () => cleanupAfterDeath()
   );

3. Death Sequence (async in Game.js)
   a. Set game.state = "gameover"      (halt game systems)
   b. Find chicken entity
   c. chicken.playDeath(onComplete)    (trigger animation)
   d. Wait for animation completion
   e. setTimeout(1000ms)               (visual buffer)
   f. Call cleanupAfterDeath()

4. Cleanup (cleanupAfterDeath in App.jsx)
   stopGame();                      // Reset game state
   setGameState("idle");            // Return to idle
   // Balance unchanged (bet was already deducted)
```

**Critical Timing**:

- Button lock happens **immediately** (prevents double-actions)
- Death animation plays (~1 second)
- 1-second visual buffer
- Total sequence: ~2-3 seconds before reset

---

## 3. Collision & Win/Loss Mechanics

### Collision Detection (AABB)

**Axis-Aligned Bounding Box (AABB)** collision in **World Space** coordinates.

#### Critical Files

- Collision Detection: [src/game/systems/CarSpawner.js](src/game/systems/CarSpawner.js#L540-L570)
- Collision Handler: [src/App.jsx](src/App.jsx#L127-L137)

#### Collision Algorithm

```javascript
/**
 * AABB Collision Detection
 * Location: CarSpawner.checkCarChickenCollision()
 */

// REQUIREMENT 1: Same Lane Check
const chickenLaneX = this.chicken.x - this.startX;
const chickenLaneIndex = Math.floor(chickenLaneX / this.laneWidth);

if (car.lane !== chickenLaneIndex) {
  return; // No collision possible - different lanes
}

// REQUIREMENT 2: Get PixiJS World Space Bounds
const carWorldBounds = car.container.getBounds();
const chickenWorldBounds = this.chicken.container.getBounds();

// REQUIREMENT 3: Calculate Edge Positions
const carFrontY = carWorldBounds.y + carWorldBounds.height; // Bottom edge
const carBackY = carWorldBounds.y; // Top edge
const chickenTopY = chickenWorldBounds.y;
const chickenBottomY = chickenWorldBounds.y + chickenWorldBounds.height;

// REQUIREMENT 4: Gate Bypass Check
let carHasPassedGate = false;
if (car.gate) {
  const gateY = car.gate.y || 0;
  carHasPassedGate = carFrontY >= gateY; // Car passed gate = collision ACTIVE
}

// REQUIREMENT 5: AABB Overlap Test
if (!car.gate || carHasPassedGate) {
  if (carFrontY >= chickenTopY && carBackY <= chickenBottomY) {
    // COLLISION DETECTED
    car.hasCollided = true; // Prevent multiple triggers on this car
    this.hasCollided = true; // Global flag for spawner
    if (this.onCollision) {
      this.onCollision(); // Trigger App.handleCollision()
    }
  }
}
```

#### Collision Requirements

1. **Same Lane**: Car and chicken must be on same lane index
2. **World Space**: Use `container.getBounds()` for accurate PixiJS coordinates
3. **AABB Test**: Car's front edge ≥ chicken's top AND car's back edge ≤ chicken's bottom
4. **Gate Exclusion**: Cars behind gates don't collide (until passing gate)
5. **Single Trigger**: `hasCollided` flags prevent multiple collision events
6. **Passive**: Collision is trigger-only, no physics manipulation

#### Gate Mechanics

**Gate Purpose**: Safe zones that block car collisions

```javascript
// Car has a gate reference (assigned by CarSpawner)
car.gate = gateManager.getGateForLane(car.lane);

// Collision logic
if (car.gate && car.gate.isStopped) {
  // Gate is "closed" → Collision DISABLED
  // Car front edge < gate Y position
  if (carFrontY < gateY) {
    return; // No collision - car hasn't passed gate yet
  }
}

// If car passes gate (carFrontY >= gateY):
//   → Collision becomes ACTIVE
//   → Car can now hit chicken
```

**Gate Visual**: Red/Green graphics at lane positions  
**Gate State**: `isStopped=true` (collision disabled) or `isStopped=false` (collision enabled)

---

### Win Condition

**Trigger**: Chicken lands on finish line (final lane + 1)

#### Win Sequence Flow

```javascript
/**
 * Win Detection & Execution
 * Location: App.handlePlay() + useGame.jumpChicken()
 */

// 1. DETECTION (in App.handlePlay - before jump)
const currentLaneIndex = gameRef?.current?.coinManager?.currentLaneIndex;
const totalLanes = gameRef?.current?.coinManager?.totalLanes;
const isJumpingToFinish = currentLaneIndex === totalLanes - 1;

// 2. INSTANT COIN CONVERSION (before jump animation)
if (isJumpingToFinish) {
  coinManagerRef.current.finishCurrentLane(); // Turn final coin gold
}

// 3. JUMP WITH CALLBACK (useGame.jumpChicken)
chickenRef.current.jumpTo(targetX, targetY, () => {
  // THIS CALLBACK FIRES WHEN CHICKEN LANDS
  if (onFinishCallback) {
    onFinishCallback(); // Triggers triggerWinSequence()
  }
});

// 4. WIN SEQUENCE (App.triggerWinSequence)
const triggerWinSequence = useCallback(
  (multiplier) => {
    // Calculate payout
    const winAmount = betAmount * multiplier;
    const newBalance = roundCurrency(balance + winAmount);

    // Update balance
    setBalance(newBalance);

    // Show victory display
    setGameState("won");

    // Auto-reset after 3 seconds
    setTimeout(() => {
      cleanupAfterWin(); // Reset to idle
    }, 3000);
  },
  [balance, betAmount],
);
```

#### Win Requirements

1. **Position Check**: `currentLaneIndex === totalLanes - 1`
2. **Instant Coin**: Convert final coin to gold BEFORE jump starts
3. **Callback System**: Chicken entity calls onComplete when landing
4. **Automatic**: No user input required - triggers on landing
5. **3-Second Display**: Victory UI shown for fixed duration
6. **Auto-Reset**: Returns to idle state automatically

#### Financial Calculation

```javascript
// Using final coin multiplier
const currentMultiplier = gameRef.current.coinManager.getCurrentMultiplier();
// Returns value from the final (golden) coin

const winAmount = betAmount * currentMultiplier;
const newBalance = roundCurrency(balance + winAmount);
setBalance(newBalance);

// roundCurrency() ensures 2 decimal precision
function roundCurrency(amount) {
  return Math.round(amount * 100) / 100;
}
```

---

### Loss Condition

**Trigger**: Car collision with chicken

#### Loss Sequence Flow

```javascript
/**
 * Loss Detection & Execution
 * Location: CarSpawner.checkCarChickenCollision() + Game.handleChickenDeath()
 */

// 1. COLLISION DETECTION (in CarSpawner)
if (AABB_collision) {
  car.hasCollided = true;
  this.hasCollided = true;
  if (this.onCollision) {
    this.onCollision();  // Calls App.handleCollision()
  }
}

// 2. HANDLE COLLISION (App.handleCollision)
const handleCollision = useCallback(() => {
  setGameState("lost");  // Lock buttons immediately

  if (gameRef.current) {
    gameRef.current.handleChickenDeath(() => {
      cleanupAfterDeath();  // Cleanup callback
    });
  }
}, []);

// 3. DEATH SEQUENCE (Game.handleChickenDeath - async)
async handleChickenDeath(onComplete) {
  // Set game state to halt systems
  this.state = "gameover";

  // Find chicken entity
  const chicken = this.entityManager.entities.find(e =>
    e.playDeath && typeof e.playDeath === "function"
  );

  // Play death animation
  await new Promise(resolve => {
    chicken.playDeath(() => resolve());
  });

  // Visual buffer
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Trigger cleanup
  if (onComplete) onComplete();
}

// 4. CLEANUP (App.cleanupAfterDeath)
const cleanupAfterDeath = useCallback(() => {
  stopGame();           // Reset game state
  setGameState("idle"); // Return to idle
  // Balance unchanged (bet already lost)
}, [stopGame]);
```

#### Loss Requirements

1. **Immediate Lock**: `setGameState("lost")` disables all buttons instantly
2. **Animation Sequence**: Death animation plays (~1 second)
3. **Visual Buffer**: 1-second delay after animation
4. **Car Momentum**: Cars continue moving during sequence
5. **Balance Unchanged**: Bet was deducted at Play, no further change
6. **Auto-Reset**: Returns to idle after ~2-3 seconds

---

## 4. Project Structure

### High-Level Architecture

```
chicken-road-game/
├── public/                    # Static assets
│   └── assets/
│       ├── chicken.atlas      # Spine animation texture atlas
│       └── chicken.json       # Spine animation data
│
├── src/
│   ├── App.jsx                # 🎯 ROOT COMPONENT - State Machine Orchestrator
│   │                          # React state management, financial calculations
│   │                          # Button handlers, win/loss sequences
│   │
│   ├── main.jsx               # React entry point
│   │
│   ├── components/            # React UI Components
│   │   ├── ControlPanel/      # Play/Go/Cashout buttons, bet input
│   │   ├── GameArea/          # PixiJS canvas container
│   │   ├── Header/            # Title, balance display
│   │   ├── AnimatedChicken/   # CSS chicken animation (menu)
│   │   └── DollarIcon/        # Currency icon component
│   │
│   ├── hooks/
│   │   ├── useGame.js         # 🎯 PIXI LIFECYCLE MANAGER
│   │   │                      # Creates Game instance, loads assets
│   │   │                      # Manages entities, handles jumps
│   │   └── useResponsiveCanvas.js
│   │
│   ├── game/                  # 🎮 CORE GAME ENGINE (PixiJS)
│   │   │
│   │   ├── core/
│   │   │   ├── Game.js        # 🎯 GAME ORCHESTRATOR
│   │   │   │                  # Main game loop, system coordination
│   │   │   │                  # State management (idle/playing/gameover)
│   │   │   └── PixiRenderer.js # PixiJS application wrapper
│   │   │                       # Canvas initialization, texture loading
│   │   │
│   │   ├── entities/          # Game Objects
│   │   │   ├── BaseEntity.js  # Abstract base class
│   │   │   ├── Chicken.js     # 🐔 Player character with Spine animation
│   │   │   │                  # Jump mechanics, death animation, callbacks
│   │   │   ├── Car.js         # 🚗 Obstacles with movement and collision
│   │   │   ├── Coin.js        # 💰 Multiplier indicators (silver/gold)
│   │   │   ├── Gate.js        # 🚧 Safe zone barriers
│   │   │   ├── Road.js        # 🛣️ Road background graphics
│   │   │   └── Scenery.js     # 🌳 Finish line visual
│   │   │
│   │   ├── managers/          # System Managers
│   │   │   ├── EntityManager.js # Entity lifecycle management
│   │   │   ├── CoinManager.js   # 🎯 COIN SYSTEM
│   │   │   │                    # Coin visibility, gold conversion
│   │   │   │                    # Multiplier calculations
│   │   │   └── GateManager.js   # Gate placement and collision exclusion
│   │   │
│   │   └── systems/           # Game Systems
│   │       ├── CarSpawner.js  # 🎯 SPAWNING & COLLISION
│   │       │                  # Object pooling (30 cars)
│   │       │                  # AABB collision detection
│   │       │                  # Lane management, spawn timing
│   │       └── InputSystem.js # Keyboard/touch input handling
│   │
│   ├── config/
│   │   └── gameConfig.js      # Game configuration (lanes, speeds, etc.)
│   │
│   └── constants/
│       └── gameConstants.js   # Global constants (canvas size, colors)
│
├── package.json               # Dependencies: react, pixi.js, @pixi/spine
├── vite.config.js             # Build configuration
└── index.html                 # App entry point
```

---

### Key File Responsibilities

#### **1. App.jsx** (225 lines)

**Role**: React State Machine Orchestrator

**Responsibilities**:

- Manage game state: `idle` | `playing` | `won` | `lost`
- Handle financial calculations (balance, bet, winnings)
- Orchestrate button actions (Play, Go, Cashout)
- Trigger win/loss sequences
- Connect React UI to PixiJS game

**Key Functions**:

- `handlePlay()`: Start game, deduct bet, jump chicken
- `handleCollision()`: Lock UI, trigger death sequence
- `handleCashout()`: Calculate payout, reset game
- `triggerWinSequence()`: Add winnings, show victory, auto-reset
- `roundCurrency()`: Prevent floating-point errors

**Dependencies**: useGame hook, UI components

---

#### **2. src/hooks/useGame.js** (695 lines)

**Role**: PixiJS Lifecycle Manager

**Responsibilities**:

- Create Game instance with PixiJS renderer
- Load textures and Spine animations
- Initialize entities (Chicken, Road, Scenery, Coins, Gates)
- Manage lane position tracking
- Handle chicken jumps with callbacks
- Provide game context to React components

**Key Functions**:

- `useEffect (initialization)`: Setup game, load assets
- `jumpChicken()`: Detect final jump, convert coin, pass callback
- `stopGame()`: Reset game state for cleanup
- `resize()`: Handle canvas resize events

**Critical Logic**:

```javascript
// Detect final jump and convert coin BEFORE animation
if (isJumpingToFinish) {
  coinManagerRef.current.finishCurrentLane(); // Instant gold
}

// Pass callback for automatic win
chickenRef.current.jumpTo(targetX, targetY, () => {
  if (onFinishCallback) onFinishCallback();
});
```

---

#### **3. src/game/core/Game.js** (362 lines)

**Role**: Game Orchestrator

**Responsibilities**:

- Manage PixiJS game loop (ticker)
- Coordinate systems: CarSpawner, CoinManager, GateManager
- Handle game state transitions
- Execute death sequence with timing

**Key Functions**:

- `start()`: Initialize game loop in idle state
- `gameLoop()`: Update and render every frame
- `update()`: Conditionally update systems based on state
- `handleChickenDeath()`: Async death sequence (animation + buffer)

**Critical State Logic**:

```javascript
// Entities ALWAYS update (for rendering)
this.entityManager.update(deltaTime);

// Car spawner updates during playing AND gameover (momentum)
if (this.state === "playing" || this.state === "gameover") {
  this.carSpawner.update(deltaTime);
}

// Coins/gates only during playing
if (this.state === "playing") {
  this.coinManager.update(deltaTime);
  this.gateManager.update(deltaTime);
}
```

---

#### **4. src/game/systems/CarSpawner.js** (654 lines)

**Role**: Spawning & Collision System

**Responsibilities**:

- Manage object pool of 30 cars
- Spawn cars with dynamic timing (0.3s - 1.2s)
- Move cars vertically down screen
- Detect AABB collision with chicken
- Handle lane cooldowns and safe zones

**Key Functions**:

- `spawnCar()`: Select lane, acquire car from pool
- `update()`: Move active cars, check collision, cleanup
- `checkCarChickenCollision()`: AABB test with gate exclusion
- `getValidSpawnLanes()`: Exclude chicken's lane and behind

**Critical Collision Logic**:

```javascript
// AABB in World Space
const carWorldBounds = car.container.getBounds();
const chickenWorldBounds = this.chicken.container.getBounds();

// Gate bypass check
const carHasPassedGate = car.gate ? carFrontY >= car.gate.y : true;

// Collision test
if (
  carHasPassedGate &&
  carFrontY >= chickenTopY &&
  carBackY <= chickenBottomY
) {
  car.hasCollided = true;
  this.hasCollided = true;
  this.onCollision(); // Trigger App.handleCollision()
}
```

---

#### **5. src/game/entities/Chicken.js** (364 lines)

**Role**: Player Character

**Responsibilities**:

- Render Spine animation
- Handle jump mechanics with callbacks
- Play death animation
- Manage world position updates

**Key Functions**:

- `jumpTo(x, y, onComplete)`: Animate jump, trigger callback on landing
- `playDeath(onComplete)`: Play death animation
- `update()`: Update jump progress, trigger callback at completion

**Critical Callback System**:

```javascript
jumpTo(targetX, targetY, onComplete) {
  this.targetX = targetX;
  this.targetY = targetY;
  this.onJumpComplete = onComplete;  // Store callback
  this.isJumping = true;
  this.jumpProgress = 0;
}

update(deltaTime) {
  if (this.isJumping) {
    this.jumpProgress += deltaTime * this.jumpSpeed;

    if (this.jumpProgress >= 1) {
      this.jumpProgress = 1;
      this.isJumping = false;

      // Trigger callback
      if (this.onJumpComplete) {
        const callback = this.onJumpComplete;
        this.onJumpComplete = null;  // Clear after use
        callback();  // Execute (triggers win if final jump)
      }
    }
  }
}
```

---

#### **6. src/game/managers/CoinManager.js** (353 lines)

**Role**: Coin System & Multiplier Logic

**Responsibilities**:

- Manage coin visibility (silver → gold)
- Calculate current multiplier for payout
- Handle finish line edge case

**Key Functions**:

- `finishCurrentLane()`: Convert current coin to gold
- `getCurrentMultiplier()`: Get payout multiplier
- `reset()`: Reset all coins to silver

**Critical Finish Line Logic**:

```javascript
finishCurrentLane() {
  let laneToFinish = this.currentLaneIndex;

  // EDGE CASE: At finish line, currentLaneIndex = -1
  // Use highestPassedLane + 1 to get final coin
  if (laneToFinish === -1) {
    laneToFinish = this.highestPassedLane + 1;
    // Fallback: use last coin if calculation fails
    if (laneToFinish >= this.coins.length) {
      laneToFinish = this.coins.length - 1;
    }
  }

  // Convert coin to gold
  const coin = this.coins[laneToFinish];
  if (coin) {
    coin.turnGold();
    this.updateCoinVisibility();
  }
}
```

---

## 5. Tech Stack Integration

> **Note**: For detailed architecture patterns, see [Section 9: Frontend Architecture Patterns](#9-frontend-architecture-patterns)

### Overview

The game uses a **hybrid React + PixiJS architecture**:

- **React**: UI components, state management, financial calculations
- **PixiJS v8**: WebGL-accelerated game rendering, entity management, game loop
- **Bridge**: `useGame.js` hook connects React state to PixiJS instances

For comprehensive architecture diagrams and communication patterns, see [Section 9](#9-frontend-architecture-patterns).

---

### Dependencies

**package.json**:

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "pixi.js": "^8.0.0",
    "@pixi/spine": "^4.0.4"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

**Key Libraries**:

- **React 18**: Hooks-based UI (useState, useCallback, useRef, useEffect)
- **PixiJS v8**: WebGL renderer, sprite system, ticker (NEW API: `setStrokeStyle`, `rect().stroke()`)
- **@pixi/spine**: Spine animation runtime for chicken animations
- **Vite**: Build tool (fast HMR, ES modules)

---

## 6. Critical Implementation Details

### 🔴 GOTCHA #1: Coordinate Space (World Space vs. Screen Space)

**Problem**: Collision detection fails if using screen coordinates

**Solution**: Always use PixiJS `getBounds()` for World Space coordinates

```javascript
// ❌ WRONG - Screen Space (doesn't account for scrolling)
const carY = car.y;
const chickenY = chicken.y;

// ✅ CORRECT - World Space (accurate with scrolling)
const carWorldBounds = car.container.getBounds();
const chickenWorldBounds = this.chicken.container.getBounds();

const carFrontY = carWorldBounds.y + carWorldBounds.height;
const chickenTopY = chickenWorldBounds.y;
```

**Why**: PixiJS containers can be nested, scrolled, and transformed. `getBounds()` returns absolute world coordinates accounting for all transforms.

---

### 🔴 GOTCHA #2: Floating-Point Precision (Currency)

**Problem**: JavaScript floating-point math causes errors like `1.1 + 2.2 = 3.3000000000000003`

**Solution**: Use `roundCurrency()` for ALL financial calculations

```javascript
// ❌ WRONG - Floating-point errors
const newBalance = balance + winAmount;
// Result: 100.1 + 5.7 = 105.80000000000001

// ✅ CORRECT - Rounded to 2 decimals
function roundCurrency(amount) {
  return Math.round(amount * 100) / 100;
}

const newBalance = roundCurrency(balance + winAmount);
// Result: 105.80
```

**Apply to**:

- Balance updates: `setBalance(roundCurrency(newValue))`
- Bet deductions: `roundCurrency(balance - betAmount)`
- Win calculations: `roundCurrency(balance + winAmount)`

---

### 🔴 GOTCHA #3: PixiJS v8 API Changes (Deprecated Methods)

**Problem**: Old tutorials use deprecated v7 API causing errors

**Breaking Changes**:

```javascript
// ❌ DEPRECATED (v7) - throws errors in v8
graphics.lineStyle(2, 0xff0000);
graphics.drawRect(x, y, width, height);

// ✅ CORRECT (v8) - new API
graphics.setStrokeStyle({ width: 2, color: 0xff0000 });
graphics.rect(x, y, width, height);
graphics.stroke();

// ---

// ❌ DEPRECATED (v7)
sprite.anchor.set(0.5, 0.5);

// ✅ CORRECT (v8) - still works, but use:
sprite.anchor = { x: 0.5, y: 0.5 };
```

**Resources**: [PixiJS v8 Migration Guide](https://github.com/pixijs/pixijs/wiki/v8-Migration-Guide)

---

### 🔴 GOTCHA #4: Safe Zone Logic (Dynamic Spawn Exclusion)

**Problem**: Cars spawn on chicken's lane or behind chicken

**Solution**: Dynamic lane filtering based on chicken position

```javascript
// In CarSpawner.getValidSpawnLanes()

const chickenLaneX = this.chicken.x - this.startX;
this.chickenLaneIndex = Math.floor(chickenLaneX / this.laneWidth);

const validLanes = [];

for (let i = 0; i < this.lanes.length; i++) {
  // REQUIREMENT: Only spawn AHEAD of chicken (i > chickenLaneIndex)
  if (i > this.chickenLaneIndex) {
    validLanes.push(i);
  }
}

// Result: Cars never spawn on current lane or behind
```

**Why**: Prevents unfair spawns where chicken jumps into immediate collision

---

### 🔴 GOTCHA #5: Multiple Collision Triggers (hasCollided Flag)

**Problem**: Single collision triggers multiple death sequences

**Solution**: Use `hasCollided` flags to prevent duplicate triggers

```javascript
// In CarSpawner.checkCarChickenCollision()

if (AABB_collision) {
  // CRITICAL: Set flags BEFORE calling callback
  car.hasCollided = true; // Prevent this car from re-triggering
  this.hasCollided = true; // Global flag stops ALL collision checks

  if (this.onCollision) {
    this.onCollision(); // Safe to call once
  }
}

// ---

// In CarSpawner.update()
if (!this.hasCollided) {
  // Only check if no collision yet
  this.checkCarChickenCollision(car);
}
```

**Why**: Collision detection runs every frame. Without flags, multiple cars trigger death sequence simultaneously.

---

### 🔴 GOTCHA #6: State Desynchronization (React vs PixiJS)

**Problem**: React `gameState` and PixiJS `game.state` get out of sync

**Solution**: Update BOTH states together, understand their purposes

```javascript
// React State (UI lock)
setGameState("lost"); // Disables buttons

// PixiJS State (systems control)
gameRef.current.state = "gameover"; // Halts car spawning

// ALWAYS update both in handlers
```

**State Mapping**:
| React `gameState` | PixiJS `game.state` | Purpose |
|-------------------|---------------------|---------|
| `idle` | `idle` | No gameplay, buttons ready |
| `playing` | `playing` | Active gameplay, all systems on |
| `won` | `playing` (briefly) | UI locked, animation finishing |
| `lost` | `gameover` | UI locked, death animation playing |

---

### 🔴 GOTCHA #7: Car Momentum During Death

**Problem**: Cars stop immediately on collision, unnatural visuals

**Solution**: Continue car updates during `gameover` state

```javascript
// In Game.update()

// ALWAYS update entities (rendering)
this.entityManager.update(deltaTime);

// Car spawner updates during BOTH playing AND gameover
if (this.state === "playing" || this.state === "gameover") {
  this.carSpawner.update(deltaTime); // Cars keep moving during death
}

// Collision checking disabled by hasCollided flag
// But car movement continues naturally
```

**Why**: Creates realistic death animation where cars maintain momentum

---

### 🔴 GOTCHA #8: Final Coin Edge Case (Finish Line)

**Problem**: At finish line, `currentLaneIndex = -1`, no coin converts to gold

**Solution**: Special handling in `finishCurrentLane()`

```javascript
// In CoinManager.finishCurrentLane()

let laneToFinish = this.currentLaneIndex;

// EDGE CASE: Chicken is at finish (off road), currentLaneIndex = -1
if (laneToFinish === -1) {
  // Use highest passed lane + 1
  laneToFinish = this.highestPassedLane + 1;

  // Safety: If out of bounds, use last coin
  if (laneToFinish >= this.coins.length) {
    laneToFinish = this.coins.length - 1;
  }
}

const coin = this.coins[laneToFinish];
if (coin) {
  coin.turnGold();
}
```

**Why**: Finish line is "off road" (no lane), requires fallback logic

---

### 🔴 GOTCHA #9: Button State During Transitions

**Problem**: Users can spam buttons during win/loss sequences

**Solution**: Disable buttons using `gameState`

```javascript
// In ControlPanel component

const isPlaying = gameState === "playing";
const canPlay = gameState === "idle";
const isWonOrLost = gameState === "won" || gameState === "lost";

<button
  disabled={!canPlay && !isPlaying}  // Disabled if won/lost
  onClick={handlePlay}
>
  {isPlaying ? "Go" : "Play"}
</button>

<button
  disabled={!isPlaying}              // Only enabled when playing
  onClick={handleCashout}
>
  Cashout
</button>
```

**Why**: Prevents double-actions during async sequences (death, win display)

---

### 🔴 GOTCHA #10: Object Pooling Lifecycle (Car Container Issues)

**Problem**: Cars disappear or duplicate due to improper pool management

**Solution**: Proper acquire/release with stage management

```javascript
// ACQUIRE (from pool)
const car = this.carPool.pop() || new Car();
car.reset(x, y, config);
this.activeCars.push(car);

// CRITICAL: Manually add to stage
this.entityManager.stage.addChild(car.container);

// ---

// RELEASE (back to pool)
car.release(); // Hide but don't destroy

// CRITICAL: Remove from stage
this.entityManager.stage.removeChild(car.container);

// Add back to pool
this.carPool.push(car);
```

**Why**: PixiJS containers must be manually managed. EntityManager doesn't handle pooled objects automatically.

---

## 📚 Additional Resources

### Debugging Tools

```javascript
// Access game instance from browser console
const game = window.__GAME_INSTANCE__;

// Force state changes (testing)
game.state = "playing";
game.carSpawner.hasCollided = false;
```

### Performance Monitoring

```javascript
// In Game.gameLoop()
const startTime = performance.now();
this.update(deltaTime);
const updateTime = performance.now() - startTime;

if (updateTime > 16) {
  // > 16ms = < 60 FPS
  console.warn(`Slow frame: ${updateTime.toFixed(2)}ms`);
}
```

### Common Issues & Fixes

| Issue                    | Cause                      | Fix                                                   |
| ------------------------ | -------------------------- | ----------------------------------------------------- |
| Cars not spawning        | `game.state !== "playing"` | Check state in `Game.update()`                        |
| Collision not detecting  | Screen space coordinates   | Use `container.getBounds()`                           |
| Balance precision errors | Floating-point math        | Use `roundCurrency()` everywhere                      |
| Multiple death triggers  | No collision flag          | Set `hasCollided = true`                              |
| Buttons stay disabled    | State not resetting        | Call `setGameState("idle")` in cleanup                |
| Final coin stays silver  | Edge case at finish        | Check `finishCurrentLane()` logic                     |
| Cars stop on collision   | Update logic issue         | Verify `game.state === "gameover"` still updates cars |

---

## 7. Canvas & Animation Architecture

### PixiJS Rendering Pipeline

The game uses **PixiJS v8** with WebGL hardware acceleration for high-performance 2D rendering.

#### Initialization & Configuration

**Location**: [src/game/core/PixiRenderer.js](src/game/core/PixiRenderer.js)

```javascript
/**
 * PixiJS Application Setup
 * - WebGL renderer with hardware acceleration
 * - Device pixel ratio for high-DPI displays
 * - Auto-density for crisp rendering
 */

async init(canvas, config = {}) {
  this.app = new Application();

  await this.app.init({
    canvas: canvas,                              // Mount to existing canvas
    background: '#2a2a2a',                       // Gray background
    antialias: true,                             // Smooth edges
    resolution: window.devicePixelRatio || 1,   // Retina support
    autoDensity: true,                           // Auto-scale for DPI
    ...config,
  });

  // Access core components
  this.renderer = this.app.renderer;
  this.stage = this.app.stage;
  this.ticker = this.app.ticker;

  // CRITICAL: Disable stage culling
  // Without this, cars disappear when moving off-screen
  this.stage.cullable = false;

  // Create UI layer for notifications (doesn't scroll with world)
  this.uiLayer = new Container();
  this.uiLayer.zIndex = 10000;  // Always on top
  this.stage.addChild(this.uiLayer);
}
```

**Key Configuration Choices**:

1. **`antialias: true`** - Smooth sprite edges (slight performance cost)
2. **`resolution: devicePixelRatio`** - Crisp rendering on Retina displays
3. **`autoDensity: true`** - Automatically scales canvas for DPI
4. **`cullable: false`** - Prevent entities from disappearing off-screen
5. **UI Layer (`zIndex: 10000`)** - Notifications stay fixed during world scrolling

---

### Texture Loading System

**Location**: [src/game/core/PixiRenderer.js](src/game/core/PixiRenderer.js)

```javascript
/**
 * Lazy texture loading with caching
 * - Loads textures from public/assets
 * - Caches in internal Map for reuse
 * - Returns PixiJS Texture instances
 */

async loadTexture(url) {
  // Check cache first
  if (this.textures.has(url)) {
    return this.textures.get(url);
  }

  // Load from file
  const texture = await Assets.load(url);
  this.textures.set(url, texture);  // Cache for next use
  return texture;
}

// Usage in Game initialization
const carGreenTexture = await this.renderer.loadTexture("./assets/car_green.png");
const carRedTexture = await this.renderer.loadTexture("./assets/car_red.png");
```

**Texture Cache Benefits**:

- **Performance**: Load once, reuse many times
- **Memory**: Shared GPU memory for duplicate textures
- **Async**: Doesn't block rendering thread

---

### Spine Animation System

The chicken character uses **Spine skeletal animation** for smooth, professional animations.

#### Spine Runtime Integration

**Dependencies**:

```json
{
  "@pixi/spine": "^4.0.4" // Spine runtime for PixiJS
}
```

**Asset Files** (public/):

- `chicken.json` - Skeleton data (bones, slots, animations)
- `chicken.atlas` - Texture atlas (sprite sheet mapping)

#### Loading Spine Assets

**Location**: [src/game/core/PixiRenderer.js](src/game/core/PixiRenderer.js)

```javascript
/**
 * Load Spine animation data
 * Returns: { skeleton, atlas } resource keys
 */

async loadSpineAnimation(name, skeletonUrl, atlasUrl) {
  const skeletonKey = `${name}_skeleton`;
  const atlasKey = `${name}_atlas`;

  // Load spine files
  await Assets.load({
    alias: skeletonKey,
    src: skeletonUrl,
  });

  await Assets.load({
    alias: atlasKey,
    src: atlasUrl,
  });

  return { skeleton: skeletonKey, atlas: atlasKey };
}
```

#### Creating Spine Instances

```javascript
/**
 * Create a Spine entity from loaded assets
 * Returns: Spine instance with animation controller
 */

createSpine(resourceKeys) {
  const { skeleton } = resourceKeys;
  const spine = new Spine(Assets.get(skeleton));

  // Initial state
  spine.autoUpdate = true;     // Auto-advance animations
  spine.state.timeScale = 1;   // Normal speed

  return spine;
}

// Usage in Chicken.js
const chickenKeys = await game.renderer.loadSpineAnimation(
  "chicken",
  "./chicken.json",
  "./chicken.atlas"
);

const chickenSpine = game.renderer.createSpine(chickenKeys);
chicken.setSpine(chickenSpine);
```

#### Animation State Machine

**Location**: [src/game/entities/Chicken.js](src/game/entities/Chicken.js)

```javascript
/**
 * Spine Animation Controller
 * - Play animations by name
 * - Queue animations for chaining
 * - Control looping behavior
 */

// Idle animation (loops)
this.spine.state.setAnimation(0, "idle", true);

// Jump animation (one-shot, then queue idle)
this.spine.state.setAnimation(0, "jump", false); // Play jump
this.spine.state.addAnimation(0, "idle", true, 0); // Queue idle after

// Death animation (one-shot with callback)
this.spine.state.setAnimation(0, "death", false);
this.spine.state.addListener({
  complete: (entry) => {
    if (entry.animation.name === "death" && this.onDeathComplete) {
      this.onDeathComplete(); // Trigger cleanup
    }
  },
});
```

**Animation Types**:

1. **"idle"** - Looping idle animation (breathing, blinking)
2. **"jump"** - One-shot jump animation (forwards movement)
3. **"death"** - One-shot death animation (hit by car)

**Animation Chaining**:

- `setAnimation()` - Immediately plays animation
- `addAnimation()` - Queues animation to play after current
- `complete` listener - Callback when animation finishes

---

### Game Loop Architecture

The game loop runs at **60 FPS** using PixiJS Ticker.

#### Ticker System

**Location**: [src/game/core/Game.js](src/game/core/Game.js)

```javascript
/**
 * PixiJS Ticker Loop
 * - Runs every frame (target: 60 FPS)
 * - Provides deltaTime for frame-rate independence
 * - Updates all systems and entities
 */

start() {
  if (this.gameLoopStarted) return;
  this.gameLoopStarted = true;

  // Start ticker
  this.renderer.app.ticker.add(this.gameLoop, this);

  // Initial state
  this.state = "idle";
}

gameLoop = (ticker) => {
  // Normalize deltaTime to 60 FPS baseline
  // ticker.deltaTime = 1 at 60 FPS
  // ticker.deltaTime = 2 at 30 FPS
  const deltaTime = ticker.deltaTime / 60;

  this.update(deltaTime);
};
```

**Delta Time Normalization**:

- **60 FPS**: `deltaTime = 1` (normal speed)
- **30 FPS**: `deltaTime = 2` (double step to maintain speed)
- **120 FPS**: `deltaTime = 0.5` (half step to maintain speed)

#### Update Hierarchy

```javascript
/**
 * Game Update Loop
 * - ALWAYS updates entities (rendering)
 * - Conditionally updates systems (gameplay)
 */

update(deltaTime) {
  // 1. ENTITIES - Always update for rendering
  this.entityManager.update(deltaTime);

  // 2. CAR SPAWNER - Update during playing OR gameover
  // Cars maintain momentum during death animation
  if (this.state === "playing" || this.state === "gameover") {
    this.carSpawner.update(deltaTime);
  }

  // 3. COIN/GATE SYSTEMS - Only during active gameplay
  if (this.state === "playing") {
    this.coinManager.update(deltaTime);
    this.gateManager.update(deltaTime);
  }
}
```

**Update Priority**:

1. **EntityManager** (ALWAYS)
   - Updates all entity positions
   - Updates Spine animations
   - Renders visual changes

2. **CarSpawner** (PLAYING + GAMEOVER)
   - Spawns new cars
   - Moves active cars
   - Checks collisions (disabled if hasCollided=true)
   - Cars continue during death for natural animation

3. **CoinManager** (PLAYING ONLY)
   - Updates coin visibility
   - Animates coin effects
   - Tracks current multiplier

4. **GateManager** (PLAYING ONLY)
   - Updates gate positions
   - Manages gate collision zones

---

### Jump Animation with Easing

The chicken's jump uses **ease-in-out interpolation** for natural movement.

#### Jump Mechanics

**Location**: [src/game/entities/Chicken.js](src/game/entities/Chicken.js)

```javascript
/**
 * Jump System with Callback
 * - Smooth easing interpolation
 * - World space movement
 * - Automatic completion callback
 */

jumpTo(targetX, shouldMoveWorld, worldAnimationData, onComplete) {
  // Store jump parameters
  this.isJumping = true;
  this.jumpProgress = 0;
  this.jumpStartX = this.x;
  this.jumpEndX = targetX;
  this.onJumpComplete = onComplete;  // Store callback
  this.hasLanded = false;

  // World scrolling setup
  this.shouldMoveWorld = shouldMoveWorld;
  this.worldAnimationData = worldAnimationData;

  // Play jump animation
  this.spine.state.setAnimation(0, "jump", false);
  this.spine.state.addAnimation(0, "idle", true, 0);
}
```

#### Easing Function

```javascript
/**
 * Ease-in-out Quadratic
 * - Smooth acceleration at start
 * - Smooth deceleration at end
 * - Natural "jump arc" feel
 */

easeInOutQuad(t) {
  // t = 0.0 → 1.0 (linear progress)

  if (t < 0.5) {
    // First half: ease-in (accelerate)
    return 2 * t * t;
  } else {
    // Second half: ease-out (decelerate)
    return 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
}
```

**Easing Curve**:

```
Progress (linear):    0.0  0.1  0.2  0.3  0.4  0.5  0.6  0.7  0.8  0.9  1.0
Easing (quadratic):   0.0  0.02 0.08 0.18 0.32 0.5  0.68 0.82 0.92 0.98 1.0
                      slow--------→ fast ←--------slow
```

#### Update Loop for Jump

```javascript
/**
 * Update jump every frame
 * - Increment progress based on deltaTime
 * - Apply easing to position
 * - Trigger callback on completion
 */

update(deltaTime) {
  if (this.isJumping) {
    // Increment progress (normalized to 60 FPS)
    this.jumpProgress += deltaTime * 2.5;  // Jump speed: 2.5 = ~0.4 seconds

    // Clamp to 0-1 range
    if (this.jumpProgress > 1) {
      this.jumpProgress = 1;
    }

    // Apply easing function
    const easeProgress = this.easeInOutQuad(this.jumpProgress);

    // Interpolate position
    const dx = this.jumpEndX - this.jumpStartX;
    this.x = this.jumpStartX + dx * easeProgress;

    // Handle world scrolling (if enabled)
    if (this.shouldMoveWorld && this.worldAnimationData) {
      const worldDx = this.worldAnimationData.endOffset - this.worldAnimationData.startOffset;
      const worldX = this.worldAnimationData.startOffset + worldDx * easeProgress;
      this.stage.x = -worldX;  // Move world (negative for camera follow)
    }

    // Check for completion
    if (this.jumpProgress >= 1 && !this.hasLanded) {
      this.hasLanded = true;
      this.isJumping = false;

      // Trigger callback (win sequence if final jump)
      if (this.onJumpComplete) {
        const callback = this.onJumpComplete;
        this.onJumpComplete = null;  // Clear after use
        callback();
      }
    }
  }
}
```

**Jump Timing**:

- **Jump Speed**: `2.5` - Takes ~0.4 seconds at 60 FPS
- **Easing**: Smooth acceleration/deceleration
- **Callback**: Fires exactly when landing (progress = 1.0)

---

### World Movement System

After lane 3, the **world moves instead of the chicken** for better visual balance.

#### Coordinate Systems

```
LANES 0-2: Chicken moves, world static
┌────────────────────────────────────────┐
│  🐔 (moves right →)                    │
│  🌳┃▓▓▓▓┃▓▓▓▓┃▓▓▓▓┃ (static)           │
└────────────────────────────────────────┘

LANE 3+: World moves, chicken fixed at 40% viewport
┌────────────────────────────────────────┐
│        🐔 (fixed at 40%)               │
│  ← (world scrolls left)                │
│  ┃▓▓▓▓┃▓▓▓▓┃▓▓▓▓┃▓▓▓▓┃🌲                │
└────────────────────────────────────────┘
```

#### World Offset Calculation

**Location**: [src/hooks/useGame.js](src/hooks/useGame.js)

```javascript
/**
 * Determine when to move world vs chicken
 * - Lanes 0-2: Chicken moves (simple translation)
 * - Lane 3+: World moves, chicken stays at 40% viewport
 */

const shouldMoveWorld = nextLane >= 3; // Threshold lane

if (shouldMoveWorld) {
  // Calculate target world position
  const viewportWidth = game.renderer.app.screen.width;
  const chickenScreenX = viewportWidth * 0.4; // 40% from left
  const targetWorldOffset = targetX - chickenScreenX;

  // Clamp offset to prevent showing black space
  const maxWorldOffset = totalWidth - viewportWidth;
  const clampedOffset = Math.max(
    0,
    Math.min(targetWorldOffset, maxWorldOffset),
  );

  worldAnimationData = {
    startOffset: currentWorldOffset, // Current stage.x
    endOffset: clampedOffset, // Target stage.x
  };
}

// Pass to chicken entity
chicken.jumpTo(targetX, shouldMoveWorld, worldAnimationData, onFinishCallback);
```

#### World Clamping

```javascript
/**
 * Prevent showing empty space
 * - Min offset: 0 (left edge at start)
 * - Max offset: totalWidth - viewportWidth (right edge at finish)
 */

const clampedOffset = Math.max(0, Math.min(offset, maxWorldOffset));

// Examples:
// Offset = -100  → Clamped to 0 (can't show left of start)
// Offset = 1000  → Clamped to maxWorldOffset (can't show right of finish)
// Offset = 500   → No change (valid offset)
```

**Why 40% Position?**

- Creates visual balance
- Gives player more "look ahead" space
- Feels natural when scrolling forward

---

### Canvas Sizing Strategy

The canvas uses a **fixed-size layout** calculated from entity dimensions.

#### Size Calculation

**Location**: [src/hooks/useGame.js](src/hooks/useGame.js)

```javascript
/**
 * Calculate total canvas size from entities
 * - Start scenery width + road width + finish scenery width
 * - Height = tallest entity
 */

const sceneryScale = 0.8;

// Component widths
const startWidth = startTexture.width * sceneryScale;
const roadWidth = config.laneWidth * config.laneCount;
const finishWidth = finishTexture.width * sceneryScale;

// Total dimensions
const totalWidth = startWidth + roadWidth + finishWidth / 2;
const totalHeight = Math.max(roadHeight, finishHeight);

// Set canvas to exact pixel dimensions
game.resize(totalWidth, totalHeight);
```

**Canvas CSS**:

```css
/* In GameArea/CanvasGameArea.css */
#game-canvas {
  height: 100%; /* Fill container height */
  width: auto; /* Maintain aspect ratio */
  display: block;
  /* This causes horizontal cropping on small screens */
}
```

**Result** (Legacy - See Section 8 for current implementation):

- ~~Canvas maintains fixed aspect ratio~~
- ✅ NOW: Vertical-anchor adaptive viewport (height-only scaling)
- ✅ NOW: Real-time resize with instant visual updates
- ✅ NOW: Frame-perfect camera tracking
- See [Responsiveness System - Vertical-Anchor Adaptive Viewport](#8-responsiveness-system---vertical-anchor-adaptive-viewport) for complete implementation

---

### Object Pooling Pattern

The game uses **object pooling** for car entities to avoid garbage collection pauses.

#### Pool Architecture

**Location**: [src/game/systems/CarSpawner.js](src/game/systems/CarSpawner.js)

```javascript
/**
 * Car Object Pool
 * - Pre-allocate 30 car instances
 * - Reuse instead of create/destroy
 * - Prevents GC pauses during gameplay
 */

constructor(/* ... */) {
  this.carPool = [];        // Available cars
  this.activeCars = [];     // Cars in use

  // Pre-allocate pool
  for (let i = 0; i < 30; i++) {
    const car = new Car(/* ... */);
    this.carPool.push(car);
  }
}
```

#### Acquire from Pool

```javascript
/**
 * Get car from pool or create new one
 * - Pop from pool array
 * - Reset to default state
 * - Add to stage and activeCars
 */

spawnCar(lane, speed) {
  // Acquire car (fallback to new if pool empty)
  const car = this.carPool.pop() || new Car(/* ... */);

  // Reset state
  car.reset({
    lane: lane,
    speed: speed,
    x: laneX,
    y: -200,  // Above screen
    hasCollided: false,
  });

  // Add to render stage
  this.entityManager.stage.addChild(car.container);

  // Track as active
  this.activeCars.push(car);

  return car;
}
```

#### Release to Pool

```javascript
/**
 * Return car to pool for reuse
 * - Remove from stage
 * - Hide container
 * - Add back to pool array
 */

releaseCar(car) {
  // Remove from stage
  if (car.container.parent) {
    this.entityManager.stage.removeChild(car.container);
  }

  // Hide but don't destroy
  car.release();  // Sets container.visible = false

  // Return to pool
  this.carPool.push(car);

  // Remove from active tracking
  const index = this.activeCars.indexOf(car);
  if (index > -1) {
    this.activeCars.splice(index, 1);
  }
}
```

**Pool Benefits**:

1. **No GC Pauses**: Reuse objects instead of create/destroy
2. **Consistent Performance**: Predictable memory usage
3. **Fast Spawning**: No instantiation cost during gameplay
4. **Memory Efficient**: Cap at 30 cars max

**Pool Lifecycle**:

```
Pool (idle)  →  Acquire  →  Active (playing)  →  Release  →  Pool (idle)
     ↑                                                            ↓
     └────────────────────────────────────────────────────────────┘
```

---

### PixiJS v8 Graphics API

The game uses the **NEW PixiJS v8 API** for graphics rendering.

#### Breaking Changes from v7

```javascript
// ❌ DEPRECATED (v7)
graphics.lineStyle(2, 0xff0000);
graphics.drawRect(x, y, width, height);

// ✅ CORRECT (v8)
graphics.setStrokeStyle({ width: 2, color: 0xff0000 });
graphics.rect(x, y, width, height);
graphics.stroke();

// ---

// ❌ DEPRECATED (v7)
graphics.beginFill(0x00ff00);
graphics.drawCircle(x, y, radius);
graphics.endFill();

// ✅ CORRECT (v8)
graphics.setFillStyle({ color: 0x00ff00 });
graphics.circle(x, y, radius);
graphics.fill();
```

#### Example: Gate Rendering

**Location**: [src/game/entities/Gate.js](src/game/entities/Gate.js)

```javascript
/**
 * Draw gate graphics using v8 API
 * - Stroke (outline) for gate bar
 * - Fill for gate posts
 */

const graphics = new Graphics();

// Gate bar (horizontal line)
graphics.setStrokeStyle({
  width: 4,
  color: this.isStopped ? 0xff0000 : 0x00ff00, // Red/Green
});
graphics.rect(0, 0, this.width, 0); // Horizontal line
graphics.stroke();

// Gate posts (vertical rectangles)
graphics.setFillStyle({ color: 0x333333 });
graphics.rect(-10, -20, 10, 40); // Left post
graphics.rect(this.width, -20, 10, 40); // Right post
graphics.fill();

this.container.addChild(graphics);
```

---

## 8. Responsiveness System - Vertical-Anchor Adaptive Viewport

### Architecture Overview

The game implements a **Vertical-Anchor Adaptive Viewport System** that provides:

✅ **Real-time resize response** - Instant visual updates with no refresh required  
✅ **Frame-perfect camera tracking** - Zero lag between chicken movement and viewport  
✅ **Height-based scaling** - Optimized for horizontal scrolling gameplay  
✅ **Universal device support** - From mobile portrait to ultrawide desktop  
✅ **1.25x visibility zoom** - Enhanced readability across all devices

**Core Philosophy**: The viewport height is the master constraint. Canvas scales ONLY by height (ignoring width) and is always left-aligned, allowing the horizontally-scrollable game world to extend infinitely to the right.

---

### System Components

The responsiveness system is distributed across multiple components:

| Component               | Purpose                                     | Location                                                           |
| ----------------------- | ------------------------------------------- | ------------------------------------------------------------------ |
| **PixiRenderer**        | Viewport scaling and camera tracking (core) | [PixiRenderer.js](src/game/core/PixiRenderer.js#L320-L387)         |
| **useResponsiveCanvas** | Resize detection and game orchestration     | [useResponsiveCanvas.js](src/hooks/useResponsiveCanvas.js#L24-L56) |
| **Game**                | Bridge between React and PixiJS             | [Game.js](src/game/core/Game.js#L592-L596)                         |
| **useGame**             | Initial viewport setup after asset loading  | [useGame.js](src/hooks/useGame.js#L355-L356)                       |
| **CanvasGameArea**      | Canvas DOM integration and ref management   | [CanvasGameArea.jsx](src/components/GameArea/CanvasGameArea.jsx)   |

---

### Vertical-Anchor Scaling Strategy

#### Why Vertical-Anchor (Height-Only)?

**The game is horizontally scrollable**, meaning:

- Player moves through lanes from left (start) to right (finish)
- Viewport shows a "window" into the wider game world
- Horizontal width is NOT a constraint - game can extend beyond screen edges
- Only height matters - ensures chicken, cars, coins are properly visible

**Advantages**:

1. **Mobile portrait support**: Game scales down to fit tall narrow screens
2. **Ultrawide desktop support**: Game extends right without letter-boxing
3. **Consistent visibility**: All entities remain same vertical size
4. **No horizontal dead space**: No black bars or wasted screen space
5. **Camera simplicity**: Only need to track Y-axis (vertical centering)

#### The Scaling Formula

**Location**: [PixiRenderer.js](src/game/core/PixiRenderer.js#L339-L340)

```javascript
// Vertical-Anchor Scaling Formula
this.currentScale =
  (viewportHeight / this.BASE_LOGICAL_HEIGHT) * this.ZOOM_MULTIPLIER;

// Constants
this.BASE_LOGICAL_HEIGHT = 1080; // Logical design height
this.ZOOM_MULTIPLIER = 1.25; // 1.25x zoom for better visibility
```

**Mathematical Breakdown**:

```
Scale = (ViewportHeight / 1080) × 1.25

Examples:
- 1080px viewport height → scale = (1080/1080) × 1.25 = 1.25
- 720px viewport height  → scale = (720/1080) × 1.25 = 0.833
- 540px viewport height  → scale = (540/1080) × 1.25 = 0.625
- 1440px viewport height → scale = (1440/1080) × 1.25 = 1.667
```

**Why 1.25x Zoom?**

- **Better visibility**: Makes entities 25% larger than baseline
- **Mobile readability**: Compensates for small screen physical sizes
- **Desktop appeal**: Avoids game looking "too small" on large displays
- **Accessibility**: Improves visibility for players with vision impairments

**Viewport Independence**:

- Width is **completely ignored** in the scaling calculation
- Wide screens show more of the game world horizontally
- Narrow screens show less, but game remains playable
- This is intentional - the game is designed to scroll horizontally

---

### Atomic Viewport Updates

The `updateViewport()` method performs **THREE operations atomically** in a single frame to prevent visual glitches.

**Location**: [PixiRenderer.js](src/game/core/PixiRenderer.js#L320-L355)

```javascript
updateViewport(viewportWidth, viewportHeight) {
  if (!this.app || !this.worldContainer) return;

  // Store viewport dimensions (used by updateCamera every frame)
  this.viewportWidth = viewportWidth;
  this.viewportHeight = viewportHeight;

  // Update renderer resolution for high-DPI displays
  this.app.renderer.resolution = window.devicePixelRatio || 1;

  // ━━━ ATOMIC OPERATION 1: Resize canvas to match viewport ━━━
  this.app.renderer.resize(viewportWidth, viewportHeight);

  // ━━━ ATOMIC OPERATION 2: Calculate scale based ONLY on viewport height ━━━
  // Vertical-Anchor Strategy: Height is the master constraint
  // Apply 1.25x zoom multiplier for better visibility
  this.currentScale = (viewportHeight / this.BASE_LOGICAL_HEIGHT) * this.ZOOM_MULTIPLIER;

  // ━━━ ATOMIC OPERATION 3: Apply scale to worldContainer immediately ━━━
  // This ensures visual update happens in the SAME FRAME as resize event
  this.worldContainer.scale.set(this.currentScale);

  // LEFT-ALIGNED: No horizontal centering (horizontally scrollable game)
  // Lock to left edge (x=0) for all viewport sizes
  // CRITICAL: This must NEVER be changed elsewhere - horizontal position is ALWAYS 0
  this.worldContainer.x = 0;

  // SYNCHRONIZE CAMERA IMMEDIATELY
  // Must call updateCamera() HERE to prevent frame-delay desync
  // This ensures camera position updates in the SAME FRAME as scale change
  this.updateCamera();
}
```

**Why Atomic?**

Without atomic updates, you get flickering and visual stuttering:

```
Frame N:   Resize canvas ✓, old scale applied ✗ → Visual glitch!
Frame N+1: New scale applied ✓                  → Glitch resolved
```

With atomic updates:

```
Frame N: Resize canvas ✓, new scale ✓, camera updated ✓ → Perfect!
```

**Left-Alignment Strategy**:

```javascript
this.worldContainer.x = 0; // ALWAYS LEFT-ALIGNED
```

- Game world always starts from the left edge of the viewport
- Camera only moves vertically (Y-axis) to follow chicken
- Horizontal scrolling happens via entity positions, NOT container offset
- This is critical for horizontal scrolling games

---

### Frame-Perfect Camera System

The camera uses **hard-locked tracking** with zero interpolation to eliminate all lag.

#### Camera Update Locations

The camera is updated in **TWO critical places**:

1. **After viewport resize** (immediate synchronization)
2. **Every game frame** (60+ FPS continuous tracking)

**Location 1**: [PixiRenderer.updateViewport()](src/game/core/PixiRenderer.js#L353)

```javascript
updateViewport(viewportWidth, viewportHeight) {
  // ... atomic operations ...

  // SYNCHRONIZE CAMERA IMMEDIATELY
  // Must call updateCamera() HERE to prevent frame-delay desync
  this.updateCamera();
}
```

**Location 2**: [Game.update()](src/game/core/Game.js#L227-L230)

```javascript
update(deltaTime) {
  // ... update entities ...

  // Update camera EVERY FRAME (runs at 60+ FPS)
  if (this.renderer) {
    this.renderer.updateCamera();
  }
}
```

#### Hard-Locked Camera Formula

**Location**: [PixiRenderer.updateCamera()](src/game/core/PixiRenderer.js#L363-L387)

```javascript
updateCamera() {
  if (!this.worldContainer || !this.cameraTarget) return;

  // Safeguard: Ensure viewport dimensions are valid
  // This prevents NaN or 0 values during initialization
  if (this.viewportHeight <= 0 || this.currentScale <= 0) return;

  // ━━━ HARD-LOCK: Chicken must appear at EXACTLY 50% of viewport height ━━━
  // No lerp, no smoothing, no tweens - pure mathematical lock
  const viewportMid = this.viewportHeight / 2;

  // Calculate chicken's scaled position in world space
  // The scale MUST be the current scale (updated by updateViewport)
  const chickenScaledY = this.cameraTarget.y * this.currentScale;

  // ━━━ INVERSE TRANSFORM: Move world container opposite to chicken movement ━━━
  // When chicken moves UP (+Y in logical space), world moves DOWN (-Y in screen space)
  // This creates the illusion of camera following
  this.worldContainer.y = viewportMid - chickenScaledY + this.cameraOffsetY;
}
```

**Mathematical Derivation**:

```
Goal: Keep chicken at screen Y = viewportHeight / 2 (center)

Screen space equation:
  chickenScreenY = worldContainer.y + (chicken.y * scale)

Set chickenScreenY = viewportMid and solve for worldContainer.y:
  viewportMid = worldContainer.y + (chicken.y * scale)
  worldContainer.y = viewportMid - (chicken.y * scale)

This is an INVERSE TRANSFORM:
  chicken moves UP → worldContainer moves DOWN
  chicken moves DOWN → worldContainer moves UP
```

**Why No Interpolation?**

Most games use smooth camera tracking:

```javascript
// ❌ TRADITIONAL APPROACH (introduces lag)
const targetY = calculateTargetY();
const smoothingFactor = 0.1;
camera.y += (targetY - camera.y) * smoothingFactor; // Lerp
```

**Problems with smoothing**:

- Creates visual lag between player input and camera response
- Adds complexity (smoothing factor tuning)
- Causes "rubber-band" effect when player changes direction quickly
- Inconsistent frame-to-frame behavior

**Our approach (direct binding)**:

```javascript
// ✅ OUR APPROACH (zero lag)
worldContainer.y = viewportMid - chickenScaledY; // Direct calculation
```

**Benefits**:

- **Zero lag**: Camera responds instantly to chicken movement
- **Frame-perfect**: Camera and chicken move in perfect synchronization
- **Predictable**: Identical behavior every frame, no tuning needed
- **Simple**: No smoothing variables, no edge cases

#### Camera Target Setup

The camera target is set during game initialization.

**Location**: [useGame.js](src/hooks/useGame.js#L342-L343)

```javascript
// Set camera to follow chicken with 0 vertical offset
game.renderer.setCameraTarget(chicken, 0);

// Set camera target in PixiRenderer
setCameraTarget(target, offsetY = 0) {
  this.cameraTarget = target;       // Chicken entity
  this.cameraOffsetY = offsetY;     // Vertical offset (0 = centered)
}
```

**Offset Usage**:

```javascript
// Example: Offset chicken 100px above center
game.renderer.setCameraTarget(chicken, 100);
// Result: Chicken appears at (viewportHeight/2) + 100
```

---

### Real-Time Resize Detection

The system uses **ResizeObserver** + **requestAnimationFrame** for instant visual updates.

**Location**: [useResponsiveCanvas.js](src/hooks/useResponsiveCanvas.js#L24-L56)

```javascript
export function useResponsiveCanvas(canvasRef, containerRef, gameRef) {
  const rafIdRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const game = gameRef.current;

    if (!container || !canvas || !game) return;

    const handleResize = () => {
      // Cancel any pending animation frame to avoid duplicate updates
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      // Schedule update on next animation frame for smooth visual transition
      rafIdRef.current = requestAnimationFrame(() => {
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;

        // ━━━ CRITICAL: Call game.updateViewport() NOT game.resize() ━━━
        // updateViewport() triggers viewport scaling + camera sync
        // resize() only changes canvas internal resolution
        game.updateViewport(width, height);

        rafIdRef.current = null;
      });
    };

    // ━━━ DUAL DETECTION STRATEGY ━━━
    // Use ResizeObserver for container changes (layout shifts, CSS changes)
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Use window.resize for browser window changes (user dragging window)
    window.addEventListener("resize", handleResize);

    // Initial size detection
    handleResize();

    // Cleanup
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [canvasRef, containerRef, gameRef]);
}
```

**Why ResizeObserver + window.resize?**

| Detection Method   | Triggers On                    | Use Case                        |
| ------------------ | ------------------------------ | ------------------------------- |
| **ResizeObserver** | Container element size changes | CSS layout shifts, flex reflows |
| **window.resize**  | Browser window size changes    | User drags window edges         |
| Both               | Covers all resize scenarios    | Comprehensive detection         |

**Why requestAnimationFrame?**

```javascript
// ❌ WITHOUT RAF: May trigger mid-frame (visual tearing)
handleResize() {
  game.updateViewport(width, height);  // Executes immediately
}

// ✅ WITH RAF: Waits for next frame boundary (smooth update)
handleResize() {
  requestAnimationFrame(() => {
    game.updateViewport(width, height);  // Executes at frame start
  });
}
```

**Benefits of RAF**:

- Updates happen at frame boundaries (eliminates tearing)
- Automatically throttles to display refresh rate (60Hz, 120Hz, 144Hz)
- Cancels pending updates if multiple resizes happen quickly
- Synchronizes with PixiJS render loop

**Old System (Removed)**:

```javascript
// ❌ OLD: Used debounce with 100ms delay
setTimeout(() => game.resize(width, height), 100);
```

**Problems with debounce**:

- 100ms delay makes resize feel laggy
- User sees old layout for 100ms after resize
- Unpredictable timing (varies by user resize speed)

---

### Call Chain Visualization

#### Complete Resize Flow

```
User Action: Drag window edge
     ↓
┌────────────────────────────────────────────────────────────────┐
│ Browser Event Layer                                            │
├────────────────────────────────────────────────────────────────┤
│ window.resize event fires                                      │
│ ResizeObserver detects container size change                   │
└────────────────────────────────────────────────────────────────┘
     ↓
┌────────────────────────────────────────────────────────────────┐
│ React Hook Layer (useResponsiveCanvas.js)                      │
├────────────────────────────────────────────────────────────────┤
│  1. handleResize() cancels any pending RAF                     │
│  2. requestAnimationFrame(() => {...})                         │
│  3. Get container dimensions (width, height)                   │
│  4. Call game.updateViewport(width, height)                    │
└────────────────────────────────────────────────────────────────┘
     ↓
┌────────────────────────────────────────────────────────────────┐
│ Game Orchestration Layer (Game.js)                             │
├────────────────────────────────────────────────────────────────┤
│  Method: updateViewport(viewportWidth, viewportHeight)         │
│   ↓                                                             │
│  Bridge to renderer.updateViewport()                           │
└────────────────────────────────────────────────────────────────┘
     ↓
┌────────────────────────────────────────────────────────────────┐
│ PixiJS Rendering Layer (PixiRenderer.js)                       │
├────────────────────────────────────────────────────────────────┤
│  Method: updateViewport(viewportWidth, viewportHeight)         │
│   ↓                                                             │
│  ATOMIC OPERATION 1: renderer.resize(width, height)            │
│  ATOMIC OPERATION 2: currentScale = (height/1080) * 1.25       │
│  ATOMIC OPERATION 3: worldContainer.scale.set(currentScale)    │
│   ↓                                                             │
│  Set worldContainer.x = 0 (left-align)                         │
│   ↓                                                             │
│  Call updateCamera() ────────────────────┐                     │
│                                           ↓                     │
│  Method: updateCamera()                                        │
│   ↓                                                             │
│  Calculate: chickenScaledY = chicken.y * currentScale          │
│  Calculate: worldContainer.y = viewportMid - chickenScaledY    │
└────────────────────────────────────────────────────────────────┘
     ↓
Result: Instant visual update (no refresh required)
```

#### Every Frame Camera Update

```
PixiJS Ticker fires (60+ FPS)
     ↓
┌────────────────────────────────────────────────────────────────┐
│ Game Loop (Game.js)                                            │
├────────────────────────────────────────────────────────────────┤
│  Method: update(deltaTime)                                     │
│   ↓                                                             │
│  Update chicken position (if jumping)                          │
│  Update cars, coins, other entities                            │
│   ↓                                                             │
│  Call renderer.updateCamera() ──────────┐                      │
└────────────────────────────────────────────┬───────────────────┘
                                           ↓
┌────────────────────────────────────────────────────────────────┐
│ PixiJS Rendering Layer (PixiRenderer.js)                       │
├────────────────────────────────────────────────────────────────┤
│  Method: updateCamera()                                        │
│   ↓                                                             │
│  Safeguard: Check viewportHeight > 0 && currentScale > 0       │
│   ↓                                                             │
│  Calculate: viewportMid = viewportHeight / 2                   │
│  Calculate: chickenScaledY = cameraTarget.y * currentScale     │
│  Calculate: worldContainer.y = viewportMid - chickenScaledY    │
│   ↓                                                             │
│  PixiJS renders updated scene to canvas                        │
└────────────────────────────────────────────────────────────────┘
     ↓
Result: Chicken remains perfectly centered at 50% viewport height
```

---

### Device Support Matrix

The vertical-anchor system provides universal support across all device categories:

| Device Type          | Screen Size         | Viewport Height | Scale | Behavior                                  |
| -------------------- | ------------------- | --------------- | ----- | ----------------------------------------- |
| **Mobile Portrait**  | 375x667 (iPhone SE) | 667px           | 0.772 | Scales down, shows ~3 lanes               |
| **Mobile Landscape** | 667x375 (iPhone SE) | 375px           | 0.434 | Scales down significantly, tight fit      |
| **Tablet Portrait**  | 768x1024 (iPad)     | 1024px          | 1.185 | Scales up slightly, comfortable view      |
| **Tablet Landscape** | 1024x768 (iPad)     | 768px           | 0.889 | Scales down slightly, shows more lanes    |
| **Desktop HD**       | 1920x1080 (Full HD) | 1080px          | 1.250 | Baseline scale (1.25x zoom)               |
| **Desktop 4K**       | 3840x2160 (4K)      | 2160px          | 2.500 | Scales up 2x, very large entities         |
| **Ultrawide**        | 3440x1440           | 1440px          | 1.667 | Scales up, shows many lanes horizontally  |
| **Mobile Tall**      | 375x812 (iPhone X)  | 812px           | 0.940 | Scales slightly down, good vertical space |

**Scale Calculation Examples**:

```javascript
// Mobile Portrait (375x667)
scale = (667 / 1080) * 1.25 = 0.772

// Desktop HD (1920x1080)
scale = (1080 / 1080) * 1.25 = 1.250

// 4K Monitor (3840x2160)
scale = (2160 / 1080) * 1.25 = 2.500
```

**Width Independence**:

- Screen width does NOT affect scale
- Wide screens show more lanes (more horizontal game world)
- Narrow screens show fewer lanes (less horizontal game world)
- Game remains playable on all widths (horizontally scrollable)

---

### Coordinate System Transformations

The renderer provides utilities for converting between logical and screen coordinates.

**Location**: [PixiRenderer.js](src/game/core/PixiRenderer.js#L393-L410)

```javascript
/**
 * Get logical-to-screen coordinate conversion
 * Useful for converting game coordinates to screen pixels
 */
logicalToScreen(logicalX, logicalY) {
  return {
    x: this.worldContainer.x + logicalX * this.currentScale,
    y: this.worldContainer.y + logicalY * this.currentScale,
  };
}

/**
 * Get screen-to-logical coordinate conversion
 * Useful for converting mouse/touch input to game coordinates
 */
screenToLogical(screenX, screenY) {
  return {
    x: (screenX - this.worldContainer.x) / this.currentScale,
    y: (screenY - this.worldContainer.y) / this.currentScale,
  };
}
```

**Use Cases**:

```javascript
// Example 1: Convert chicken's logical position to screen pixels
const chicken = { x: 500, y: 300 }; // Logical coordinates
const screenPos = renderer.logicalToScreen(chicken.x, chicken.y);
console.log(screenPos); // { x: 625, y: 375 } (at scale 1.25)

// Example 2: Convert mouse click to game coordinates
canvas.addEventListener("click", (e) => {
  const screenX = e.clientX;
  const screenY = e.clientY;
  const logicalPos = renderer.screenToLogical(screenX, screenY);
  console.log(logicalPos); // Logical game coordinates
});
```

---

### Performance Characteristics

#### Resize Performance

- **Instant visual response**: Updates complete in <16ms (single frame at 60 FPS)
- **No jank**: Atomic operations prevent visual glitches
- **No debounce delay**: requestAnimationFrame provides natural throttling
- **Device pixel ratio support**: Automatically scales for Retina/4K displays

#### Camera Performance

- **60+ FPS tracking**: Camera updates every frame with zero lag
- **Direct calculation**: No interpolation overhead
- **Negligible CPU cost**: Simple arithmetic operations
- **GPU-accelerated**: PixiJS handles all rendering via WebGL

#### Memory Profile

- **Static allocation**: No object creation during resize
- **No garbage collection**: Reuses existing containers and properties
- **Constant memory**: Viewport changes don't allocate new memory

---

### Common Edge Cases

#### Edge Case 1: Window Too Small

```javascript
// Safeguard in updateCamera()
if (this.viewportHeight <= 0 || this.currentScale <= 0) return;
```

**Behavior**: If viewport height is 0 or negative (e.g., minimized window), camera update is skipped.

#### Edge Case 2: Camera Target Not Set

```javascript
// Safeguard in updateCamera()
if (!this.worldContainer || !this.cameraTarget) return;
```

**Behavior**: If chicken hasn't loaded yet, camera update is skipped (prevents crash).

#### Edge Case 3: Rapid Resize Events

```javascript
// In useResponsiveCanvas.js
if (rafIdRef.current) {
  cancelAnimationFrame(rafIdRef.current); // Cancel previous pending update
}
```

**Behavior**: Only the latest resize is processed, intermediate resizes are ignored.

#### Edge Case 4: High-DPI Displays

```javascript
// Dynamic resolution adjustment
this.app.renderer.resolution = window.devicePixelRatio || 1;
```

**Behavior**: Automatically detects Retina (2x), 4K (4x) displays and adjusts internal resolution.

---

### UI Responsive Styling

While the canvas uses vertical-anchor scaling, UI components use standard CSS media queries.

**Header** ([src/components/header/index.css](src/components/header/index.css)):

```css
.header {
  height: 49px;
  padding: 8px 22px;
}

@media (max-width: 768px) {
  .header {
    padding: 6px 16px;
  }
}
```

**GameArea Container** ([src/components/GameArea/index.css](src/components/GameArea/index.css)):

```css
.road-vertical {
  min-height: 400px;
  padding: 16px 24px;
}

@media (max-width: 768px) {
  .road-vertical {
    min-height: 300px;
  }

  .chicken-position {
    transform: scale(0.65);
  }
}

@media (min-width: 1024px) {
  .road-vertical {
    padding: 20px 32px;
  }

  .chicken-position {
    transform: scale(0.75);
  }
}
```

**ControlPanel** ([src/components/ControlPanel/index.css](src/components/ControlPanel/index.css)):

```css
.control-panel {
  display: flex;
  gap: 16px;
  padding: 20px;
}

@media (max-width: 768px) {
  .control-panel {
    flex-direction: column;
    gap: 12px;
    padding: 16px;
  }
}
```

---

### Testing and Verification

#### Manual Testing Protocol

**Test 1: Instant Resize Response**

1. Open game in browser (http://localhost:5174/)
2. Start gameplay (chicken moving)
3. Drag browser window edge to resize
4. **Expected**: Game scales instantly without refresh
5. **Expected**: Chicken remains centered vertically
6. **Expected**: No visual glitches or stuttering

**Test 2: Maintain Aspect Ratio**

1. Resize window to very wide (3440x1440)
2. **Expected**: Game shows more lanes horizontally
3. **Expected**: Entities maintain correct proportions
4. Resize window to very tall (800x1200)
5. **Expected**: Game scales down, shows fewer lanes
6. **Expected**: Entities remain proportional

**Test 3: Frame-Perfect Camera**

1. Start game and jump chicken several lanes
2. Observe chicken's vertical screen position
3. **Expected**: Chicken stays EXACTLY at 50% viewport height
4. **Expected**: No lag between chicken movement and viewport
5. Resize window during chicken jump animation
6. **Expected**: Chicken remains centered throughout resize

**Test 4: Mobile Device Simulation**

1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select "iPhone SE" (375x667)
4. **Expected**: Game scales down to fit (scale ≈ 0.772)
5. Rotate to landscape (667x375)
6. **Expected**: Game scales further down (scale ≈ 0.434)
7. **Expected**: Game remains playable

**Test 5: High-DPI Display**

1. Open game on Retina MacBook or 4K monitor
2. Check canvas resolution in DevTools
3. **Expected**: canvas.width = viewportWidth × devicePixelRatio
4. **Expected**: Sharp rendering, no blurriness
5. Resize window
6. **Expected**: Resolution updates dynamically

#### Automated Verification

```javascript
// Check viewport state
console.log(game.renderer.viewportWidth); // Current viewport width
console.log(game.renderer.viewportHeight); // Current viewport height
console.log(game.renderer.currentScale); // Current scale factor

// Check camera state
console.log(game.renderer.cameraTarget); // Should be chicken entity
console.log(game.renderer.worldContainer.y); // World container Y position

// Verify camera math
const chicken = game.renderer.cameraTarget;
const expectedWorldY =
  game.renderer.viewportHeight / 2 - chicken.y * game.renderer.currentScale;
console.assert(
  Math.abs(game.renderer.worldContainer.y - expectedWorldY) < 0.1,
  "Camera math incorrect!",
);

// Verify scale formula
const expectedScale =
  (game.renderer.viewportHeight / 1080) * game.renderer.ZOOM_MULTIPLIER;
console.assert(
  Math.abs(game.renderer.currentScale - expectedScale) < 0.001,
  "Scale calculation incorrect!",
);
```

---

### Troubleshooting Guide

#### Issue: Game doesn't resize after window change

**Cause**: useResponsiveCanvas not connected or game ref not set

**Solution**:

1. Check CanvasGameArea.jsx uses `useResponsiveCanvas(canvasRef, containerRef, gameRef)`
2. Verify gameRef.current points to game instance
3. Check console for errors during resize

#### Issue: Chicken drifts away from vertical center

**Cause**: updateCamera() not being called every frame OR in updateViewport()

**Solution**:

1. Verify `renderer.updateCamera()` is called in `Game.update()` (line 229)
2. Verify `this.updateCamera()` is called at end of `updateViewport()` (line 353)
3. Check cameraTarget is set: `game.renderer.setCameraTarget(chicken, 0)`

#### Issue: Visual glitches/stuttering during resize

**Cause**: Scale and canvas size updating in different frames

**Solution**:

1. Ensure `updateViewport()` performs atomic operations (all three steps in one call)
2. Check worldContainer.scale.set() is called BEFORE updateCamera()
3. Verify requestAnimationFrame is being used (not setTimeout/debounce)

#### Issue: Game looks blurry on Retina display

**Cause**: Renderer resolution not matching device pixel ratio

**Solution**:

1. Check `app.renderer.resolution = window.devicePixelRatio || 1` in updateViewport()
2. Verify devicePixelRatio is > 1 for Retina displays
3. Ensure canvas internal resolution matches: `renderer.resize(width, height)`

#### Issue: Camera lag or "rubber-banding"

**Cause**: Interpolation or smoothing applied to camera

**Solution**:

1. Verify updateCamera() uses direct calculation (no lerp):
   ```javascript
   this.worldContainer.y = viewportMid - chickenScaledY; // Direct, no smoothing
   ```
2. Check no external code is modifying worldContainer.y
3. Ensure updateCamera() is called every frame

---

### Summary for AI Engineers

**Key Takeaways**:

1. **Vertical-Anchor Scaling**: Height-only scaling formula `(height/1080) × 1.25`
2. **Atomic Updates**: THREE operations in ONE frame (resize, scale, camera)
3. **Frame-Perfect Camera**: Direct math binding, zero interpolation/lag
4. **Real-Time Detection**: ResizeObserver + window.resize + requestAnimationFrame
5. **Left-Alignment**: worldContainer.x always 0 (horizontal scrolling game)
6. **Universal Device Support**: From mobile portrait to 4K ultrawide
7. **No Refresh Required**: Instant visual response to any viewport change

**Critical Code Locations**:

- Viewport scaling: [PixiRenderer.js#L320-L355](src/game/core/PixiRenderer.js#L320-L355)
- Camera tracking: [PixiRenderer.js#L363-L387](src/game/core/PixiRenderer.js#L363-L387)
- Resize detection: [useResponsiveCanvas.js#L24-L56](src/hooks/useResponsiveCanvas.js#L24-L56)
- Game bridge: [Game.js#L592-L596](src/game/core/Game.js#L592-L596)
- Frame updates: [Game.js#L227-L230](src/game/core/Game.js#L227-L230)

**Mathematical Formulas**:

```javascript
// Vertical-anchor scaling
scale = (viewportHeight / 1080) * 1.25;

// Frame-perfect camera
worldContainer.y = viewportHeight / 2 - cameraTarget.y * scale;
```

**Testing Command**:

```bash
npm run dev
# Drag browser window to resize
# Expected: Instant scaling with NO refresh required
```

---

## 9. Frontend Architecture Patterns

### Entity-Component Pattern

The game uses a **modified Entity-Component pattern** without a full ECS (Entity-Component-System).

#### BaseEntity Class

**Location**: [src/game/entities/BaseEntity.js](src/game/entities/BaseEntity.js)

```javascript
/**
 * Base class for all game entities
 * - Provides common interface
 * - Manages PixiJS Container
 * - Defines lifecycle methods
 */

export default class BaseEntity {
  constructor() {
    this.container = new Container(); // PixiJS display object
    this.x = 0;
    this.y = 0;
  }

  // Lifecycle methods (override in subclasses)
  update(deltaTime) {} // Called every frame
  destroy() {} // Cleanup when removed
  reset() {} // Reset to default state (pooling)
}
```

#### Entity Specialization

```
BaseEntity (abstract)
    │
    ├── Chicken (player)
    │   ├── Spine animation
    │   ├── Jump mechanics
    │   ├── Callback system
    │   └──Death animation
    │
    ├── Car (obstacle)
    │   ├── Lane assignment
    │   ├── Speed/movement
    │   ├── Collision flag
    │   └── Object pooling
    │
    ├── Coin (collectible indicator)
    │   ├── Silver/gold states
    │   ├── Visibility animation
    │   └── Multiplier value
    │
    ├── Gate (safe zone)
    │   ├── isStopped flag
    │   ├── Collision exclusion
    │   └── Visual graphics
    │
    ├── Road (background)
    │   └── Static graphics
    │
    └── Scenery (finish line)
        └── Static sprite
```

---

### Manager Pattern

Game logic is organized into **Manager classes** for separation of concerns.

#### EntityManager

**Location**: [src/game/managers/EntityManager.js](src/game/managers/EntityManager.js)

**Responsibilities**:

- Track all entity instances
- Call `update()` on each entity every frame
- Manage entity lifecycle (add/remove)
- Provide entity lookup

```javascript
export default class EntityManager {
  constructor(stage) {
    this.stage = stage; // PixiJS stage
    this.entities = []; // All entities
  }

  addEntity(entity) {
    this.entities.push(entity);
    this.stage.addChild(entity.container);
  }

  removeEntity(entity) {
    const index = this.entities.indexOf(entity);
    if (index > -1) {
      this.entities.splice(index, 1);
      this.stage.removeChild(entity.container);
      entity.destroy();
    }
  }

  update(deltaTime) {
    // Update all entities
    for (const entity of this.entities) {
      if (entity.update) {
        entity.update(deltaTime);
      }
    }
  }
}
```

#### CoinManager

**Location**: [src/game/managers/CoinManager.js](src/game/managers/CoinManager.js)

**Responsibilities**:

- Manage coin visibility (silver → gold)
- Track current lane index
- Calculate multiplier for payouts
- Handle finish line edge case

```javascript
export default class CoinManager {
  constructor(coins, startX, laneWidth) {
    this.coins = coins; // Array of Coin entities
    this.currentLaneIndex = -1; // Chicken's current lane
    this.highestPassedLane = -1; // Highest lane reached
    this.startX = startX;
    this.laneWidth = laneWidth;
  }

  // Convert current coin to gold
  finishCurrentLane() {
    /* ... */
  }

  // Get payout multiplier for current position
  getCurrentMultiplier() {
    /* ... */
  }

  // Show next coin after jump
  updateCoinVisibility() {
    /* ... */
  }

  // Reset all coins to silver
  reset() {
    /* ... */
  }

  update(deltaTime) {
    // Update coin animations
    for (const coin of this.coins) {
      coin.update(deltaTime);
    }
  }
}
```

#### GateManager

**Location**: [src/game/managers/GateManager.js](src/game/managers/GateManager.js)

**Responsibilities**:

- Place gates at specific lanes
- Manage gate open/closed states
- Provide gate references for collision exclusion

```javascript
export default class GateManager {
  constructor(gates, config) {
    this.gates = gates; // Array of Gate entities
    this.config = config;
  }

  // Get gate for specific lane (for collision check)
  getGateForLane(laneIndex) {
    return this.gates.find((gate) => gate.laneIndex === laneIndex);
  }

  // Open/close gates based on game state
  updateGateStates() {
    /* ... */
  }

  update(deltaTime) {
    for (const gate of this.gates) {
      gate.update(deltaTime);
    }
  }
}
```

---

### System Pattern

Game systems handle **cross-entity logic** and **spawning**.

#### CarSpawner System

**Location**: [src/game/systems/CarSpawner.js](src/game/systems/CarSpawner.js)

**Responsibilities**:

- Spawn cars with timing/randomness
- Move cars down screen
- Check AABB collision
- Manage object pool
- Handle lane cooldowns

```javascript
export default class CarSpawner {
  constructor(entityManager, chicken, config) {
    this.entityManager = entityManager;
    this.chicken = chicken;
    this.config = config;

    // Object pool
    this.carPool = [];
    this.activeCars = [];

    // Spawn timing
    this.spawnTimer = 0;
    this.spawnInterval = 0.5; // Seconds between spawns

    // Collision
    this.hasCollided = false;
    this.onCollision = null; // Callback to App.jsx
  }

  // Spawn a new car
  spawnCar(lane, speed) {
    /* ... */
  }

  // Main update loop
  update(deltaTime) {
    // Update spawn timer
    this.spawnTimer += deltaTime;

    // Spawn new car if timer expired
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnInterval = this.getRandomSpawnInterval();
      const lane = this.getRandomValidLane();
      this.spawnCar(lane);
    }

    // Update active cars
    for (const car of this.activeCars) {
      // Move car
      car.update(deltaTime);

      // Check collision
      if (!this.hasCollided) {
        this.checkCarChickenCollision(car);
      }

      // Remove if off-screen
      if (car.y > this.screenHeight + 200) {
        this.releaseCar(car);
      }
    }
  }

  // AABB collision detection
  checkCarChickenCollision(car) {
    /* ... */
  }
}
```

#### InputSystem

**Location**: [src/game/systems/InputSystem.js](src/game/systems/InputSystem.js)

**Responsibilities**:

- Listen for keyboard/touch input
- Trigger gameplay actions
- Provide input callbacks

```javascript
export default class InputSystem {
  constructor() {
    this.handlers = new Map(); // Event → callback
  }

  // Register input handler
  on(event, callback) {
    this.handlers.set(event, callback);
  }

  // Start listening
  enable() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("touchstart", this.handleTouchStart);
  }

  // Stop listening
  disable() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("touchstart", this.handleTouchStart);
  }

  handleKeyDown = (e) => {
    const handler = this.handlers.get(e.key);
    if (handler) handler();
  };

  handleTouchStart = (e) => {
    const handler = this.handlers.get("touch");
    if (handler) handler();
  };
}
```

---

### Event Bus Pattern

The game uses an **Event Bus** for decoupled communication.

**Location**: [src/game/core/GameEventBus.js](src/game/core/GameEventBus.js)

```javascript
/**
 * Global event bus for game-wide events
 * - Pub/Sub pattern
 * - Decouples event producers from consumers
 * - Allows multiple listeners per event
 */

export default class GameEventBus {
  constructor() {
    this.listeners = new Map(); // event → [callbacks]
  }

  // Subscribe to event
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Unsubscribe from event
  off(event, callback) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  // Publish event to all listeners
  emit(event, data) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event);
    for (const callback of callbacks) {
      callback(data);
    }
  }

  // Clear all listeners for event
  clear(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear(); // Clear all
    }
  }
}
```

**Usage Example**:

```javascript
// In Game.js
this.eventBus = new GameEventBus();

// Subscribe to collision event
this.eventBus.on("collision", (data) => {
  console.log("Collision detected!", data);
  this.handleChickenDeath();
});

// In CarSpawner.js
if (AABB_collision) {
  this.eventBus.emit("collision", {
    car: car,
    chicken: this.chicken,
  });
}
```

**Benefits**:

- **Decoupling**: CarSpawner doesn't need reference to Game
- **Multiple Listeners**: UI can also listen for collision for SFX
- **Testability**: Easy to mock events in tests

---

### Callback Pattern

The game uses **callbacks** for asynchronous sequences (jump completion, death).

#### Jump Completion Callback

```javascript
// In App.jsx - Setup callback
const onFinishCallback = useCallback(() => {
  triggerWinSequence();
}, [triggerWinSequence]);

// In useGame.js - Pass callback to entity
chicken.jumpTo(targetX, shouldMoveWorld, worldAnimationData, onFinishCallback);

// In Chicken.js - Execute callback on landing
if (this.jumpProgress >= 1) {
  if (this.onJumpComplete) {
    this.onJumpComplete(); // Triggers win sequence
  }
}
```

#### Death Completion Callback

```javascript
// In App.jsx - Setup callback
const handleCollision = useCallback(() => {
  setGameState("lost");

  gameRef.current.handleChickenDeath(() => {
    cleanupAfterDeath();  // Callback
  });
}, [cleanupAfterDeath]);

// In Game.js - Execute callback after animation
async handleChickenDeath(onComplete) {
  await playDeathAnimation();
  await delay(1000);

  if (onComplete) {
    onComplete();  // Triggers cleanup
  }
}
```

**Benefits**:

- **Async Flow**: Wait for animations without blocking
- **Separation**: React doesn't need to poll animation state
- **Timing**: Precise control over sequence timing

---

### Ref Pattern (React ↔ PixiJS Bridge)

The game uses **React refs** to bridge React state and PixiJS instances.

```javascript
// In App.jsx
const gameRef = useRef(null); // Game instance
const coinManagerRef = useRef(null); // CoinManager instance

// Store references in useGame hook
useEffect(() => {
  // Create game...
  gameRef.current = game;
  coinManagerRef.current = game.coinManager;
}, []);

// Access from event handlers
const handlePlay = () => {
  // Access PixiJS from React
  const multiplier = coinManagerRef.current.getCurrentMultiplier();
  gameRef.current.state = "playing";
};
```

**Ref vs State**:

- **State**: Triggers re-render (UI changes)
- **Ref**: No re-render (game instance storage)

---

### Hook Pattern

Custom hooks encapsulate game logic and lifecycle.

#### useGame Hook

**Location**: [src/hooks/useGame.js](src/hooks/useGame.js)

**Purpose**: Bridge between React and PixiJS

```javascript
export function useGame(canvasRef, config, containerRef) {
  const [isLoading, setIsLoading] = useState(true);
  const gameRef = useRef(null);

  // Initialize game on mount
  useEffect(() => {
    const initGame = async () => {
      const game = new Game(canvasRef.current);
      await game.init(config);
      gameRef.current = game;
      setIsLoading(false);
    };

    initGame();

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy();
      }
    };
  }, []);

  // Expose game API
  return {
    isLoading,
    jumpChicken: () => {
      /* ... */
    },
    stopGame: () => {
      /* ... */
    },
    game: gameRef.current,
  };
}
```

#### useOutsideClick Hook

**Location**: [src/hooks/useOutsideClick.js](src/hooks/useOutsideClick.js)

**Purpose**: Close modals/menus when clicking outside

```javascript
export function useOutsideClick(ref, handler) {
  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        handler();
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ref, handler]);
}
```

---

### Singleton Pattern

The Game instance is a **singleton** accessible globally.

```javascript
// In useGame.js
window.__GAME_INSTANCE__ = gameRef.current;

// Access from anywhere (debugging)
const game = window.__GAME_INSTANCE__;
console.log("Current state:", game.state);
console.log("Active cars:", game.carSpawner.activeCars.length);
```

⚠️ **Warning**: Use only for debugging, not production code

---

### Async/Await Pattern

Animation sequences use **async/await** for readable flow control.

```javascript
/**
 * Death sequence with async/await
 * - Wait for death animation
 * - Wait for visual buffer
 * - Trigger cleanup callback
 */

async handleChickenDeath(onComplete) {
  // Set state
  this.state = "gameover";

  // Find chicken entity
  const chicken = this.entityManager.entities.find(
    e => e.playDeath && typeof e.playDeath === "function"
  );

  if (!chicken) {
    if (onComplete) onComplete();
    return;
  }

  // Wait for death animation
  await new Promise((resolve) => {
    chicken.playDeath(() => resolve());
  });

  // Visual buffer
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Trigger cleanup
  if (onComplete) {
    onComplete();
  }
}
```

**Benefits**:

- **Readable**: Sequential flow instead of callback hell
- **Debugging**: Easy to add breakpoints
- **Error Handling**: Can use try/catch

---

## 🎯 Summary for AI Engineer

### Key Takeaways

#### Core Architecture

1. **Hybrid React + PixiJS**: React manages UI/financial state, PixiJS handles game rendering and logic
2. **Dual State System**: `gameState` (React) for UI locks, `game.state` (PixiJS) for game systems
3. **Game Loop**: 60 FPS PixiJS Ticker with deltaTime normalization for frame-rate independence
4. **Entity-Component Pattern**: BaseEntity class with specialized subclasses (Chicken, Car, Coin, Gate)
5. **Manager Pattern**: EntityManager, CoinManager, GateManager for separation of concerns
6. **System Pattern**: CarSpawner and InputSystem for cross-entity logic

#### Animation & Rendering

7. **PixiJS v8 WebGL**: Hardware-accelerated rendering with anti-aliasing and auto-density
8. **Spine Skeletal Animation**: Chicken uses professional skeletal animations (idle, jump, death)
9. **Easing Functions**: Ease-in-out quadratic for smooth jump interpolation
10. **World Movement System**: After lane 3, world scrolls left while chicken stays at 40% viewport
11. **Object Pooling**: 30 pre-allocated car instances to prevent GC pauses
12. **Stage Culling Disabled**: Prevents cars from disappearing when off-screen

#### Game Mechanics

13. **Callback Architecture**: Chicken entity triggers automatic win via `onJumpComplete` callback
14. **World Space Coordinates**: Always use `getBounds()` for collision detection (not screen space)
15. **AABB Collision**: Axis-aligned bounding box collision with gate exclusion logic
16. **Gate System**: Safe zones with `isStopped` flag that disable collision detection
17. **Dynamic Safe Zones**: Cars spawn only ahead of chicken, never on current lane or behind
18. **Car Momentum**: Cars continue moving during death animation for natural visuals

#### Financial & State

19. **Currency Precision**: Use `roundCurrency()` for ALL financial calculations (floating-point safety)
20. **Auto-Sequences**: Both win (3s) and loss (2-3s) auto-reset to idle state
21. **Button Locking**: Disable buttons during win/loss to prevent double-actions
22. **Coin Edge Case**: Special handling when chicken reaches finish line (`currentLaneIndex = -1`)

#### Technical Details

23. **PixiJS v8 API**: Use new graphics API (`setStrokeStyle`, `rect().stroke()` instead of v7 methods)
24. **Texture Caching**: Internal Map caches loaded textures for reuse
25. **Multiple Collision Prevention**: `hasCollided` flags prevent duplicate death triggers
26. **Vertical-Anchor Viewport**: Height-only scaling with 1.25x zoom - see [Section 8](#8-responsiveness-system---vertical-anchor-adaptive-viewport)
27. **Frame-Perfect Camera**: Zero-lag camera tracking with hard-locked formula
28. **Real-Time Resize**: ResizeObserver + requestAnimationFrame for instant updates
29. **Event Bus Available**: GameEventBus for pub/sub communication (prepared but minimal usage)
30. **Global Game Instance**: `window.__GAME_INSTANCE__` for debugging access

### Critical Code Locations

#### State Management & UI

| Feature           | File                             | Lines   | Description                        |
| ----------------- | -------------------------------- | ------- | ---------------------------------- |
| State machine     | [App.jsx](src/App.jsx)           | 1-225   | React state orchestrator           |
| Currency helper   | [App.jsx](src/App.jsx#L9-L11)    | 9-11    | Floating-point precision fix       |
| Play button logic | [App.jsx](src/App.jsx#L41-L118)  | 41-118  | Start game + jump chicken          |
| Collision handler | [App.jsx](src/App.jsx#L127-L137) | 127-137 | Lock UI + trigger death sequence   |
| Win sequence      | [App.jsx](src/App.jsx#L83-L113)  | 83-113  | Calculate payout + auto-reset      |
| Cashout handler   | [App.jsx](src/App.jsx#L166-L194) | 166-194 | Manual exit with multiplier payout |

#### Game Lifecycle & Core

| Feature             | File                                         | Lines   | Description                         |
| ------------------- | -------------------------------------------- | ------- | ----------------------------------- |
| Game initialization | [useGame.js](src/hooks/useGame.js#L290-L377) | 290-377 | Create game + load assets           |
| Jump with callback  | [useGame.js](src/hooks/useGame.js#L290-L377) | 290-377 | Detect final jump + pass callback   |
| Game loop           | [Game.js](src/game/core/Game.js#L117-L166)   | 117-166 | 60 FPS ticker + conditional systems |
| Death sequence      | [Game.js](src/game/core/Game.js#L158-L200)   | 158-200 | Async death animation + cleanup     |
| Game start          | [Game.js](src/game/core/Game.js#L95-L115)    | 95-115  | Initialize ticker + set idle state  |

#### Rendering & Animation

| Feature            | File                                                      | Lines   | Description                           |
| ------------------ | --------------------------------------------------------- | ------- | ------------------------------------- |
| PixiJS renderer    | [PixiRenderer.js](src/game/core/PixiRenderer.js)          | 1-150   | WebGL setup + texture loading         |
| Spine loading      | [PixiRenderer.js](src/game/core/PixiRenderer.js#L80-L120) | 80-120  | Load Spine skeleton + atlas           |
| Chicken animation  | [Chicken.js](src/game/entities/Chicken.js)                | 1-364   | Spine controller + jump mechanics     |
| Jump interpolation | [Chicken.js](src/game/entities/Chicken.js#L166-L239)      | 166-239 | Easing function + world movement      |
| Death animation    | [Chicken.js](src/game/entities/Chicken.js#L270-L295)      | 270-295 | Play death Spine animation + callback |

#### Collision & Spawning

| Feature         | File                                                      | Lines   | Description                            |
| --------------- | --------------------------------------------------------- | ------- | -------------------------------------- |
| AABB collision  | [CarSpawner.js](src/game/systems/CarSpawner.js#L540-L570) | 540-570 | World space collision detection        |
| Object pooling  | [CarSpawner.js](src/game/systems/CarSpawner.js#L80-L120)  | 80-120  | Pre-allocate 30 cars + acquire/release |
| Car spawning    | [CarSpawner.js](src/game/systems/CarSpawner.js#L200-L250) | 200-250 | Dynamic lane selection + spawn timing  |
| Safe zone logic | [CarSpawner.js](src/game/systems/CarSpawner.js#L450-L480) | 450-480 | Exclude chicken lane + behind lanes    |

#### Managers & Systems

| Feature          | File                                                         | Lines   | Description                          |
| ---------------- | ------------------------------------------------------------ | ------- | ------------------------------------ |
| Final coin fix   | [CoinManager.js](src/game/managers/CoinManager.js#L285-L313) | 285-313 | Handle finish line edge case         |
| Multiplier calc  | [CoinManager.js](src/game/managers/CoinManager.js#L315-L340) | 315-340 | Get current payout multiplier        |
| Coin visibility  | [CoinManager.js](src/game/managers/CoinManager.js#L230-L260) | 230-260 | Show next coin after jump            |
| Gate management  | [GateManager.js](src/game/managers/GateManager.js)           | 1-200   | Gate placement + collision exclusion |
| Entity lifecycle | [EntityManager.js](src/game/managers/EntityManager.js)       | 1-150   | Add/remove/update all entities       |

#### Responsiveness System

| Feature            | File                                                               | Lines   | Description                                  |
| ------------------ | ------------------------------------------------------------------ | ------- | -------------------------------------------- |
| Viewport scaling   | [PixiRenderer.js](src/game/core/PixiRenderer.js#L320-L355)         | 320-355 | Vertical-anchor viewport with atomic updates |
| Camera tracking    | [PixiRenderer.js](src/game/core/PixiRenderer.js#L363-L387)         | 363-387 | Frame-perfect hard-locked camera system      |
| Resize hook        | [useResponsiveCanvas.js](src/hooks/useResponsiveCanvas.js#L24-L56) | 24-56   | Real-time resize with requestAnimationFrame  |
| Game orchestration | [Game.js](src/game/core/Game.js#L592-L596)                         | 592-596 | updateViewport() bridge method               |
| Frame updates      | [Game.js](src/game/core/Game.js#L227-L230)                         | 227-230 | updateCamera() called every frame            |
| Initialization     | [useGame.js](src/hooks/useGame.js#L355-L356)                       | 355-356 | Initial viewport setup after load            |
| UI media queries   | [index.css](src/components/header/index.css)                       | Various | Header/ControlPanel responsive styles        |

#### Entities

| Feature        | File                                             | Lines | Description                          |
| -------------- | ------------------------------------------------ | ----- | ------------------------------------ |
| Base entity    | [BaseEntity.js](src/game/entities/BaseEntity.js) | 1-50  | Abstract base class for all entities |
| Car entity     | [Car.js](src/game/entities/Car.js)               | 1-200 | Car movement + pooling support       |
| Coin entity    | [Coin.js](src/game/entities/Coin.js)             | 1-180 | Silver/gold states + animations      |
| Gate entity    | [Gate.js](src/game/entities/Gate.js)             | 1-150 | Safe zone graphics + isStopped flag  |
| Road entity    | [Road.js](src/game/entities/Road.js)             | 1-100 | Static road background               |
| Scenery entity | [Scenery.js](src/game/entities/Scenery.js)       | 1-100 | Finish line sprite                   |

---

## 10. Single-File Build Architecture

### Zero-Dependency Portable Build

The game is configured to produce a **completely self-contained single HTML file** with all assets embedded as Base64 data URIs. This enables the game to run from any location (USB drive, file system, etc.) without requiring a web server or external dependencies.

### Build Configuration

**Location**: [vite.config.js](vite.config.js)

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile(), // Inlines JS and CSS
  ],
  build: {
    assetsInlineLimit: 100000000, // 100MB - force all assets to Base64
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false, // Single CSS bundle
    rollupOptions: {
      output: {
        inlineDynamicImports: true, // No code splitting
      },
    },
  },
});
```

**Key Settings**:

- **`viteSingleFile`**: Plugin that inlines all JS and CSS into HTML
- **`assetsInlineLimit: 100MB`**: Forces ALL images/assets to Base64 (default is 4KB)
- **`cssCodeSplit: false`**: Prevents CSS from being split into multiple files
- **`inlineDynamicImports: true`**: Prevents code splitting into separate chunks

---

### ESM Asset Import Strategy

All assets are imported as **ESM modules** which Vite automatically converts to Base64 during build.

#### Standard Asset Imports

**Location**: [src/hooks/useGame.js](src/hooks/useGame.js)

```javascript
// PNG images - imported as Base64 data URIs
import startImg from "../assets/start.png";
import finishImg from "../assets/finish.png";
import gateImg from "../assets/gate.png";
import coinImg from "../assets/coin.png";
import carYellowImg from "../assets/car-yellow.png";
// ... etc

// Usage - pass Base64 string directly
await game.renderer.loadTextures([
  { key: "start", url: startImg }, // startImg = "data:image/png;base64,..."
  { key: "finish", url: finishImg },
  // ...
]);
```

**Result**: Each import becomes a Base64 data URI string that's embedded in the JavaScript bundle.

---

### Spine Animation Asset Handling

Spine animations require special handling because they consist of three interconnected files:

- **skeleton.json** - Bone structure and animation data
- **texture.atlas** - Texture atlas mapping
- **texture.png** - Sprite sheet image

#### Spine Imports

```javascript
// Import Spine assets as ESM modules
import chickenSkeletonData from "../assets/chicken.json"; // JSON object
import chickenAtlasText from "../assets/chicken.atlas?raw"; // Raw text string
import chickenTexture from "../assets/chicken.png"; // Base64 data URI
```

**Import Modifiers**:

- **No modifier**: JSON files are parsed automatically
- **`?raw`**: Atlas text files imported as raw string (not parsed)
- **No modifier**: PNG files become Base64 data URIs

#### Manual Texture Resolution

**Location**: [src/game/core/PixiRenderer.js](src/game/core/PixiRenderer.js)

The `loadSpineFromImports()` method manually resolves atlas texture references:

```javascript
async loadSpineFromImports(key, skeletonData, atlasText, textureUrl) {
  // 1. Load the PNG texture first
  const textureKey = `${key}_texture`;
  Assets.add({ alias: textureKey, src: textureUrl });  // textureUrl is Base64
  await Assets.load(textureKey);

  // 2. Register skeleton data directly
  const skeletonKey = `${key}_skeleton`;
  Assets.add({ alias: skeletonKey, src: skeletonData });

  // 3. Create a Blob URL for the atlas text
  const atlasBlob = new Blob([atlasText], { type: 'text/plain' });
  const atlasBlobUrl = URL.createObjectURL(atlasBlob);

  // 4. Register atlas with metadata mapping texture references
  const atlasKey = `${key}_atlas`;
  Assets.add({
    alias: atlasKey,
    src: atlasBlobUrl,
    data: {
      images: {
        // Map atlas PNG reference to our loaded Base64 texture
        'chicken.png': textureKey,
        'chicken': textureKey,
      }
    }
  });

  // 5. Load all assets
  await Assets.load([skeletonKey, atlasKey]);

  // 6. Clean up blob URL
  URL.revokeObjectURL(atlasBlobUrl);

  return { skeleton: skeletonKey, atlas: atlasKey };
}
```

**Why This is Needed**:

- Spine atlas files normally reference PNG files by filename (e.g., `chicken.png`)
- In a Base64 build, there are no filenames - just data URIs in memory
- We manually tell PixiJS: "When the atlas asks for `chicken.png`, use this Base64 texture"

---

### Asset Migration Strategy

#### Before (URL-based Loading)

```javascript
// ❌ OLD: Assets loaded from public/ directory via URLs
const chickenKeys = await game.renderer.loadSpineAnimation(
  "chicken",
  "./chicken.json", // Public URL
  "./chicken.atlas", // Public URL
);
```

**Problems**:

- Assets remain as separate files
- Requires web server to serve files
- Build produces `dist/assets/` folder with external files
- Won't work when opened directly from file system

#### After (ESM Import-based)

```javascript
// ✅ NEW: Assets imported as ESM modules
import chickenSkeletonData from "../assets/chicken.json";
import chickenAtlasText from "../assets/chicken.atlas?raw";
import chickenTexture from "../assets/chicken.png";

const chickenKeys = await game.renderer.loadSpineFromImports(
  "chicken",
  chickenSkeletonData, // JSON object in memory
  chickenAtlasText, // String in memory
  chickenTexture, // Base64 data URI in memory
);
```

**Benefits**:

- All assets embedded in single HTML file
- No external dependencies
- Works offline, from USB, from file system
- Portable across any environment

---

### Build Verification

#### Run Build

```bash
npm run build
```

**Expected Output**:

```
✓ 861 modules transformed.
[plugin vite:singlefile] Inlining: index-XXX.js
[plugin vite:singlefile] Inlining: style-XXX.css
dist/index.html  5.8 MB │ gzip: 2.28 MB
✓ built in 7.17s
```

#### Verify Single-File Build

```bash
# Check for Base64 embedded images
grep -c "data:image/png;base64" dist/index.html
# Output: 4 (or more - one per image asset)

# Check for embedded favicon
grep -c "data:image/x-icon;base64" dist/index.html
# Output: 1

# Verify no external asset references
grep -c 'src="assets' dist/index.html
# Output: 0 (should be zero!)

# Check file size
ls -lh dist/index.html
# Output: -rw-r--r-- 5.8M (contains all game assets + favicon)
```

#### Test the Build

1. **Open dist/index.html directly in browser** (no web server needed)
2. **Verify PixiJS loads without "Texture Not Found" errors**
3. **Check browser console for any 404 errors** (should be none)
4. **Test chicken animation loads and plays correctly**

---

### Favicon Embedding

The favicon is embedded directly into [index.html](index.html) as a Base64 data URI, eliminating the need for an external `favicon.ico` file in the build.

#### Implementation

**Location**: [index.html](index.html#L5)

```html
<link
  rel="icon"
  type="image/x-icon"
  href="data:image/x-icon;base64,AAABAA..."
/>
```

#### How It Was Done

The favicon was converted from a binary `.ico` file to a Base64-encoded string and embedded directly in the HTML:

```python
import base64

# Read favicon
with open('public/favicon.ico', 'rb') as f:
    favicon_data = base64.b64encode(f.read()).decode('ascii')

# Embed in HTML
<link rel="icon" type="image/x-icon" href="data:image/x-icon;base64,{favicon_data}" />
```

#### Benefits

- **No external file** - Favicon loads instantly with the HTML
- **Single-file deployment** - No need to copy multiple files
- **No 404 errors** - Favicon always available
- **Works offline** - No separate HTTP request needed

#### File Size Impact

- **Before**: 5.3 MB (without embedded favicon)
- **After**: 5.8 MB (with embedded favicon)
- **Increase**: ~500 KB (the favicon Base64 encoding overhead)
- **Gzipped**: 2.28 MB (minimal impact when compressed)

#### Updating the Favicon

To change the favicon:

1. **Replace the favicon** in `public/favicon.ico` (if restoring for dev)
2. **Re-encode to Base64**:
   ```bash
   base64 public/favicon.ico | tr -d '\n'
   ```
3. **Update index.html** manually with the new Base64 string, or use the Python script:

   ```python
   import base64

   with open('public/favicon.ico', 'rb') as f:
       favicon_data = base64.b64encode(f.read()).decode('ascii')

   # Update the href attribute in index.html
   # href="data:image/x-icon;base64,{favicon_data}"
   ```

#### Verification

After building, verify the favicon is embedded:

```bash
# Check for embedded favicon
grep -c "data:image/x-icon;base64" dist/index.html
# Output: 1

# Verify no external favicon file
ls dist/favicon.ico
# Output: No such file or directory (expected)
```

---

### Deployment Options

#### Option 1: Static Host (Vercel, Netlify, GitHub Pages)

```bash
# Just upload the single HTML file
# No build or configuration needed on the host
```

#### Option 2: File System

```bash
# Copy dist/index.html anywhere
cp dist/index.html ~/Desktop/game.html

# Open directly in browser
open ~/Desktop/game.html  # macOS
# or double-click in file explorer
```

#### Option 3: USB Drive

```bash
# Copy to USB drive
cp dist/index.html /Volumes/USB_DRIVE/

# Game runs directly from USB without installation
```

#### Option 4: Email/Download

- File size: ~5MB (with gzip compression: ~2.2MB)
- Can be emailed or downloaded
- Opens in any modern browser
- No installation required

---

### Performance Considerations

#### Initial Load Time

- **5.8MB HTML file** loads in ~1-3 seconds on broadband
- **Base64 decoding** happens instantly in browser
- **No additional HTTP requests** for assets (including favicon)
- **Total assets bundled**: ~30 images + 3 Spine files + 1 favicon

#### Runtime Performance

- **Zero difference** from external assets once loaded
- Base64 decoding is highly optimized in modern browsers
- Assets cached in memory same as external files
- WebGL rendering performance unchanged

#### Trade-offs

**Pros**:

- ✅ True zero-dependency deployment (including favicon)
- ✅ Works offline/file system/USB
- ✅ Single file is easier to manage
- ✅ No CORS issues
- ✅ Faster total page load (no waterfall of asset requests)
- ✅ No missing favicon 404 errors

**Cons**:

- ❌ Larger initial HTML download (5.8MB vs ~100KB HTML + separate assets)
- ❌ Cannot leverage browser cache between versions (entire file re-downloads)
- ❌ Harder to CDN-optimize individual assets
- ❌ File size limit for email attachments (~10MB typical limit)

---

### Troubleshooting Single-File Build

#### Issue: "Texture Not Found" Errors

**Cause**: Asset not properly imported or Spine atlas texture resolution failed

**Solution**:

1. Verify all assets are in `src/assets/` (not `public/`)
2. Check ESM imports use correct paths
3. For Spine, ensure manual texture mapping in `loadSpineFromImports()`

#### Issue: Build Has External Assets Folder

**Cause**: Assets still referenced by string URLs instead of imports

**Solution**:

1. Search code for `"./assets/"` or `"/assets/"` strings
2. Replace with ESM imports: `import asset from "../assets/file.png"`
3. Pass imported variable (not string) to loading functions

#### Issue: Spine Animation Doesn't Load

**Cause**: Atlas texture reference not resolved

**Solution**:

1. Verify `.atlas` file imported with `?raw` modifier
2. Check `loadSpineFromImports()` maps atlas PNG references correctly
3. Ensure texture loaded BEFORE atlas registration

#### Issue: Build File Too Large (>10MB)

**Cause**: Too many high-resolution assets

**Solution**:

1. Optimize PNG files with tools like TinyPNG
2. Convert large PNGs to JPG where transparency not needed
3. Reduce texture atlas resolution
4. Consider splitting into multiple bundles if absolutely necessary

---

## Summary for AI Engineer

**Document Version**: 3.0  
**Last Updated**: [Current Date]  
**Status**: Production-Ready with Zero-Dependency Single-File Build

This document represents the complete technical architecture including:

- **Game state lifecycle and user actions** (Section 1-2)
- **Collision detection and win/loss mechanics** (Section 3)
- **Project structure, tech stack, and critical implementation details** (Section 4-6)
- **Canvas rendering and animation systems** - PixiJS v8 + Spine skeletal animations (Section 7)
- **Responsiveness system** - Current implementation + future roadmap (Section 8)
- **Frontend architecture patterns** - Entity-Component, Manager, System, Event Bus, Callbacks (Section 9)
- **Single-file build architecture** - Zero-dependency ESM asset embedding with Base64 (Section 10)

All game mechanics, animation systems, rendering pipeline, architectural patterns, and deployment strategies are fully documented and production-ready.

### Key Deployment Features

The game produces a **completely self-contained 5.3MB HTML file** with:

- All PNG/JSON assets embedded as Base64 data URIs
- Spine animations (skeleton, atlas, textures) bundled via ESM imports
- Zero external dependencies or network requests
- Works offline from USB drive, file system, or any static host
- No CORS issues, no 404 errors, no missing assets

Build verification: `npm run build` → single `dist/index.html` file ready for deployment anywhere.
