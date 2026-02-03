export interface CraftableItem {
  name: string
  description: string
  requiredItems: { [itemId: string]: number }
  effect: string
}

export class CraftingSystem {
  private craftables: { [key: string]: CraftableItem } = {
    barrier: {
      name: 'Protective Barrier',
      description: 'Creates a temporary force field that pushes away deformed creatures',
      requiredItems: {
        'scrap_metal': 3,
        'wire': 2,
        'battery': 1
      },
      effect: 'Grants 5 seconds of protection'
    },
    speed_boost: {
      name: 'Speed Boost',
      description: 'Accelerates your movement temporarily',
      requiredItems: {
        'motor_oil': 2,
        'spring': 3,
        'battery': 1
      },
      effect: 'Double movement speed for 8 seconds'
    },
    emp_device: {
      name: 'EMP Device',
      description: 'Temporarily disables nearby deformed creatures',
      requiredItems: {
        'circuit_board': 2,
        'wire': 4,
        'battery': 2
      },
      effect: 'Stun all creatures within 20m for 3 seconds'
    },
    healing_kit: {
      name: 'Medical Kit',
      description: 'Restores some of your health',
      requiredItems: {
        'bandage': 3,
        'medicine': 1,
        'water_bottle': 1
      },
      effect: 'Restore 50 health'
    },
    invisibility_cloak: {
      name: 'Invisibility Cloak',
      description: 'Makes you invisible to creatures briefly',
      requiredItems: {
        'cloth': 4,
        'mirror_shard': 2,
        'battery': 2
      },
      effect: 'Become invisible for 6 seconds'
    }
  }

  canCraft(itemId: string, inventory: { [itemId: string]: number }): boolean {
    const recipe = this.craftables[itemId]
    if (!recipe) return false

    for (const [requiredItem, amount] of Object.entries(recipe.requiredItems)) {
      if (!inventory[requiredItem] || inventory[requiredItem] < amount) {
        return false
      }
    }
    return true
  }

  craft(itemId: string, inventory: { [itemId: string]: number }): CraftableItem | null {
    if (!this.canCraft(itemId, inventory)) {
      return null
    }

    const recipe = this.craftables[itemId]
    // Remove required items from inventory
    for (const [requiredItem, amount] of Object.entries(recipe.requiredItems)) {
      inventory[requiredItem] -= amount
    }

    return recipe
  }

  getCraftables(): { [key: string]: CraftableItem } {
    return this.craftables
  }

  getRecipe(itemId: string): CraftableItem | null {
    return this.craftables[itemId] || null
  }
}
