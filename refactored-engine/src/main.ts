import { GameEngine } from './game/GameEngine'
import './utils/ConsoleOverlay'

console.log('main.ts loaded!')

try {
  console.log('Creating GameEngine...')
  const game = new GameEngine();

  console.log('GameEngine instantiated');

  // Make game instance globally available for UI functions
  (window as any).gameInstance = game;

  // Expose UI functions globally
  (window as any).closeLoreEntry = () => {
    const entry = document.getElementById('lore-entry')
    if (entry) {
      entry.classList.remove('active')
    }
    game.resumeGame()
  }

  // Start the game
  console.log('About to call game.start()')
  game.start()
  console.log('game.start() completed successfully')
} catch (e) {
  console.error('FATAL ERROR in main.ts:', e)
  if (e instanceof Error) {
    console.error('Stack:', e.stack)
  }
}
