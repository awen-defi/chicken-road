# 🐔 Chicken Road Game - Complete Technical Documentation

**Project Hand-off Document for AI Engineer**

---

## 📋 Table of Contents

1. [Game State Lifecycle](#1-game-state-lifecycle)
2. [User Actions Mapping](#2-user-actions-mapping)
3. [Collision & Win/Loss Mechanics](#3-collision--winloss-mechanics)
4. [Project Structure](#4-project-structure)
5. [Tech Stack Integration](#5-tech-stack-integration)
6. [Critical Implementation Details](#6-critical-implementation-details)

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

### React + PixiJS Architecture

The game uses a **hybrid architecture** combining React for UI state and PixiJS for game rendering.

```
┌───────────────────────────────────────────────────────────────┐
│                      REACT LAYER (UI)                         │
│                                                               │
│  App.jsx                                                      │
│  ├── State Management                                        │
│  │   ├── gameState (idle/playing/won/lost)                   │
│  │   ├── balance (financial calculations)                    │
│  │   └── betAmount (user input)                              │
│  │                                                            │
│  ├── UI Components                                           │
│  │   ├── Header (balance display)                            │
│  │   ├── ControlPanel (buttons, bet input)                   │
│  │   └── GameArea (canvas container)                         │
│  │                                                            │
│  └── Game Orchestration                                      │
│      ├── handlePlay() - Start/Jump                           │
│      ├── handleCollision() - Death sequence                  │
│      ├── handleCashout() - Manual exit                       │
│      └── triggerWinSequence() - Victory                      │
│                                                               │
└─────────────────────────▼─────────────────────────────────────┘
                          │
                          │ useGame() Hook
                          │ (Bridge Layer)
                          │
┌─────────────────────────▼─────────────────────────────────────┐
│                    PIXI.JS LAYER (Game)                       │
│                                                               │
│  Game.js                                                      │
│  ├── PixiJS Application                                      │
│  │   ├── WebGL Renderer                                      │
│  │   ├── Stage Container                                     │
│  │   ├── Ticker (60 FPS)                                     │
│  │   └── Texture Loading                                     │
│  │                                                            │
│  ├── Game Systems                                            │
│  │   ├── EntityManager (entities lifecycle)                  │
│  │   ├── CarSpawner (spawning, collision)                    │
│  │   ├── CoinManager (visibility, multiplier)                │
│  │   └── GateManager (safe zone logic)                       │
│  │                                                            │
│  └── Entities (PixiJS Containers)                            │
│      ├── Chicken (Spine animation)                           │
│      ├── Car (sprite + movement)                             │
│      ├── Coin (sprite + effects)                             │
│      ├── Gate (graphics)                                     │
│      ├── Road (graphics)                                     │
│      └── Scenery (finish line)                               │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

### Communication Bridge

#### **React → PixiJS** (Commands)

```javascript
// Via useGame hook context
const gameContext = useGame(canvasRef);

// 1. Start Game
gameRef.current.state = "playing";

// 2. Jump Chicken
gameContext.jumpChicken(onFinishCallback);

// 3. Stop Game
gameContext.stopGame();

// 4. Get Game State
const multiplier = gameRef.current.coinManager.getCurrentMultiplier();
```

#### **PixiJS → React** (Events)

```javascript
// 1. Collision Event
carSpawner.onCollision = () => {
  handleCollision(); // Call React handler
};

// 2. Jump Complete Event
chicken.jumpTo(x, y, () => {
  triggerWinSequence(); // Call React handler
});

// 3. Death Complete Event
game.handleChickenDeath(() => {
  cleanupAfterDeath(); // Call React handler
});
```

---

### Global Game Instance

```javascript
// In useGame.js
window.__GAME_INSTANCE__ = gameRef.current;

// Access from anywhere
const game = window.__GAME_INSTANCE__;
```

⚠️ **Warning**: Use for debugging only, not production code

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

## 🎯 Summary for AI Engineer

### Key Takeaways

1. **Dual State System**: React manages UI/financial, PixiJS manages rendering/gameplay
2. **Callback Architecture**: Chicken entity triggers automatic win via onComplete callback
3. **World Space Coordinates**: Always use `getBounds()` for collision detection
4. **Currency Precision**: Use `roundCurrency()` for ALL financial calculations
5. **Object Pooling**: 30 pre-allocated cars for performance
6. **Gate System**: Safe zones with `isStopped` flag for collision exclusion
7. **Auto-Sequences**: Both win (3s) and loss (2-3s) auto-reset to idle
8. **Car Momentum**: Cars continue moving during death animation
9. **PixiJS v8 API**: Use new graphics API (`setStrokeStyle`, `rect().stroke()`)
10. **Dynamic Safe Zones**: Spawn cars only ahead of chicken

### Critical Code Locations

| Feature            | File                                                         | Lines   |
| ------------------ | ------------------------------------------------------------ | ------- |
| State machine      | [App.jsx](src/App.jsx)                                       | 1-225   |
| Currency helper    | [App.jsx](src/App.jsx#L9-L11)                                | 9-11    |
| Play button logic  | [App.jsx](src/App.jsx#L41-L118)                              | 41-118  |
| Collision handler  | [App.jsx](src/App.jsx#L127-L137)                             | 127-137 |
| Win sequence       | [App.jsx](src/App.jsx#L83-L113)                              | 83-113  |
| Jump with callback | [useGame.js](src/hooks/useGame.js#L290-L377)                 | 290-377 |
| Game loop          | [Game.js](src/game/core/Game.js#L117-L166)                   | 117-166 |
| Death sequence     | [Game.js](src/game/core/Game.js#L158-L200)                   | 158-200 |
| AABB collision     | [CarSpawner.js](src/game/systems/CarSpawner.js#L540-L570)    | 540-570 |
| Chicken callback   | [Chicken.js](src/game/entities/Chicken.js#L166-L239)         | 166-239 |
| Final coin fix     | [CoinManager.js](src/game/managers/CoinManager.js#L285-L313) | 285-313 |

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Status**: Production-Ready

This document represents the complete technical architecture as of the latest implementation. All win/loss sequences, collision detection, and financial calculations are functioning as designed.
