import * as THREE from 'three'
import * as CANNON from 'cannon-es'

export interface CollectibleData {
  id: string
  name: string
  description: string
  isLore: boolean // true for lore items, false for craftable items
  loreContent?: string // Only for lore items
}

export class Collectible {
  public mesh: THREE.Group
  public collected = false
  private body: CANNON.Body
  private rotationSpeed = Math.random() * 0.03 + 0.01
  public data: CollectibleData

  constructor(
    scene: THREE.Scene,
    world: CANNON.World,
    position: [number, number, number],
    data: CollectibleData,
    private onCollect: (item: CollectibleData) => void
  ) {
    this.data = data
    this.mesh = new THREE.Group()
    this.mesh.position.set(position[0], position[1], position[2])

    // Create visual representation with glow - color based on type
    let geometry: THREE.BufferGeometry
    const color = data.isLore ? 0x00ff00 : 0xffaa00 // Green for lore, orange for crafting items
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.8,
      metalness: 0.6,
      roughness: 0.2
    })

    if (data.isLore) {
      geometry = new THREE.BoxGeometry(0.6, 0.8, 0.15)
    } else {
      // Crafting items have different shapes
      geometry = new THREE.OctahedronGeometry(0.4, 2)
    }

    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    this.mesh.add(mesh)

    // Add glowing aura
    const auraGeometry = new THREE.SphereGeometry(0.8, 16, 16)
    const auraMaterial = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.2,
      metalness: 0.5,
      roughness: 0.8
    })
    const aura = new THREE.Mesh(auraGeometry, auraMaterial)
    this.mesh.add(aura)

    // Add point light
    const light = new THREE.PointLight(color, 1.5, 15)
    light.castShadow = true
    this.mesh.add(light)

    // Physics body (kinematic - doesn't fall)
    const shape = new CANNON.Sphere(0.4)
    this.body = new CANNON.Body({
      mass: 0,
      shape: shape
    })
    this.body.position.set(position[0], position[1], position[2])
    world.addBody(this.body)

    // Add to scene
    scene.add(this.mesh)
  }

  collect(): void {
    if (!this.collected) {
      this.collected = true
      this.mesh.visible = false
      this.onCollect(this.data)
    }
  }

  update(): void {
    // Gentle bobbing and rotation animation
    const time = Date.now() * 0.001
    const originalY = this.mesh.position.y
    this.mesh.position.y = originalY + Math.sin(time * 2) * 0.4
    this.mesh.rotation.y += this.rotationSpeed
    this.mesh.rotation.x += this.rotationSpeed * 0.3
  }
}
