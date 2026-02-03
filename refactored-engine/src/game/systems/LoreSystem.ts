export class LoreSystem {
  private discoveredLore = new Set<string>()

  addLore(id: string, title: string, content: string): void {
    this.discoveredLore.add(id)
  }

  getLore(id: string): boolean {
    return this.discoveredLore.has(id)
  }

  getDiscoveryPercentage(): number {
    return (this.discoveredLore.size / 8) * 100
  }
}
