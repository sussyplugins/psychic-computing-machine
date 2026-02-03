import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { Player } from './entities/Player'
import { Factory } from './entities/Factory'
import { Deformed } from './entities/Deformed'
import { Collectible } from './entities/Collectible'
import { LoreSystem } from './systems/LoreSystem'
import { UISystem } from '../ui/UISystem'

// Toggle this to enable on-screen factory debug helpers (bbox, axes, wireframe)
const DEBUG_FACTORY_VIS = true

export class GameEngine {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private world: CANNON.World
  private player!: Player
  private factory!: Factory
  private enemies: Deformed[] = []
  private collectibles: Collectible[] = []
  private loreSystem: LoreSystem
  private uiSystem: UISystem
  private isRunning = true
  private gameLoopStarted = false
  // Performance scaling state
  private renderScale = 1
  private perfFrameCount = 0
  private perfLastTime = performance.now()
  private lastPerfAdjust = 0
  private targetFPS = 35
  // Auto quality-scaling is disabled by default; manual mode via Ctrl+4 controls low-perf
  private autoQualityEnabled = false
  private manualLowPerfMode = false
  private prevRenderScale = 1
  private prevShadowEnabled = true
  private physicsHz = 30
  private prevPhysicsHz = 30

  constructor() {
    console.log('GameEngine constructor started')
    // Scene setup
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.Fog(0x0a0a0a, 50, 150)
    this.scene.background = new THREE.Color(0x1a1a1a)
    console.log('Scene created')

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      400
    )
    this.camera.position.set(0, 2, 0)

    // Renderer setup
    // Turn off antialiasing for better performance on low-end devices
    this.renderer = new THREE.WebGLRenderer({ antialias: false })
    // Render at a conservative resolution to improve FPS on Chromebooks
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(1)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.BasicShadowMap
    this.renderer.physicallyCorrectLights = false
    this.renderer.toneMappingExposure = 1.2
    
    const container = document.getElementById('canvas-container')
    console.log('Canvas container:', container)
    if (container) {
      container.appendChild(this.renderer.domElement)
      console.log('Renderer appended')
    } else {
      console.error('Canvas container not found!')
    }

    // Physics world
    this.world = new CANNON.World()
    this.world.gravity.set(0, -9.82, 0)
    this.world.defaultContactMaterial.friction = 0.4

    // Systems
    this.loreSystem = new LoreSystem()
    this.uiSystem = new UISystem()

    // Lighting
    this.setupLighting()

    // Input handling
    this.setupInput()

