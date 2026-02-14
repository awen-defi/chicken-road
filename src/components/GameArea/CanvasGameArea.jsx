import { useRef, useEffect, useState } from "react";
import { GAME_CONFIG, DIFFICULTY_SETTINGS } from "../../config/gameConfig";
import "./CanvasGameArea.css";

export function CanvasGameArea({
  gameState,
  difficulty,
  onGameOver,
  onCoinCollect,
  onJump,
}) {
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const gameDataRef = useRef({
    chicken: {
      x: GAME_CONFIG.chicken.startX,
      y: GAME_CONFIG.chicken.startY,
      currentLane: 0,
      isJumping: false,
      jumpProgress: 0,
      animFrame: 0,
      lastFrameTime: 0,
    },
    background: {
      scrollY: 0,
      roadY: 0,
    },
    cars: [],
    coins: [],
    lastCarSpawn: 0,
    score: 0,
  });

  const [notification, setNotification] = useState(null);

  // Draw chicken sprite (improved animation)
  const drawChicken = (ctx, gameData) => {
    const chicken = gameData.chicken;
    const config = GAME_CONFIG.chicken;

    // Calculate animation frame
    const now = Date.now();
    if (now - chicken.lastFrameTime > config.frameRate) {
      if (chicken.isJumping) {
        chicken.animFrame = (chicken.animFrame + 1) % config.jumpFrames;
      } else {
        chicken.animFrame = (chicken.animFrame + 1) % config.idleFrames;
      }
      chicken.lastFrameTime = now;
    }

    // Draw chicken shadow
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.ellipse(
      chicken.x + config.width / 2,
      chicken.y + config.height,
      config.width / 3,
      config.height / 6,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // For now, draw a placeholder chicken (will be replaced with actual sprite)
    ctx.save();
    
    // Jumping effect
    let jumpOffset = 0;
    if (chicken.isJumping) {
      // Smooth jump arc
      const progress = chicken.jumpProgress;
      jumpOffset = Math.sin(progress * Math.PI) * GAME_CONFIG.jumpHeight;
    }

    // Draw chicken body
    ctx.translate(chicken.x + config.width / 2, chicken.y - jumpOffset + config.height / 2);
    
    // Add idle animation wobble
    if (!chicken.isJumping) {
      const wobble = Math.sin(chicken.animFrame * 0.5) * 3;
      ctx.rotate(wobble * Math.PI / 180);
    }

    // Body
    ctx.fillStyle = "#FEFEFE";
    ctx.strokeStyle = "#2a2a2a";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, config.width / 2.5, config.height / 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Head
    ctx.beginPath();
    ctx.arc(-5, -config.height / 3, config.width / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eye (blinking animation)
    const shouldBlink = chicken.animFrame % 20 === 0;
    if (!shouldBlink) {
      ctx.fillStyle = "#2C3E50";
      ctx.beginPath();
      ctx.arc(-2, -config.height / 3 - 3, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Beak
    ctx.fillStyle = "#F39C12";
    ctx.beginPath();
    ctx.moveTo(-config.width / 3, -config.height / 3);
    ctx.lineTo(-config.width / 2, -config.height / 3 + 2);
    ctx.lineTo(-config.width / 3, -config.height / 3 + 4);
    ctx.closePath();
    ctx.fill();

    // Comb
    ctx.fillStyle = "#E74C3C";
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      ctx.arc(-10 + i * 5, -config.height / 2.5, 4, 0, Math.PI * 2);
    }
    ctx.fill();

    // Wing (flapping animation)
    const wingFlap = !chicken.isJumping
      ? Math.sin(chicken.animFrame * 0.3) * 5
      : 20;
    ctx.save();
    ctx.translate(config.width / 5, 5);
    ctx.rotate(wingFlap * Math.PI / 180);
    ctx.beginPath();
    ctx.ellipse(0, 0, config.width / 4, config.height / 3, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = "#F8F8F8";
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Tail feathers
    ctx.fillStyle = "#F8F8F8";
    ctx.beginPath();
    ctx.moveTo(config.width / 3, 0);
    ctx.quadraticCurveTo(config.width / 2, -5, config.width / 2.5, 5);
    ctx.quadraticCurveTo(config.width / 2, 0, config.width / 3, 0);
    ctx.fill();
    ctx.stroke();

    // Feet
    ctx.strokeStyle = "#F39C12";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    // Left foot
    ctx.beginPath();
    ctx.moveTo(-5, config.height / 3);
    ctx.lineTo(-10, config.height / 2);
    ctx.stroke();
    // Right foot  
    ctx.beginPath();
    ctx.moveTo(5, config.height / 3);
    ctx.lineTo(10, config.height / 2);
    ctx.stroke();

    ctx.restore();
  };

  // Draw scrolling background
  const drawBackground = (ctx, gameData) => {
    const { scrollY } = gameData.background;
    
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.height);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#E0F6FF");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    // Ground/grass on sides with scrolling
    ctx.fillStyle = "#8bc34a";
    const laneWidth = GAME_CONFIG.width * 0.5;
    const laneX = (GAME_CONFIG.width - laneWidth) / 2;

    // Left grass
    ctx.fillRect(0, 0, laneX, GAME_CONFIG.height);
    // Right grass
    ctx.fillRect(laneX + laneWidth, 0, laneX, GAME_CONFIG.height);

    // Road with scrolling pattern
    ctx.fillStyle = "#5a5a5a";
    ctx.fillRect(laneX, 0, laneWidth, GAME_CONFIG.height);

    // Road markings (scrolling)
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 20]);

    for (let i = 0; i < GAME_CONFIG.laneCount + 1; i++) {
      const y = (i * GAME_CONFIG.laneHeight - scrollY) % (GAME_CONFIG.height + GAME_CONFIG.laneHeight);
      ctx.beginPath();
      ctx.moveTo(laneX, y);
      ctx.lineTo(laneX + laneWidth, y);
      ctx.stroke();
    }

    // Center dashed line (scrolling)
    ctx.setLineDash([15, 15]);
    ctx.lineDashOffset = scrollY % 30;
    ctx.beginPath();
    ctx.moveTo(laneX + laneWidth / 2, 0);
    ctx.lineTo(laneX + laneWidth / 2, GAME_CONFIG.height);
    ctx.stroke();

    ctx.setLineDash([]);
  };

  // Draw cars
  const drawCar = (ctx, car) => {
    ctx.save();
    ctx.translate(car.x + car.width / 2, car.y + car.height / 2);

    // Car body
    ctx.fillStyle = car.color || "#e74c3c";
    ctx.strokeStyle = "#c0392b";
    ctx.lineWidth = 2;

    // Main body
    ctx.beginPath();
    ctx.roundRect(-car.width / 2, -car.height / 2, car.width, car.height, 8);
    ctx.fill();
    ctx.stroke();

    // Roof
    ctx.fillStyle = "#c0392b";
    ctx.beginPath();
    ctx.roundRect(-car.width / 3, -car.height / 2.5, car.width * 0.66, car.height / 2, 5);
    ctx.fill();
    ctx.stroke();

    // Windows
    ctx.fillStyle = "#5dade2";
    ctx.fillRect(-car.width / 4, -car.height / 3, car.width / 6, car.height / 4);
    ctx.fillRect(car.width / 12, -car.height / 3, car.width / 6, car.height / 4);

    // Wheels
    ctx.fillStyle = "#2c3e50";
    ctx.beginPath();
    ctx.arc(-car.width / 3, car.height / 2, 8, 0, Math.PI * 2);
    ctx.arc(car.width / 3, car.height / 2, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // Draw coin
  const drawCoin = (ctx, coin) => {
    ctx.save();
    ctx.translate(coin.x + coin.width / 2, coin.y + coin.height / 2);
    ctx.rotate(coin.rotation);

    // Coin glow
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coin.width / 2 + 5);
    gradient.addColorStop(0, "rgba(255, 215, 0, 0.8)");
    gradient.addColorStop(1, "rgba(255, 215, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, coin.width / 2 + 5, 0, Math.PI * 2);
    ctx.fill();

    // Coin body
    ctx.fillStyle = "#FFD700";
    ctx.strokeStyle = "#FFA500";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, coin.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Dollar sign
    ctx.fillStyle = "#FFA500";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("$", 0, 0);

    ctx.restore();
  };

  // Check collision
  const checkCollision = (obj1, obj2) => {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  };

  // Game loop
  const gameLoop = () => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    const gameData = gameDataRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    // Draw background
    drawBackground(ctx, gameData);

    // Update and draw cars
    gameData.cars.forEach((car, index) => {
      car.y += car.speed;
      drawCar(ctx, car);

      // Check collision with chicken
      if (
        gameState === "playing" &&
        !gameData.chicken.isJumping &&
        checkCollision(gameData.chicken, car)
      ) {
        onGameOver();
        showNotification("Game Over!", "lost");
      }

      // Remove cars that are off screen
      if (car.y > GAME_CONFIG.height) {
        gameData.cars.splice(index, 1);
      }
    });

    // Update and draw coins
    gameData.coins.forEach((coin, index) => {
      coin.rotation += GAME_CONFIG.coin.rotationSpeed;
      drawCoin(ctx, coin);

      // Check collision with chicken
      if (checkCollision(gameData.chicken, coin)) {
        gameData.coins.splice(index, 1);
        onCoinCollect(coin.value);
        showNotification(`+${coin.value} Coins!`, "win");
      }
    });

    // Draw chicken
    drawChicken(ctx, gameData);

    // Update jump animation
    if (gameData.chicken.isJumping) {
      gameData.chicken.jumpProgress += 0.05;
      if (gameData.chicken.jumpProgress >= 1) {
        gameData.chicken.isJumping = false;
        gameData.chicken.jumpProgress = 0;
        gameData.chicken.currentLane++;
      }
    }

    // Scroll background when playing
    if (gameState === "playing" && gameData.chicken.isJumping) {
      gameData.background.scrollY += GAME_CONFIG.scrollSpeed;
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  // Show notification
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 2000);
  };

  // Start game loop
  useEffect(() => {
    const loop = () => {
      gameLoop();
      gameLoopRef.current = requestAnimationFrame(loop);
    };
    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, difficulty]);

  // Spawn cars
  useEffect(() => {
    if (gameState !== "playing") return;

    const settings = DIFFICULTY_SETTINGS[difficulty];
    const interval = setInterval(() => {
      if (Math.random() < settings.carSpawnChance) {
        const laneWidth = GAME_CONFIG.width * 0.5;
        const laneX = (GAME_CONFIG.width - laneWidth) / 2;
        const randomX = laneX + Math.random() * (laneWidth - GAME_CONFIG.car.width);

        gameDataRef.current.cars.push({
          x: randomX,
          y: -GAME_CONFIG.car.height,
          width: GAME_CONFIG.car.width,
          height: GAME_CONFIG.car.height,
          speed: settings.carSpeed,
          color: ["#e74c3c", "#3498db", "#2ecc71", "#f39c12"][
            Math.floor(Math.random() * 4)
          ],
        });
      }
    }, GAME_CONFIG.car.spawnInterval);

    return () => clearInterval(interval);
  }, [gameState, difficulty]);

  // Spawn coins
  useEffect(() => {
    if (gameState !== "playing") return;

    const settings = DIFFICULTY_SETTINGS[difficulty];
    const interval = setInterval(() => {
      if (Math.random() < settings.coinChance) {
        const laneWidth = GAME_CONFIG.width * 0.5;
        const laneX = (GAME_CONFIG.width - laneWidth) / 2;
        const randomX = laneX + Math.random() * (laneWidth - GAME_CONFIG.coin.width);

        // Place coin in a lane
        const laneIndex = Math.floor(
          Math.random() * GAME_CONFIG.laneCount
        );
        const coinY = laneIndex * GAME_CONFIG.laneHeight + 30;

        gameDataRef.current.coins.push({
          x: randomX,
          y: coinY,
          width: GAME_CONFIG.coin.width,
          height: GAME_CONFIG.coin.height,
          rotation: 0,
          value: Math.floor(Math.random() * 5) + 1,
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [gameState, difficulty]);

  // Reset game data when game state changes
  useEffect(() => {
    if (gameState === "idle") {
      gameDataRef.current = {
        chicken: {
          x: GAME_CONFIG.chicken.startX,
          y: GAME_CONFIG.chicken.startY,
          currentLane: 0,
          isJumping: false,
          jumpProgress: 0,
          animFrame: 0,
          lastFrameTime: 0,
        },
        background: {
          scrollY: 0,
          roadY: 0,
        },
        cars: [],
        coins: [],
        lastCarSpawn: 0,
        score: 0,
      };
    }
  }, [gameState]);

  // Handle jump
  const handleJump = () => {
    if (gameState === "playing" && !gameDataRef.current.chicken.isJumping) {
      gameDataRef.current.chicken.isJumping = true;
      gameDataRef.current.chicken.jumpProgress = 0;
      onJump();
    }
  };

  return (
    <div className="canvas-game-container">
      {notification && (
        <div className={`game-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={GAME_CONFIG.width}
        height={GAME_CONFIG.height}
        className="game-canvas"
        onClick={handleJump}
      />
    </div>
  );
}
