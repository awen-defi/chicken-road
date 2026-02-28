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
9. [Responsiveness System](#8-responsiveness-system)
10. [Frontend Architecture Patterns](#9-frontend-architecture-patterns)

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

- [Responsiveness System](#8-responsiveness-system) - Current state and implementation plan
- [Canvas Sizing Strategy](#canvas-sizing-strategy) - Fixed-size canvas details

**For Architecture Understanding**:

- [Frontend Architecture Patterns](#9-frontend-architecture-patterns) - Design patterns used
- [Tech Stack Integration](#5-tech-stack-integration) - React + PixiJS communication

**For Debugging**:

- [Critical Implementation Details](#6-critical-implementation-details) - Common gotchas and fixes
- [Critical Code Locations](#critical-code-locations) - Quick file/line reference

### Common Tasks Quick Links

| Task                   | Key Files                                                                                                                    | Key Functions                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Add new game state     | [App.jsx](src/App.jsx), [Game.js](src/game/core/Game.js)                                                                     | `handlePlay()`, `update()`                                            |
| Modify jump behavior   | [Chicken.js](src/game/entities/Chicken.js), [useGame.js](src/hooks/useGame.js)                                               | `jumpTo()`, `jumpChicken()`                                           |
| Adjust collision       | [CarSpawner.js](src/game/systems/CarSpawner.js)                                                                              | `checkCarChickenCollision()`                                          |
| Change spawn timing    | [CarSpawner.js](src/game/systems/CarSpawner.js)                                                                              | `spawnCar()`, `update()`                                              |
| Add new animation      | [Chicken.js](src/game/entities/Chicken.js)                                                                                   | `setSpine()`, Spine state calls                                       |
| Make canvas responsive | [CanvasGameArea.jsx](src/components/GameArea/CanvasGameArea.jsx), [useResponsiveCanvas.js](src/hooks/useResponsiveCanvas.js) | See [Responsive Implementation Plan](#responsive-implementation-plan) |
| Modify multipliers     | [CoinManager.js](src/game/managers/CoinManager.js)                                                                           | `getCurrentMultiplier()`                                              |
| Add new entity         | [entities/](src/game/entities/)                                                                                              | Extend [BaseEntity.js](src/game/entities/BaseEntity.js)               |

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

**Result**:

- Canvas maintains fixed aspect ratio
- Fills container height
- Crops horizontally if container is narrower
- **NOT responsive** - doesn't adapt to viewport changes

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

## 8. Responsiveness System

### Current Implementation Status

⚠️ **IMPORTANT**: The game canvas is **NOT fully responsive** yet.

#### What IS Responsive

**UI Components** use standard CSS media queries:

**Header** ([src/components/header/index.css](src/components/header/index.css)):

```css
.header {
  height: 49px;
  padding: 8px 22px;
}

@media (max-width: 768px) {
  .header {
    padding: 6px 16px; /* Reduced padding on mobile */
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
    min-height: 300px; /* Shorter on mobile */
  }

  .chicken-position {
    transform: scale(0.65); /* Scale down chicken indicator */
  }
}

@media (min-width: 1024px) {
  .road-vertical {
    padding: 20px 32px; /* More padding on desktop */
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
    flex-direction: column; /* Stack vertically on mobile */
    gap: 12px;
    padding: 16px;
  }
}
```

---

#### What is NOT Responsive

**Canvas Rendering** is **fixed-size**:

**Current Canvas Strategy**:

```javascript
// In useGame.js - fixed size calculation
const totalWidth = startWidth + roadWidth + finishWidth / 2;
const totalHeight = Math.max(roadHeight, finishHeight);

// Set canvas to exact pixel dimensions
game.resize(totalWidth, totalHeight);
```

**Canvas CSS** ([src/components/GameArea/CanvasGameArea.css](src/components/GameArea/CanvasGameArea.css)):

```css
#game-canvas {
  height: 100%; /* Fill container height */
  width: auto; /* Maintain aspect ratio */
  display: block;
}
```

**Problems**:

1. Canvas has fixed pixel dimensions (e.g., 1200x600)
2. On small screens, canvas is cropped horizontally
3. On large screens, canvas is upscaled with loss of quality
4. Lane widths, entity sizes don't scale with viewport
5. World offset calculations assume fixed canvas size

---

### Available Hook (NOT Currently Used)

There's a **prepared hook** for responsive canvas, but it's **not connected** yet.

**Location**: [src/hooks/useResponsiveCanvas.js](src/hooks/useResponsiveCanvas.js)

```javascript
/**
 * Responsive Canvas Hook
 * - Listens for window resize
 * - Maintains aspect ratio
 * - Calls game.resize() with new dimensions
 * - Can be configured for responsive behavior
 */

export function useResponsiveCanvas(
  canvasRef,
  containerRef,
  gameRef,
  options = {},
) {
  const {
    maintainAspectRatio = true,
    aspectRatio = 16 / 9,
    onResize = null,
  } = options;

  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      const game = gameRef.current;

      if (!container || !canvas) return;

      let width = container.clientWidth;
      let height = container.clientHeight;

      // Calculate constrained dimensions
      if (maintainAspectRatio) {
        const containerRatio = width / height;

        if (containerRatio > aspectRatio) {
          // Container wider than aspect ratio
          width = height * aspectRatio;
        } else {
          // Container taller than aspect ratio
          height = width / aspectRatio;
        }
      }

      // Update canvas CSS
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Update PixiJS renderer
      if (game && typeof game.resize === "function") {
        game.resize(width, height);
      }

      // Custom resize callback
      if (onResize) {
        onResize(width, height);
      }
    };

    // Listen for resize
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial size

    return () => window.removeEventListener("resize", handleResize);
  }, [
    canvasRef,
    containerRef,
    gameRef,
    maintainAspectRatio,
    aspectRatio,
    onResize,
  ]);
}
```

**Why Not Used?**:

- Game entities (lanes, chicken, cars) use **fixed pixel positions**
- World offset calculations assume **fixed canvas width**
- Collision detection uses **absolute pixel coordinates**
- Coin positions are **pre-calculated** for fixed canvas

**To Make Game Responsive**, you would need to:

1. Use the `useResponsiveCanvas` hook in CanvasGameArea
2. **Scale all entity positions** based on canvas size
3. **Recalculate lane positions** dynamically
4. **Update world offset** calculations for variable canvas width
5. **Scale entity sprites** proportionally
6. **Recalculate collision bounds** for new scale

---

### Responsive Implementation Plan

If you want to make the canvas fully responsive:

#### Step 1: Connect the Hook

```javascript
// In CanvasGameArea.jsx

import { useResponsiveCanvas } from "../../hooks/useResponsiveCanvas";

export default function CanvasGameArea(
  {
    /* ... */
  },
) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const gameRef = useRef(null);

  // Connect useGame hook
  const { isLoading /* ... */ } = useGame(canvasRef, config, containerRef);

  // Store game reference
  gameRef.current = window.__GAME_INSTANCE__;

  // Add responsive canvas hook
  useResponsiveCanvas(canvasRef, containerRef, gameRef, {
    maintainAspectRatio: true,
    aspectRatio: 2.5, // Landscape game
    onResize: (width, height) => {
      // Recalculate game layout
      recalculateGameLayout(width, height);
    },
  });

  // ...
}
```

#### Step 2: Dynamic Lane Positions

```javascript
/**
 * Recalculate entity positions based on canvas size
 */

function recalculateGameLayout(canvasWidth, canvasHeight) {
  const game = window.__GAME_INSTANCE__;
  if (!game) return;

  // Calculate new lane width
  const startWidth = game.startScenery.width;
  const finishWidth = game.finishScenery.width;
  const roadWidth = canvasWidth - startWidth - finishWidth;
  const laneWidth = roadWidth / game.coinManager.totalLanes;

  // Update lane width globally
  game.laneWidth = laneWidth;
  game.carSpawner.laneWidth = laneWidth;
  game.coinManager.laneWidth = laneWidth;

  // Reposition coins
  game.coinManager.coins.forEach((coin, index) => {
    const laneX = startWidth + index * laneWidth + laneWidth / 2;
    coin.container.x = laneX;
  });

  // Reposition gates
  game.gateManager.gates.forEach((gate, index) => {
    const laneX = startWidth + index * laneWidth + laneWidth / 2;
    gate.container.x = laneX;
  });

  // Update chicken position
  const chickenLaneIndex = game.coinManager.currentLaneIndex;
  const chickenX = startWidth + chickenLaneIndex * laneWidth + laneWidth / 2;
  game.chicken.x = chickenX;

  // Recalculate world offset
  const worldOffset = calculateWorldOffset(canvasWidth, chickenX);
  game.stage.x = -worldOffset;
}
```

#### Step 3: Scale Entities

```javascript
/**
 * Scale entity sprites based on canvas size
 */

function scaleEntities(canvasWidth, canvasHeight) {
  const game = window.__GAME_INSTANCE__;
  if (!game) return;

  // Calculate scale factor (relative to baseline 1200px width)
  const baselineWidth = 1200;
  const scaleFactor = canvasWidth / baselineWidth;

  // Scale chicken
  game.chicken.container.scale.set(scaleFactor);

  // Scale cars
  game.carSpawner.activeCars.forEach((car) => {
    car.container.scale.set(scaleFactor);
  });

  // Scale coins
  game.coinManager.coins.forEach((coin) => {
    coin.container.scale.set(scaleFactor);
  });

  // Scale gates
  game.gateManager.gates.forEach((gate) => {
    gate.container.scale.set(scaleFactor);
  });
}
```

#### Step 4: Update Collision Detection

```javascript
/**
 * Collision detection already uses getBounds()
 * which automatically accounts for scale changes
 * - No changes needed to collision logic!
 */

// In CarSpawner.checkCarChickenCollision()
const carWorldBounds = car.container.getBounds(); // ✅ Accounts for scale
const chickenWorldBounds = this.chicken.container.getBounds(); // ✅ Accounts for scale
```

---

### Breakpoint Strategy

Recommended responsive breakpoints:

```css
/* Mobile (portrait phones) */
@media (max-width: 640px) {
  /* Minimum canvas width: 400px */
  /* Scale factor: 0.33 */
  /* Stack UI vertically */
}

/* Tablet (landscape phones, portrait tablets) */
@media (min-width: 641px) and (max-width: 1024px) {
  /* Canvas width: 600-900px */
  /* Scale factor: 0.5-0.75 */
  /* Hybrid layout */
}

/* Desktop (landscape tablets, desktops) */
@media (min-width: 1025px) {
  /* Canvas width: 1000-1400px */
  /* Scale factor: 0.83-1.16 */
  /* Full layout */
}

/* Large Desktop (big monitors) */
@media (min-width: 1920px) {
  /* Canvas width: 1600px max */
  /* Scale factor: 1.33 max */
  /* Centered with max width */
}
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
26. **Canvas NOT Responsive**: Fixed-size canvas with CSS scaling (useResponsiveCanvas hook available but not used)
27. **Event Bus Available**: GameEventBus for pub/sub communication (prepared but minimal usage)
28. **Global Game Instance**: `window.__GAME_INSTANCE__` for debugging access

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

#### Responsiveness (Not Yet Implemented)

| Feature          | File                                                             | Lines   | Description                               |
| ---------------- | ---------------------------------------------------------------- | ------- | ----------------------------------------- |
| Responsive hook  | [useResponsiveCanvas.js](src/hooks/useResponsiveCanvas.js)       | 1-80    | Available but NOT connected to canvas     |
| Canvas setup     | [CanvasGameArea.jsx](src/components/GameArea/CanvasGameArea.jsx) | 1-100   | Fixed-size canvas (needs responsive impl) |
| UI media queries | [index.css](src/components/header/index.css)                     | Various | Header/ControlPanel responsive styles     |

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

**Document Version**: 2.0  
**Last Updated**: February 28, 2026  
**Status**: Production-Ready with Comprehensive Architecture Documentation

This document represents the complete technical architecture including detailed coverage of:

- Game state lifecycle and user actions
- Collision detection and win/loss mechanics
- Canvas rendering and animation systems (PixiJS v8 + Spine)
- Responsiveness system (current implementation + future roadmap)
- Frontend architecture patterns (Entity-Component, Manager, System, Event Bus, Callbacks)
- Critical implementation details and gotchas

All game mechanics, animation systems, rendering pipeline, and architectural patterns are fully documented and production-ready.
