import { useEffect, useRef, useState } from "react";
import "./CanvasGameArea.css";

export function CanvasGameArea() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });

  const init = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Load the start and finish images
    const startImage = new Image();
    const finishImage = new Image();
    startImage.src = "/start.png";
    finishImage.src = "/finish.png";

    let loadedImages = 0;
    const onImageLoad = () => {
      loadedImages++;
      if (loadedImages === 2) {
        // Both images loaded, now draw
        const startWidth = startImage.width;
        const startHeight = startImage.height;
        const finishWidth = finishImage.width;
        const finishHeight = finishImage.height;
        const laneWidth = 300;
        const numberOfLanes = 30;
        const roadWidth = laneWidth * numberOfLanes;
        const roadHeight = startHeight;

        // Set canvas size to accommodate start image + road + half of finish image
        canvas.width = startWidth + roadWidth + finishWidth / 2;
        canvas.height = Math.max(roadHeight, finishHeight);

        // Draw the start image at the beginning
        ctx.drawImage(startImage, 0, 0, startWidth, startHeight);

        // Draw the road background
        ctx.fillStyle = "#716c69";
        ctx.fillRect(startWidth, 0, roadWidth, roadHeight);

        // Draw vertical dashed lines to separate lanes
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 5;
        ctx.setLineDash([40, 40]); // Dash pattern: 20px line, 15px gap

        for (let i = 1; i < numberOfLanes; i++) {
          const x = startWidth + i * laneWidth;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, roadHeight);
          ctx.stroke();
        }

        // Reset line dash
        ctx.setLineDash([]);

        // Draw the finish image at the end (half visible)
        ctx.drawImage(
          finishImage,
          startWidth + roadWidth,
          0,
          finishWidth,
          finishHeight,
        );
      }
    };

    startImage.onload = onImageLoad;
    finishImage.onload = onImageLoad;
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartPos({
      x: e.pageX - containerRef.current.offsetLeft,
      y: e.pageY - containerRef.current.offsetTop,
    });
    setScrollPos({
      left: containerRef.current.scrollLeft,
      top: containerRef.current.scrollTop,
    });
    containerRef.current.style.cursor = "grabbing";
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const y = e.pageY - containerRef.current.offsetTop;
    const walkX = (x - startPos.x) * 1.5;
    const walkY = (y - startPos.y) * 1.5;
    containerRef.current.scrollLeft = scrollPos.left - walkX;
    containerRef.current.scrollTop = scrollPos.top - walkY;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    containerRef.current.style.cursor = "grab";
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      containerRef.current.style.cursor = "grab";
    }
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <div
      ref={containerRef}
      className="canvas-game-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <canvas ref={canvasRef} className="game-canvas" />
    </div>
  );
}
