import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { Player } from './Player'

interface DeformedData {
  name: string
  color: number
  speed: number
  ability: 'chase' | 'patrol' | 'ambush'
}

const deformedTypes: DeformedData[] = [
  { name: 'The Amalgam', color: 0x8b0000, speed: 0.08, ability: 'chase' },
  { name: 'Hollow One', color: 0x660000, speed: 0.12, ability: 'chase' },
  { name: 'The Wretch', color: 0x440000, speed: 0.06, ability: 'ambush' },
  { name: 'Cluster', color: 0xaa0000, speed: 0.07, ability: 'patrol' }
]

export class Deformed {
  public mesh: THREE.Group
  public body: CANNON.Body
  private targetPlayer: Player
  private wanderAngle = 0
  private updateCounter = 0
  private deformedData: DeformedData
  private chaseTimer = 0

  constructor(
    scene: THREE.Scene,
    world: CANNON.World,
    position: [number, number, number],
    targetPlayer: Player,
    index: number
  ) {
    this.targetPlayer = targetPlayer
    this.deformedData = deformedTypes[index % deformedTypes.length]
    this.mesh = new THREE.Group()
    this.mesh.position.set(position[0], position[1], position[2])

    // Create deformed creature mesh
    const bodyGeometry = new THREE.IcosahedronGeometry(1.5, 3)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: this.deformedData.color,
      metalness: 0.3,
      roughness: 0.7,
      emissive: this.deformedData.color,
      emissiveIntensity: 0.2
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.castShadow = true
    this.mesh.add(body)

    // Add extra limbs/features
    const limbPositions = [
      [1, 0.5, 0],
      [-1, 0.5, 0],
      [0, 1, 1],
      [0, 1, -1]
    ]

    limbPositions.forEach((pos) => {
      const limbGeometry = new THREE.SphereGeometry(0.4, 8, 8)
      const limb = new THREE.Mesh(limbGeometry, bodyMaterial)
      limb.position.set(pos[0], pos[1], pos[2])
      limb.castShadow = true
      this.mesh.add(limb)
    })

    // Physics body
    const shape = new CANNON.Sphere(1.5)
    this.body = new CANNON.Body({
      mass: 2,
      shape: shape,
      linearDamping: 0.5,
      fixedRotation: true
    })
    this.body.position.set(position[0], position[1], position[2])
    world.addBody(this.body)
  }

  update(world: CANNON.World): void {
    this.updateCounter++

    // Simple AI: seek player or wander based on ability
    const distToPlayer = this.mesh.position.distanceTo(this.targetPlayer.mesh.position)
    const speed = this.deformedData.speed

    switch (this.deformedData.ability) {
      case 'chase':
        // Always chase if within range
        if (distToPlayer < 50) {
          const direction = new THREE.Vector3()
          direction.subVectors(this.targetPlayer.mesh.position, this.mesh.position)
          direction.normalize()

          this.body.velocity.x = direction.x * speed
          this.body.velocity.z = direction.z * speed
        } else {
          // Wander
          this.wanderBehavior()
        }
        break

      case 'ambush':
        // Patrol normally, but if player gets too close, sudden chase
        if (distToPlayer < 20) {
          const direction = new THREE.Vector3()
          direction.subVectors(this.targetPlayer.mesh.position, this.mesh.position)
          direction.normalize()
          const aggressiveSpeed = speed * 1.5

          this.body.velocity.x = direction.x * aggressiveSpeed
          this.body.velocity.z = direction.z * aggressiveSpeed
          this.chaseTimer = 300 // Chase for 5 seconds
        } else if (this.chaseTimer > 0) {
          const direction = new THREE.Vector3()
          direction.subVectors(this.targetPlayer.mesh.position, this.mesh.position)
          direction.normalize()

          this.body.velocity.x = direction.x * (speed * 1.5)
          this.body.velocity.z = direction.z * (speed * 1.5)
          this.chaseTimer--
        } else {
          this.wanderBehavior()
        }
        break

      case 'patrol':
        // Patrol in patterns, occasionally chase
        if (distToPlayer < 25) {
          const direction = new THREE.Vector3()
          direction.subVectors(this.targetPlayer.mesh.position, this.mesh.position)
          direction.normalize()

          this.body.velocity.x = direction.x * speed
          this.body.velocity.z = direction.z * speed
        } else {
          this.wanderBehavior()
        }
        break
    }

    // Update mesh position from body
    this.mesh.position.copy(this.body.position as any)
  }

  private wanderBehavior(): void {
    if (this.updateCounter % 60 === 0) {
      this.wanderAngle += (Math.random() - 0.5) * Math.PI
    }

    const wanderSpeed = this.deformedData.speed * 0.5
    this.body.velocity.x = Math.cos(this.wanderAngle) * wanderSpeed
    this.body.velocity.z = Math.sin(this.wanderAngle) * wanderSpeed
  }

  getName(): string {
    return this.deformedData.name
  }

  getAbility(): string {
    return this.deformedData.ability
  }
}
