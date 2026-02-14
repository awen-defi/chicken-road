# Asset Replacement Guide

This game is designed to make asset replacement easy. All game assets are configured in a single file and can be easily replaced with your own images.

## Asset Configuration

All asset paths are defined in `/src/config/gameConfig.js`:

```javascript
assets: {
  background: '/assets/background.png',
  road: '/assets/road.png',
  chicken: '/assets/chicken.png',
  car: '/assets/car.png',
  coin: '/assets/coin.png',
}
```

## How to Replace Assets

1. **Prepare Your Images**: 
   - Recommended formats: PNG with transparency
   - Optimal sizes:
     - Background: 800x600 pixels (or proportional)
     - Road texture: 400x600 pixels
     - Chicken sprite: 60x60 pixels per frame
     - Car: 80x50 pixels
     - Coin: 40x40 pixels

2. **Place Your Assets**:
   - Create a folder: `/public/assets/`
   - Add your image files with the following names:
     - `background.png` - Game background
     - `road.png` - Road texture pattern
     - `chicken.png` - Chicken sprite sheet
     - `car.png` - Car sprite
     - `coin.png` - Coin sprite

3. **Sprite Sheet Format** (Optional):
   For animated sprites like the chicken:
   - Arrange frames horizontally in a single row
   - Each frame should be equal width
   - Update frame counts in `gameConfig.js` if needed:
     ```javascript
     chicken: {
       idleFrames: 8,  // Number of idle animation frames
       jumpFrames: 6,  // Number of jump animation frames
     }
     ```

4. **Using Custom Paths**:
   If you want to use different file names or locations, update the paths in `/src/config/gameConfig.js`:
   ```javascript
   assets: {
     chicken: '/my-custom-folder/my-chicken.png',
     car: '/assets/custom-car.png',
     // ...
   }
   ```

## Current Implementation

Currently, the game uses programmatically drawn sprites (canvas drawing). To use your custom images:

1. Place your images in `/public/assets/`
2. The game will automatically load them when you refresh
3. If images don't exist, the game falls back to programmatic drawing

## Tips

- Use transparent PNGs for best results
- Keep file sizes optimized for faster loading
- Test your sprites at different sizes to ensure they look good
- Maintain consistent art style across all assets