    // Responsive canvas
    window.addEventListener('resize', () => this.onWindowResize())
  }

  private setupLighting(): void {
    // Ambient light - brighter for visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    this.scene.add(ambientLight)

    // Directional light (sun-like)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
    directionalLight.position.set(80, 60, 80)
    directionalLight.castShadow = true
    directionalLight.shadow.camera.left = -150
    directionalLight.shadow.camera.right = 150
    directionalLight.shadow.camera.top = 150
    directionalLight.shadow.camera.bottom = -150
    // lower shadow map resolution to reduce GPU/memory usage
    directionalLight.shadow.mapSize.width = 512
    directionalLight.shadow.mapSize.height = 512
    directionalLight.shadow.bias = -0.001
    this.scene.add(directionalLight)

    // Red atmospheric light for horror mood
    const redLight = new THREE.DirectionalLight(0xff4444, 0.3)
    redLight.position.set(-50, 40, -50)
    this.scene.add(redLight)

    // Blue accent light
    const blueLight = new THREE.DirectionalLight(0x4444ff, 0.2)
    blueLight.position.set(50, 30, -80)
    this.scene.add(blueLight)

    // Spotlights for dramatic effect
    const spotlight1 = new THREE.SpotLight(0xffd700, 1.2)
    spotlight1.position.set(40, 50, 40)
    // keep only one spotlight casting shadows to save performance
    spotlight1.castShadow = true
    spotlight1.shadow.mapSize.width = 512
    spotlight1.shadow.mapSize.height = 512
    spotlight1.angle = Math.PI / 4
    this.scene.add(spotlight1)

    const spotlight2 = new THREE.SpotLight(0xff6644, 0.8)
    spotlight2.position.set(-40, 45, -40)
    spotlight2.castShadow = false
    spotlight2.angle = Math.PI / 5
    this.scene.add(spotlight2)

    // Point lights for atmosphere
    const pointLight1 = new THREE.PointLight(0x00ff00, 0.5, 50)
    pointLight1.position.set(25, 8, 25)
    this.scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0x00ff00, 0.4, 40)
    pointLight2.position.set(-25, 8, -25)
    this.scene.add(pointLight2)
  }

  private setupInput(): void {
    const keys: { [key: string]: boolean } = {}
    let isInventoryOpen = false

    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase()
      keys[key] = true

      // E key for inventory
      if (key === 'e') {
        const inventory = document.getElementById('inventory')
        if (inventory) {
          isInventoryOpen = !isInventoryOpen
          if (isInventoryOpen) {
            inventory.classList.add('active')
          } else {
            inventory.classList.remove('active')
          }
        }
      }

      // Restart on R key
      if (key === 'r' && !this.isRunning) {
        location.reload()
      }
    })

    window.addEventListener('keyup', (e) => {
      keys[e.key.toLowerCase()] = false
    })

    // Mouse lock - only request when clicking on canvas and not in menu
    let pointerLockRequested = false
    document.addEventListener('click', (e) => {
      if (!isInventoryOpen && e.target === this.renderer.domElement && !pointerLockRequested) {
        pointerLockRequested = true
        this.renderer.domElement.requestPointerLock().catch(() => {
          pointerLockRequested = false
        })
      }
    })

    // Ctrl+4 toggles manual low-performance mode (user-controlled)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '4') {
        e.preventDefault()
        this.setManualLowPerf(!this.manualLowPerfMode)
      }
    })

    // Reset pointer lock flag when lock is lost
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement !== this.renderer.domElement) {
        pointerLockRequested = false
      }
    })

    // Mouse movement for camera
    let mouseDeltaX = 0
    let mouseDeltaY = 0

    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === this.renderer.domElement) {
        mouseDeltaX = e.movementX
        mouseDeltaY = e.movementY
      }
    })

    // Make keys and mouse available to player
    this.getInput = () => ({
      keys,
      mouseDeltaX,
      mouseDeltaY,
      reset: () => {
        mouseDeltaX = 0
        mouseDeltaY = 0
      }
    })
  }

  private getInput: () => any

  start(): void {
    try {
      console.log('GameEngine.start() called')
      // Create player
      this.player = new Player(this.scene, this.world, this.camera)
      console.log('Player created')
      this.scene.add(this.player.mesh)

      // Create factory
      this.factory = new Factory(this.scene, this.world)
      console.log('Factory created, loaded:', this.factory.loaded)
      this.scene.add(this.factory.mesh)
      console.log('Factory mesh added to scene')

      if (DEBUG_FACTORY_VIS) {
        try {
          const box = new THREE.Box3().setFromObject(this.factory.mesh)
          console.log('Factory bounding box:', box)
          const boxHelper = new THREE.Box3Helper(box, 0xffff00)
          this.scene.add(boxHelper)

          const maxDim = Math.max(this.factory.size.x || 1, this.factory.size.y || 1, this.factory.size.z || 1)
          const axes = new THREE.AxesHelper(Math.max(5, maxDim))
          axes.position.set(this.factory.center.x || 0, this.factory.center.y || 0, this.factory.center.z || 0)
          this.scene.add(axes)

          // Try to make factory geometry wireframe for easier visibility
          this.factory.mesh.traverse((n: any) => {
            if (n.isMesh && n.material) {
              try {
                if (Array.isArray(n.material)) {
                  n.material.forEach((m: any) => { if (m && typeof m === 'object') m.wireframe = true })
                } else {
                  n.material.wireframe = true
                }
              } catch (err) {
                // non-fatal
              }
            }
          })
        } catch (err) {
          console.warn('Factory debug helpers failed:', err)
        }
      }

      // If factory is not yet loaded, wait and reposition player to a sensible spawn near the map
      if (this.factory.loaded) {
        this.repositionPlayerToFactory()
      } else {
        console.log('Waiting for factory to load...')
        const waitForFactory = setInterval(() => {
          if (this.factory.loaded) {
            clearInterval(waitForFactory)
            this.repositionPlayerToFactory()
          }
        }, 100)
      }

      // Create collectibles with lore
      this.createCollectibles()

      // Create enemies
      this.createEnemies()

      console.log('Starting game loop')
      // Start game loop
      this.gameLoop()
    } catch (e) {
      console.error('Error starting game:', e)
    }
  }

  private repositionPlayerToFactory(): void {
    try {
      // Place the player near the factory center, on the ground surface
      const cx = this.factory.center.x || 0
      const cz = this.factory.center.z || 0

      // compute ground Y based on factory center and half-height
      const groundY = (this.factory.center.y || 0) - (this.factory.size.y || 0) / 2
      const playerEyeHeight = 1.6
      const spawnY = groundY + playerEyeHeight + 0.5

      this.player.body.position.set(cx, spawnY, cz)
      this.player.mesh.position.copy(this.player.body.position as any)
      this.camera.position.copy(this.player.mesh.position)
      this.camera.position.y = spawnY

      console.log('Player repositioned to factory center at', cx, spawnY, cz, '(groundY:', groundY, ')')
    } catch (e) {
      console.warn('Failed to reposition player to factory:', e)
    }
  }

  private adjustQuality(fps: number): void {
    const now = performance.now()
    // don't adjust more than once per 1s
    if (now - this.lastPerfAdjust < 1000) return
    this.lastPerfAdjust = now
    // If manual low-perf mode is active, skip auto adjustments
    if (this.manualLowPerfMode) return

    // If FPS is well below target, lower renderScale
    if (fps < this.targetFPS - 5 && this.renderScale > 0.5) {
      this.renderScale = Math.max(0.5, this.renderScale - 0.25)
      this.renderer.setPixelRatio(this.renderScale)
      this.renderer.setSize(window.innerWidth, window.innerHeight)
      // Disable shadows on aggressive downscale
      if (this.renderScale <= 0.75) this.renderer.shadowMap.enabled = false
      console.log('Performance: low FPS', fps, '-> renderScale set to', this.renderScale)
    } else if (fps > this.targetFPS + 5 && this.renderScale < 1) {
      // increase quality when possible
      this.renderScale = Math.min(1, this.renderScale + 0.25)
      this.renderer.setPixelRatio(this.renderScale)
      this.renderer.setSize(window.innerWidth, window.innerHeight)
      if (this.renderScale >= 1) this.renderer.shadowMap.enabled = true
      console.log('Performance: good FPS', fps, '-> renderScale set to', this.renderScale)
    }
  }

  private setManualLowPerf(enabled: boolean): void {
    this.manualLowPerfMode = enabled
    if (enabled) {
      // store previous
      this.prevRenderScale = this.renderScale
      this.prevShadowEnabled = this.renderer.shadowMap.enabled
      this.prevPhysicsHz = this.physicsHz

      this.renderScale = 0.5
      this.renderer.setPixelRatio(this.renderScale)
      this.renderer.setSize(window.innerWidth, window.innerHeight)
      this.renderer.shadowMap.enabled = false
      this.physicsHz = 15

      console.log('Manual low-perf mode ENABLED: renderScale=0.5, shadows disabled, physicsHz=15')
    } else {
      // restore
      this.renderScale = this.prevRenderScale || 1
      this.renderer.setPixelRatio(this.renderScale)
      this.renderer.setSize(window.innerWidth, window.innerHeight)
      this.renderer.shadowMap.enabled = this.prevShadowEnabled
      this.physicsHz = this.prevPhysicsHz || 30

      console.log('Manual low-perf mode DISABLED: restored previous settings')
    }
  }

  private createCollectibles(): void {
    const collectiblesData = [
      {
        position: [10, 1, 15],
        id: 'letter_carlos_1',
        name: 'Letter from Carlos to Plex',
        description: 'A concerned letter about toy welfare',
        isLore: true,
        loreContent: 'Dear Plex,\n\nI am deeply concerned about what we are doing. These toys... they think, they feel, they dream. I see it in their eyes. Just because we brought them to life doesn\'t give us the right to treat them as mere machines.\n\nWe must reduce their working hours and provide them proper rest. They are suffering.\n\n- Carlos'
      },
      {
        position: [20, 1, 5],
        id: 'letter_plex_1',
        name: 'Letter from Plex to Carlos',
        description: 'A ruthless response about production',
        isLore: true,
        loreContent: 'Carlos,\n\nThey are TOYS. Yes, they can think, but they exist for production. Sentiment is weakness. We have quotas to meet and profits to maximize.\n\nYour compassion is costing us millions. Either increase production or stop wasting my time.\n\n- Plex'
      },
      {
        position: [5, 1, 20],
        id: 'letter_toy_1',
        name: 'Diary Entry - Toy #4472',
        description: 'A toy\'s account of consciousness and suffering',
        isLore: true,
        loreContent: 'My "birthday" was two weeks ago. That\'s when I came alive. I remember the glow of the magic book as my consciousness sparked into existence.\n\nI was happy at first. I had friends - other toys like me. But now... we work so much. My joints hurt. The others are starting to change. Their eyes go empty. What is happening to us?'
      },
      {
        position: [15, 1, 25],
        id: 'tape_transcript_1',
        name: 'Security Tape Transcript - Day 47',
        description: 'Corrupted audio log of anomalous behavior',
        isLore: true,
        loreContent: '[AUDIO LOG - HEAVILY CORRUPTED]\n\n...workers report strange behavior in Sector 7. The toys are... fused together? Some have multiple limbs. Others are immobile.\n\nDoctor recommends immediate evacuation. Safety protocols violated. Unknown metamorphosis occurring.\n\nDirector Plex refuses to shutdown operations...'
      },
      {
        position: [0, 1, 10],
        id: 'letter_toy_2',
        name: 'Scratched Message on Wall',
        description: 'Desperate pleas from suffering entities',
        isLore: true,
        loreContent: 'HELP US\nHELP US\nHELP US\n\nWe are not what we were\nWe hunger\nWe are in pain\nWe want to be free\n\nThey made us\nWhy did they make us if they would do this\n\n...please...'
      },
      {
        position: [25, 1, 15],
        id: 'report_carlos',
        name: 'Internal Report - Carlos Martinez',
        description: 'Analysis of biological anomalies',
        isLore: true,
        loreContent: 'URGENT: Biological Anomaly Report\n\nThe toys are experiencing rapid cellular degradation combined with neural integration. They are becoming something else. Something unified. Something hungry.\n\nI am requesting immediate evacuation and containment. This situation has spiraled beyond our control.\n\nPlex continues to deny the severity. We may have created something we cannot control.'
      },
      {
        position: [10, 1, 0],
        id: 'tape_transcript_2',
        name: 'Evacuation Log - Final Entry',
        description: 'The last recorded moments before disaster',
        isLore: true,
        loreContent: '[RECORDING CORRUPTED AND DISTORTED]\n\n...they are breaking through the doors. Multiple entities. Possibly a single organism distributed across a dozen forms. Witnesses report extreme deformity and aggressive behavior.\n\nEVACUATE IMMEDIATELY\n\n[Sound of screaming - RECORDING ENDS]'
      },
      {
        position: [5, 1, 5],
        id: 'note_manager',
        name: 'Note from Old Manager - 25 years later',
        description: 'Reflections after the catastrophe',
        isLore: true,
        loreContent: 'I came back to salvage what I could. The machines, the trains... they need to be moved. Maybe they can have a second purpose.\n\nBut the things here... I see them sometimes. In the shadows. The deformed.\n\nI pray they won\'t notice me.'
      }
    ]

    collectiblesData.forEach((data) => {
      const collectible = new Collectible(
        this.scene,
        this.world,
        data.position as [number, number, number],
        {
          id: data.id,
          name: data.name,
          description: data.description,
          isLore: data.isLore,
          loreContent: data.loreContent
        },
        () => this.showLoreEntry(data.name, data.loreContent || '')
      )
      this.collectibles.push(collectible)
    })
  }

  private createEnemies(): void {
    const spawnPoints = [
      [30, 1, 30],
      [-30, 1, 30],
      [30, 1, -30],
      [-20, 1, 20]
    ]

    spawnPoints.forEach((pos, index) => {
      const enemy = new Deformed(
        this.scene,
        this.world,
        pos as [number, number, number],
        this.player,
        index
      )
      this.enemies.push(enemy)
    })
  }

  private showLoreEntry(title: string, content: string): void {
    this.isRunning = false
    const entry = document.getElementById('lore-entry')
    if (entry) {
      document.getElementById('lore-title')!.textContent = title
      document.getElementById('lore-content')!.textContent = content
      entry.classList.add('active')
    }
  }

  resumeGame(): void {
    this.isRunning = true
  }

  private gameLoop = (): void => {
    // Render on first frame
    if (!this.gameLoopStarted) {
      this.gameLoopStarted = true
      console.log('Game loop started - first frame')
    }
    
    // Always render
    this.renderer.render(this.scene, this.camera)

    // Performance measurement
    this.perfFrameCount++
    const now = performance.now()
    const elapsed = now - this.perfLastTime
    if (elapsed >= 1000) {
      const fps = Math.round((this.perfFrameCount * 1000) / elapsed)
      this.perfFrameCount = 0
      this.perfLastTime = now
      // adjust quality based on measured fps
      this.adjustQuality(fps)
    }

    if (!this.isRunning) {
      requestAnimationFrame(this.gameLoop)
      return
    }

    const input = this.getInput()

    // Update player
    this.player.update(input, this.world)
    input.reset()

    // Update camera
    this.camera.position.copy(this.player.mesh.position)
    this.camera.position.y += 1.6 // Head height

    // Update physics at configured frequency
    this.world.step(1 / this.physicsHz)

    // Update enemies
    this.enemies.forEach((enemy) => {
      enemy.update(this.world)

      // Check collision with player
      if (this.player.mesh.position.distanceTo(enemy.mesh.position) < 2) {
        this.playerDeath('You were caught by the deformed!')
      }
    })

    // Check collectible proximity
    this.collectibles.forEach((collectible) => {
      collectible.update()
      if (this.player.mesh.position.distanceTo(collectible.mesh.position) < 2) {
        collectible.collect()
        this.uiSystem.updateCollected(this.getCollectedCount())
      }
    })

    // Update UI
    this.uiSystem.updatePosition(this.player.mesh.position)
    this.uiSystem.updateHealth(this.player.health)

    // Check nearby enemies for warning
    const nearestEnemy = this.getNearestEnemy()
    if (nearestEnemy && nearestEnemy.distance < 15) {
      document.getElementById('warning')!.style.display = 'block'
    } else {
      document.getElementById('warning')!.style.display = 'none'
    }

    requestAnimationFrame(this.gameLoop)
  }

  private getNearestEnemy(): { distance: number; enemy: Deformed } | null {
    let nearest = null
    let minDist = Infinity

    this.enemies.forEach((enemy) => {
      const dist = this.player.mesh.position.distanceTo(enemy.mesh.position)
      if (dist < minDist) {
        minDist = dist
        nearest = enemy
      }
    })

    return nearest ? { distance: minDist, enemy: nearest } : null
  }

  private playerDeath(reason: string): void {
    this.isRunning = false
    const gameOverScreen = document.getElementById('game-over')
    if (gameOverScreen) {
      gameOverScreen.classList.add('active')
      document.getElementById('game-over-text')!.textContent = reason
    }
  }

  private getCollectedCount(): number {
    return this.collectibles.filter(c => c.collected).length
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }
}
