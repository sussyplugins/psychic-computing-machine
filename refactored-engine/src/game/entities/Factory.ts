import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export class Factory {
  public mesh: THREE.Group
  public loaded = false
  public center = new THREE.Vector3()
  public size = new THREE.Vector3()

  constructor(scene: THREE.Scene, world: CANNON.World) {
    this.mesh = new THREE.Group()

    // Create factory building with better materials
    const buildingGeometry = new THREE.BoxGeometry(60, 20, 40)
    const buildingMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.4,
      roughness: 0.6,
      emissive: 0x0a0a0a
    })
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial)
    building.position.y = 10
    building.castShadow = true
    building.receiveShadow = true
    this.mesh.add(building)

    // Create building physics
    const shape = new CANNON.Box(new CANNON.Vec3(30, 10, 20))
    const body = new CANNON.Body({ mass: 0, shape })
    body.position.set(0, 10, 0)
    world.addBody(body)

    // Create floor with better detail
    const floorGeometry = new THREE.PlaneGeometry(200, 200)
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.2,
      roughness: 0.8,
      emissive: 0x050505
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    floor.position.y = -0.01
    this.mesh.add(floor)

    // Create floor physics
    const floorShape = new CANNON.Plane()
    const floorBody = new CANNON.Body({ mass: 0, shape: floorShape })
    floorBody.position.y = 0
    world.addBody(floorBody)

    // Add some industrial structures
    this.addPipes()
    this.addMachinery()
    this.addWalls()
    this.addDecor()

    // Merge procedural meshes into a single mesh to reduce draw calls
    try {
      const geoms: THREE.BufferGeometry[] = []
      const toRemove: THREE.Object3D[] = []
      this.mesh.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh
          if (m.geometry) {
            const geom = m.geometry.clone()
            geom.applyMatrix4(m.matrix)
            geoms.push(geom)
            toRemove.push(m)
          }
        }
      })
      if (geoms.length > 1) {
        const merged = mergeBufferGeometries(geoms, false)
        const mat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.4, roughness: 0.6 })
        const mergedMesh = new THREE.Mesh(merged, mat)
        mergedMesh.receiveShadow = true
        mergedMesh.castShadow = true
        // remove original children
        toRemove.forEach((c) => this.mesh.remove(c))
        this.mesh.add(mergedMesh)
      }
    } catch (err) {
      // merging is best-effort; ignore failures
      console.warn('Failed to merge procedural meshes:', err)
    }

    // Procedural geometry created; do not mark `loaded` yet so GameEngine
    // can wait for an external GLB to replace it. `loadFactoryModel` will
    // set `loaded = true` whether the GLB loads or the loader falls back.
    this.center.set(0, 10, 0)
    this.size.set(60, 20, 40)
    console.log('Procedural factory created (waiting for external map)')

    // If an external factory map exists, replace procedural factory with it
    this.loadFactoryModel(scene, world)
  }

  private addPipes(): void {
    const pipePositions = [
      [15, 8, 0],
      [-15, 8, 0],
      [0, 8, 15],
      [0, 8, -15],
      [25, 12, 10],
      [-25, 12, -10]
    ]

    pipePositions.forEach((pos) => {
      const pipeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 20, 12)
      const pipeMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a4a4a,
        metalness: 0.7,
        roughness: 0.3,
        emissive: 0x1a1a1a
      })
      const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial)
      pipe.position.set(pos[0], pos[1], pos[2])
      pipe.castShadow = true
      pipe.receiveShadow = true
      this.mesh.add(pipe)
    })
  }

  private addMachinery(): void {
    // Create various machinery boxes with more detail
    const machineryPositions = [
      [20, 2, 10],
      [-20, 2, 10],
      [20, 2, -10],
      [-20, 2, -10],
      [0, 2, 15],
      [10, 2, -20]
    ]

    machineryPositions.forEach((pos) => {
      const machGeometry = new THREE.BoxGeometry(4, 4, 4)
      const machMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        metalness: 0.6,
        roughness: 0.4,
        emissive: 0x1a1a1a
      })
      const machine = new THREE.Mesh(machGeometry, machMaterial)
      machine.position.set(pos[0], pos[1], pos[2])
      machine.castShadow = true
      machine.receiveShadow = true
      this.mesh.add(machine)

      // Add some details to machinery
      const detailGeometry = new THREE.SphereGeometry(0.3, 8, 8)
      const detailMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        metalness: 0.8,
        roughness: 0.2
      })
      for (let i = 0; i < 3; i++) {
        const detail = new THREE.Mesh(detailGeometry, detailMaterial)
        detail.position.set(pos[0] + Math.random() * 2 - 1, pos[1] + 2 + i, pos[2] + Math.random() * 2 - 1)
        this.mesh.add(detail)
      }
    })
  }

  private addWalls(): void {
    // Create walls with more industrial look
    const wallPositions = [
      { pos: [30, 10, 0], rot: [0, 0, 0], scale: [1, 20, 40] },
      { pos: [-30, 10, 0], rot: [0, 0, 0], scale: [1, 20, 40] },
      { pos: [0, 10, 20], rot: [0, 0, 0], scale: [60, 20, 1] },
      { pos: [0, 10, -20], rot: [0, 0, 0], scale: [60, 20, 1] }
    ]

    wallPositions.forEach((wall) => {
      const wallGeometry = new THREE.BoxGeometry(1, 1, 1)
      const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.1,
        roughness: 0.95,
        emissive: 0x030303
      })
      const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial)
      wallMesh.position.set(wall.pos[0], wall.pos[1], wall.pos[2])
      wallMesh.scale.set(wall.scale[0], wall.scale[1], wall.scale[2])
      wallMesh.castShadow = true
      wallMesh.receiveShadow = true
      this.mesh.add(wallMesh)
    })
  }

  private addDecor(): void {
    // Add some atmospheric details like small boxes and debris
    const decorPositions = [
      [5, 0.5, 5],
      [-10, 0.5, 8],
      [15, 0.5, -5],
      [-5, 0.5, -15],
      [25, 0.5, 5]
    ]

    decorPositions.forEach((pos) => {
      const decorGeometry = new THREE.BoxGeometry(1.5, 1, 1.5)
      const decorMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a3a3a,
        metalness: 0.3,
        roughness: 0.7
      })
      const decor = new THREE.Mesh(decorGeometry, decorMaterial)
      decor.position.set(pos[0], pos[1], pos[2])
      decor.castShadow = true
      decor.receiveShadow = true
      this.mesh.add(decor)
    })
  }

  private loadFactoryModel(scene: THREE.Scene, world: CANNON.World): void {
    const loader = new GLTFLoader()
    const path = '/ImageToStl.com_abandoned-factory.glb'
    console.log('Attempting to load factory model from:', path)
    loader.load(
      path,
      (gltf) => {
        console.log('Factory model loaded successfully')
        // Replace procedural geometry with the loaded model
        this.mesh.clear()
        const model = gltf.scene
        model.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            const mesh = node as THREE.Mesh
            mesh.castShadow = true
            mesh.receiveShadow = true
          }
        })

        // Ensure model is up-to-scale and centered so player will see it
        model.updateMatrixWorld(true)
        const box = new THREE.Box3().setFromObject(model)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        console.log('Loaded factory model bbox:', box, 'size:', size)

        // Auto-scale if model is huge
        const maxDim = Math.max(size.x, size.y, size.z)
        if (maxDim > 100) {
          const scale = 60 / maxDim
          model.scale.multiplyScalar(scale)
          model.updateMatrixWorld(true)
          box.setFromObject(model)
          box.getSize(size)
          box.getCenter(center)
          console.log('Scaled factory model to', scale, 'new size:', size)
        }

        // Auto-scale up if model is very small compared to procedural factory
        if (maxDim > 0 && maxDim < 5) {
          const scaleUp = 60 / Math.max(maxDim, 0.0001)
          model.scale.multiplyScalar(scaleUp)
          model.updateMatrixWorld(true)
          box.setFromObject(model)
          box.getSize(size)
          box.getCenter(center)
          console.log('Scaled up small factory model to', scaleUp, 'new size:', size)
        }

        // Reposition so the model base sits at y=0 and it's centered on origin
        model.position.x -= center.x
        model.position.z -= center.z
        model.position.y -= box.min.y
        model.updateMatrixWorld(true)

        // Recompute bounding box/center/size after final scale/position
        box.setFromObject(model)
        box.getSize(size)
        box.getCenter(center)

        // Save metadata so external systems (e.g. GameEngine) can adjust player position
        this.center.copy(center)
        this.size.copy(size)
        this.loaded = true

        // Add a simple visible floor so we have something to stand on (in case the model doesn't include one)
        const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(Math.max(size.x, size.z) * 3 || 200, Math.max(size.x, size.z) * 3 || 200),
          new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.2, roughness: 0.8 })
        )
        ground.rotation.x = -Math.PI / 2
        ground.position.y = 0
        ground.receiveShadow = true
        this.mesh.add(ground)

        // Add model to scene
        this.mesh.add(model)

        // Add a single simplified collider for the whole model to reduce physics cost
        try {
          const halfExtents = new CANNON.Vec3(size.x / 2 || 1, size.y / 2 || 1, size.z / 2 || 1)
          const bigBox = new CANNON.Box(halfExtents)
          const body = new CANNON.Body({ mass: 0 })
          body.addShape(bigBox)
          // position the collider at the model center
          body.position.set(center.x, center.y, center.z)
          world.addBody(body)
          console.log('Factory model loaded and single collider added; world bodies:', world.bodies.length)
        } catch (err) {
          console.warn('Failed to add simplified collider, falling back to per-mesh colliders:', err)
          // fallback: add per-mesh colliders (best-effort)
          model.updateMatrixWorld(true)
          model.traverse((node) => {
            if ((node as THREE.Mesh).isMesh && node.geometry) {
              const mesh = node as THREE.Mesh
              try {
                mesh.geometry.computeBoundingBox()
                const bbox = mesh.geometry.boundingBox!
                const localSize = new THREE.Vector3()
                bbox.getSize(localSize)
                const worldScale = new THREE.Vector3()
                mesh.getWorldScale(worldScale)
                localSize.multiply(worldScale)
                if (localSize.x <= 0 || localSize.y <= 0 || localSize.z <= 0) return
                const half = new CANNON.Vec3(localSize.x / 2, localSize.y / 2, localSize.z / 2)
                const boxShape = new CANNON.Box(half)
                const pos = new THREE.Vector3()
                mesh.getWorldPosition(pos)
                const body = new CANNON.Body({ mass: 0 })
                body.addShape(boxShape)
                body.position.set(pos.x, pos.y, pos.z)
                world.addBody(body)
              } catch (e) {
                // ignore per-mesh collider failures
              }
            }
          })
          console.log('Factory model loaded and per-mesh colliders added; world bodies:', world.bodies.length)
        }
      },
      undefined,
      (err) => {
        console.error('Error loading factory model:', err)
        console.log('Using procedural factory as fallback')
        // Procedural factory is already in the scene, so we're good
        this.loaded = true
      }
    )
  }
}
