import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export class Player {
  public mesh: THREE.Group
  public body: CANNON.Body
  public health = 100
  private velocity = new THREE.Vector3()
  private yaw = 0
  private pitch = 0
  private modelLoaded = false

  constructor(
    scene: THREE.Scene,
    world: CANNON.World,
    private camera: THREE.PerspectiveCamera
  ) {
    // Create visual mesh
    this.mesh = new THREE.Group()
    this.mesh.position.set(0, 2, 0)

    // Load custom player model
    this.loadPlayerModel(scene)

    // Create physics body - using a capsule shape (sphere for now)
    const shape = new CANNON.Sphere(0.5)
    this.body = new CANNON.Body({
      mass: 1,
      shape: shape,
      linearDamping: 0.3,
      angularDamping: 0.3,
      fixedRotation: true
    })
    this.body.position.set(0, 2, 0)
    world.addBody(this.body)
  }

  update(input: any, world: CANNON.World): void {
    // Mouse look
    this.yaw -= input.mouseDeltaX * 0.005
    this.pitch -= input.mouseDeltaY * 0.005
    this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch))

    // Update camera rotation
    this.camera.rotation.order = 'YXZ'
    this.camera.rotation.y = this.yaw
    this.camera.rotation.x = this.pitch

    // Movement
    const moveDirection = new THREE.Vector3()
    const speed = 0.15

    if (input.keys['w']) moveDirection.z -= 1
    if (input.keys['s']) moveDirection.z += 1
    if (input.keys['a']) moveDirection.x -= 1
    if (input.keys['d']) moveDirection.x += 1

    if (moveDirection.length() > 0) {
      moveDirection.normalize()
      moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw)

      this.body.velocity.x = moveDirection.x * speed
      this.body.velocity.z = moveDirection.z * speed
    } else {
      this.body.velocity.x *= 0.9
      this.body.velocity.z *= 0.9
    }

    // Update mesh position from body
    this.mesh.position.copy(this.body.position as any)
  }

  private loadPlayerModel(scene: THREE.Scene): void {
    const loader = new GLTFLoader()
    const path = '/models/Player.glb'
    console.log('Loading player model from:', path)
    loader.load(
      path,
      (gltf) => {
        console.log('Player model loaded successfully')
        const model = gltf.scene
        model.scale.set(1, 1, 1)
        model.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            const mesh = node as THREE.Mesh
            mesh.castShadow = true
            mesh.receiveShadow = true
          }
        })
        this.mesh.add(model)
        this.modelLoaded = true
        console.log('Player model added to mesh')
      },
      undefined,
      (error) => {
        console.error('Error loading player model:', error)
        console.log('Player will use procedural geometry as fallback')
      }
    )
  }
}
