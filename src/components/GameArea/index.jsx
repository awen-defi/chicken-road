import { CanvasGameArea } from "./CanvasGameArea";
import "./index.css";

export function GameArea({
  gameState,
  difficulty,
  onGameOver,
  onCoinCollect,
  onJump,
}) {
  return (
    <div className="game-area-wrapper">
      <CanvasGameArea
        gameState={gameState}
        difficulty={difficulty}
        onGameOver={onGameOver}
        onCoinCollect={onCoinCollect}
        onJump={onJump}
      />
    </div>
  );
}
