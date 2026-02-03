# Adding Custom GLB Models to Your Game

## Overview
The game is set up to load custom 3D models in GLB format. You have two main models to replace:

1. **Player Model** - First-person camera object
2. **Factory/Map Model** - The environment/level

## File Locations

### Player Model
**Path:** `public/models/Player.glb`

The player model is loaded in [src/game/entities/Player.ts](src/game/entities/Player.ts#L35) with:
```typescript
loader.load('models/Player.glb', (gltf) => {
  // Model is loaded and added to the player's mesh group
})
```

### Factory/Map Model
**Path:** `public/models/factory/abandoned-factory.glb`

The factory model is loaded in [src/game/entities/Factory.ts](src/game/entities/Factory.ts#L181) with:
```typescript
loader.load('models/factory/abandoned-factory.glb', (gltf) => {
  // Model replaces procedural geometry
})
```

## Steps to Add Your Custom Models

### 1. Replace the Player Model
- Export your custom player model as GLB format from Blender, 3ds Max, or other 3D software
- Place it at: `public/models/Player.glb`
- That's it! The game will automatically load it on startup

### 2. Replace the Factory/Map Model
- Export your custom map/environment as GLB format
- Create the folder structure if it doesn't exist: `public/models/factory/`
- Place it at: `public/models/factory/abandoned-factory.glb`
- The game will auto-scale it if needed (max dimension > 100 units)

## Important Notes

### Model Scale & Positioning
- The factory model is automatically scaled and repositioned in [src/game/entities/Factory.ts](src/game/entities/Factory.ts#L200)
- If your model is very large (max dimension > 100 units), it will be scaled down proportionally
- The model base should sit at y=0 (ground level)

### Physics
- **Current limitation:** The loaded models are visual only. Physics are handled separately.
- For the factory: A ground plane and procedural physics shapes are used
- For the player: A capsule-shaped physics body (0.5 radius) is used
- The models are purely for visual appearance

### Materials & Textures
- Make sure all textures are embedded in the GLB file or in the same directory
- The loader will automatically apply shadows and lighting to your model
- All meshes in your model will have `castShadow` and `receiveShadow` enabled

### Optimization Tips
- Keep polygon count reasonable (< 100k triangles for smooth gameplay)
- Bake lighting if possible to reduce runtime complexity
- Use compressed textures (ASTC, BCn formats)

## Testing Your Models

1. Export your GLB files to the paths above
2. Run the dev server: `npm run dev`
3. Open the game in your browser
4. Your custom models should appear automatically

## Troubleshooting

If your model doesn't appear:
- Check browser console for loading errors
- Ensure the file path is correct
- Verify the GLB file is valid and properly exported
- Check that textures are embedded or in the correct location
