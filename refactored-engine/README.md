# The Factory of Plex

A 3D horror exploration game built with Three.js and Cannon-es physics engine. Uncover the dark truth behind the Factory of Plex through recovered lore items while avoiding deadly deformed creatures.

## Story

The Factory of Plex was a manufacturing facility where toys were brought to life using a magical book. Two founders - Plex and Carlos - disagreed on how to treat these sentient beings.
## How to Play

### Web Version (Easiest)
Simply open `dist/game.html` in your web browser - no installation needed!

### Controls
- **W/A/S/D** - Move around the factory
- **Mouse** - Look around (click in game to enable mouse lock)
- **E** - Open/Close inventory
- **Click Inventory Items** - Read lore entries or view items
- **R** - Restart after death

## Lore Items to Collect
1. **Letter from Carlos to Plex** 
2. **Letter from Plex to Carlos**
3. **Toy Diary Entry**
4. **Security Tape Transcript**
5. **Internal Report**
6. **Evacuation Log**
7. **Scratched Message on Wall** 
8. **Manager's Note**

## The Deformed

Four unique enemy types hunt the factory:

- **The Amalgam** (Red) - Relentless chaser
- **Hollow One** (Dark Red) - Aggressive pursuer
- **The Wretch** (Maroon) - Ambush predator
- **Cluster** (Crimson) - Patrolling walker

Each has unique behavior patterns. Stay alert!

## Development

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

The built game will be in the `dist/` folder.

## Playing Offline

1. Download the entire `dist/` folder
2. Open `dist/game.html` in any modern web browser
3. No internet connection required!

## Features

- Full 3D environment with industrial factory setting
- Dynamic lighting and atmospheric effects
- Physics-based movement and collisions
- AI enemies with different hunting behaviors
- Collectible lore system revealing the story
- Inventory system with item descriptions
- Start menu with objectives and controls screens

## Technical Stack

- **Three.js** - 3D graphics rendering
- **Cannon-es** - Physics simulation
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
