# 🐔 Chicken Road Game

A fun and interactive browser-based game where a chicken attempts to cross a road filled with multipliers. Built with React and Vite.

![Chicken Road Game](public/logo.png)

## 🎮 Game Features

- **Interactive Gameplay**: Guide the chicken across the road to collect multipliers
- **Adjustable Betting**: Choose your bet amount with a convenient slider (0.1 - 10)
- **Multiple Difficulty Levels**:
  - Easy
  - Medium
  - Hard
  - Hardcore
- **Risk Indicator**: Visual "Chance of being shot down" bar that adjusts with difficulty
- **Quick Bet Options**: Fast bet selection with preset values (0.5, 1, 2, 7)
- **Multiplier System**: 7 lanes with increasing multipliers (1.01x to 1.19x)
- **Modern UI**: Sleek, responsive design with smooth animations

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to the provided local URL (typically `http://localhost:5173`)

## 🎯 How to Play

1. **Set Your Bet**: Use the slider or quick bet buttons to choose your wager amount
2. **Choose Difficulty**: Select from Easy, Medium, Hard, or Hardcore modes
3. **Check the Risk**: View the "Chance of being shot down" indicator
4. **Click Play**: Start the game and watch the chicken navigate the road
5. **Collect Multipliers**: As the chicken advances, your bet multiplies based on the lane

## 🛠️ Built With

- **React 19** - UI Framework
- **Vite 7** - Build tool and dev server
- **CSS3** - Styling and animations
- **SVG** - Custom game graphics

## 📁 Project Structure

```
ChickenRoadTwoClient/
├── public/
│   └── logo.png           # Game logo
├── src/
│   ├── components/
│   │   ├── header/        # Header with logo and balance
│   │   ├── GameArea/      # Main game display with chicken, road, and car
│   │   ├── ControlPanel/  # Betting controls and play button
│   │   ├── GameAssets.jsx # SVG components (chicken, car)
│   │   └── index.js       # Component exports
│   ├── assets/
│   │   └── fonts/         # Custom fonts (Montserrat)
│   ├── App.jsx            # Main application component
│   ├── App.css            # Global styles
│   └── main.jsx           # Application entry point
├── index.html
├── package.json
└── README.md
```

## 🎨 Features Overview

### Header

- Game logo display
- "How to play?" button
- Balance display with currency icon
- Fullscreen toggle
- Menu button

### Game Area

- Live statistics panel
- Online player count
- Chicken character with animations
- Road with 7 lanes
- Multiplier circles in each lane
- Animated car obstacle
- Decorative ground with grass and trees

### Control Panel

- MIN/MAX slider for bet amount
- Quick bet selection buttons
- Difficulty level selector
- Visual risk indicator
- Large "Play" button

## 🎬 Animations

- Chicken hover animation
- Car floating effect
- Smooth transitions on all interactive elements
- Gradient effects on buttons and UI elements

## 📱 Responsive Design

The game is designed to work on various screen sizes with responsive breakpoints.

## 🔧 Development Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🎨 Customization

### Changing Multipliers

Edit the multipliers array in src/App.jsx

### Adjusting Bet Options

Modify the betOptions array in src/components/ControlPanel/index.jsx

### Styling

All component styles are located in their respective index.css files.

---

**Enjoy the game! 🐔🚗**
