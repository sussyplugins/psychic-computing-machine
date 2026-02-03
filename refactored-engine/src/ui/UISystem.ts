import * as THREE from 'three'

export class UISystem {
  updatePosition(position: THREE.Vector3): void {
    document.getElementById('pos-x')!.textContent = position.x.toFixed(1)
    document.getElementById('pos-y')!.textContent = position.y.toFixed(1)
    document.getElementById('pos-z')!.textContent = position.z.toFixed(1)
  }

  updateHealth(health: number): void {
    document.getElementById('health')!.textContent = Math.max(0, health).toString()
  }

  updateCollected(count: number): void {
    document.getElementById('collected')!.textContent = count.toString()
  }
}
