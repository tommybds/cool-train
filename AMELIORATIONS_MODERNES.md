# Améliorations avec Composants Modernes

Ce document détaille les améliorations possibles en utilisant les dernières versions des bibliothèques et les patterns modernes.

## 1. Système de Particules Moderne

### Remplacement de SmokeParticles et BrakeSparkles

**Actuel** : Système de particules manuel avec BufferGeometry
**Amélioration** : Utiliser `@react-three/drei` ParticleSystem ou `@react-three/postprocessing` ParticleSystem

```typescript
// Nouveau composant avec @react-three/drei
import { Trail, Sparkles } from '@react-three/drei'

// Pour la fumée
<Trail
  width={0.5}
  length={8}
  color={new THREE.Color(0xcccccc)}
  attenuation={(width) => width}
>
  <mesh position={[0, 1.5, 0]} />
</Trail>

// Pour les étincelles
<Sparkles
  count={50}
  scale={[2, 2, 2]}
  size={2}
  speed={0.4}
  color="#ffaacc"
  opacity={0.8}
/>
```

**Avantages** :
- Performance optimisée
- Moins de code à maintenir
- Effets visuels plus riches
- Support natif des shaders

## 2. Gestion d'État avec Zustand (déjà présent mais sous-utilisé)

### Store Centralisé

**Actuel** : Props drilling et useState dispersés
**Amélioration** : Store Zustand centralisé

```typescript
// stores/trainStore.ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import * as THREE from 'three'

interface TrainState {
  position: THREE.Vector3
  rotation: THREE.Euler
  speed: number
  wagonCount: number
  fuelLevel: number
  pressure: number
  setPosition: (pos: THREE.Vector3) => void
  setSpeed: (speed: number) => void
  addWagon: () => void
  removeWagon: () => void
}

export const useTrainStore = create<TrainState>()(
  subscribeWithSelector((set) => ({
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
    speed: 0.91,
    wagonCount: 3,
    fuelLevel: 100,
    pressure: 5,
    setPosition: (pos) => set({ position: pos }),
    setSpeed: (speed) => set({ speed }),
    addWagon: () => set((state) => ({ 
      wagonCount: Math.min(state.wagonCount + 1, 10) 
    })),
    removeWagon: () => set((state) => ({ 
      wagonCount: Math.max(state.wagonCount - 1, 1) 
    })),
  }))
)

// Utilisation dans les composants
const speed = useTrainStore((state) => state.speed)
const setSpeed = useTrainStore((state) => state.setSpeed)
```

**Avantages** :
- État centralisé et prévisible
- Évite le props drilling
- Performance avec sélecteurs
- Middleware pour persist, devtools, etc.

## 3. Système de Caméra Amélioré

### Utiliser CameraControls de drei

**Actuel** : OrbitControls basique
**Amélioration** : CameraControls avec transitions fluides

```typescript
import { CameraControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'

function CameraSystem({ viewMode }: { viewMode: 'external' | 'cockpit' }) {
  const { camera } = useThree()
  const controlsRef = useRef<CameraControls>(null)
  const trainPosition = useTrainStore((state) => state.position)
  
  useEffect(() => {
    if (viewMode === 'cockpit') {
      controlsRef.current?.setLookAt(
        trainPosition.x,
        trainPosition.y + 1.5,
        trainPosition.z,
        trainPosition.x,
        trainPosition.y + 1.5,
        trainPosition.z - 5,
        true // smooth transition
      )
    }
  }, [viewMode, trainPosition])
  
  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      enabled={viewMode === 'external'}
      minDistance={5}
      maxDistance={30}
      polarRotateSpeed={0.3}
      azimuthRotateSpeed={0.3}
    />
  )
}
```

**Avantages** :
- Transitions fluides automatiques
- Meilleure gestion des limites
- Support du touch pour mobile
- API plus intuitive

## 4. Système de Sons avec Tone.js (déjà présent mais non utilisé)

### Audio Spatialisé 3D

**Actuel** : HTML5 Audio simple
**Amélioration** : Audio spatialisé avec Tone.js et Web Audio API

```typescript
import * as Tone from 'tone'
import { useFrame } from '@react-three/fiber'
import { useThree } from '@react-three/fiber'

function SpatialAudio({ position, soundUrl }: { position: THREE.Vector3, soundUrl: string }) {
  const { camera } = useThree()
  const pannerRef = useRef<Tone.Panner>()
  const playerRef = useRef<Tone.Player>()
  
  useEffect(() => {
    const panner = new Tone.Panner(0).toDestination()
    const player = new Tone.Player(soundUrl).connect(panner)
    
    pannerRef.current = panner
    playerRef.current = player
    
    return () => {
      player.dispose()
      panner.dispose()
    }
  }, [soundUrl])
  
  useFrame(() => {
    if (pannerRef.current && camera) {
      // Calculer la position relative à la caméra
      const relativePos = position.clone().sub(camera.position)
      const pan = Math.max(-1, Math.min(1, relativePos.x / 10))
      pannerRef.current.pan.value = pan
      
      // Calculer le volume selon la distance
      const distance = camera.position.distanceTo(position)
      const volume = Math.max(0, 1 - distance / 50)
      playerRef.current?.volume.setValueAtTime(volume, Tone.now())
    }
  })
  
  return null
}
```

**Avantages** :
- Audio spatialisé réaliste
- Meilleure immersion
- Contrôle fin du son
- Support des effets audio

## 5. Système de LOD (Level of Detail)

### Utiliser LOD de drei

**Actuel** : Tous les éléments rendus à la même qualité
**Amélioration** : LOD automatique

```typescript
import { Detailed, useLOD } from '@react-three/drei'

function Tree({ position }: { position: THREE.Vector3 }) {
  const lod = useLOD()
  
  return (
    <group position={position}>
      <Detailed distances={[0, 10, 20, 50]} ref={lod}>
        {/* Version haute qualité */}
        <mesh>
          <cylinderGeometry args={[0.2, 0.3, 3, 16]} />
          <meshStandardMaterial color="#3e2723" />
        </mesh>
        {/* Version moyenne qualité */}
        <mesh>
          <cylinderGeometry args={[0.2, 0.3, 3, 8]} />
          <meshStandardMaterial color="#3e2723" />
        </mesh>
        {/* Version basse qualité */}
        <mesh>
          <boxGeometry args={[0.3, 3, 0.3]} />
          <meshStandardMaterial color="#3e2723" />
        </mesh>
      </Detailed>
    </group>
  )
}
```

**Avantages** :
- Performance améliorée
- Réduction automatique de la complexité
- Meilleure expérience utilisateur

## 6. Instancing pour les Éléments Répétitifs

### Utiliser Instances de drei

**Actuel** : Rendu individuel de chaque arbre/rocher
**Amélioration** : Instancing pour les éléments répétitifs

```typescript
import { Instances, Instance } from '@react-three/drei'
import { useMemo } from 'react'

function TreeInstances({ positions }: { positions: THREE.Vector3[] }) {
  const treeGeometry = useMemo(() => new THREE.ConeGeometry(1.5, 3, 8), [])
  const trunkGeometry = useMemo(() => new THREE.CylinderGeometry(0.2, 0.3, 3, 8), [])
  
  return (
    <Instances limit={1000} range={positions.length}>
      <coneGeometry args={[1.5, 3, 8]} />
      <meshStandardMaterial color="#2e7d32" />
      {positions.map((pos, i) => (
        <Instance key={i} position={pos} />
      ))}
    </Instances>
  )
}
```

**Avantages** :
- Performance drastiquement améliorée
- Support de milliers d'instances
- Moins de draw calls

## 7. Système de Post-Processing Amélioré

### Utiliser @react-three/postprocessing

**Actuel** : Post-processing basique
**Amélioration** : Effets avancés

```typescript
import { EffectComposer, Bloom, Vignette, ChromaticAberration, DepthOfField } from '@react-three/postprocessing'

function PostProcessing() {
  const weatherType = useWeatherStore((state) => state.type)
  
  return (
    <EffectComposer>
      <Bloom intensity={weatherType === 'stormy' ? 1.5 : 0.5} />
      <Vignette eskil={false} offset={0.1} darkness={0.5} />
      <ChromaticAberration offset={[0.001, 0.001]} />
      {weatherType === 'foggy' && (
        <DepthOfField focusDistance={0.1} focalLength={0.02} bokehScale={2} height={480} />
      )}
    </EffectComposer>
  )
}
```

**Avantages** :
- Effets visuels plus riches
- Performance optimisée
- Facile à combiner

## 8. Système de Raycasting pour Interactions

### Interactions avec le train

```typescript
import { useRaycast } from '@react-three/drei'
import { useThree } from '@react-three/fiber'

function InteractiveWagon({ position }: { position: THREE.Vector3 }) {
  const { raycaster, pointer, camera } = useThree()
  const [hovered, setHovered] = useState(false)
  
  useFrame(() => {
    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObject(meshRef.current)
    setHovered(intersects.length > 0)
  })
  
  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.1 : 1}
    >
      {/* Wagon geometry */}
    </mesh>
  )
}
```

## 9. Système de Gestion de Scène avec Suspense

### Chargement progressif

```typescript
import { Suspense } from 'react'
import { Loader } from '@react-three/drei'

function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Canvas>
        <Suspense fallback={<LoadingScreen />}>
          <Train />
        </Suspense>
        <Suspense fallback={null}>
          <Environment />
        </Suspense>
        <Suspense fallback={null}>
          <WaterSystem />
        </Suspense>
      </Canvas>
    </Suspense>
  )
}
```

## 10. Utiliser React 19 Features (si disponible)

### use() Hook pour les promesses

```typescript
import { use } from 'react'

function ModelLoader({ url }: { url: string }) {
  const model = use(useGLTF(url))
  return <primitive object={model.scene} />
}
```

## 11. Système de Performance avec usePerformanceMonitor

### Monitoring avancé

```typescript
import { PerformanceMonitor } from '@react-three/drei'

function AdaptiveQuality() {
  const [dpr, setDpr] = useState(1.5)
  
  return (
    <PerformanceMonitor
      onDecline={() => setDpr(1)}
      onIncline={() => setDpr(1.5)}
    >
      <Canvas dpr={dpr}>
        {/* Scene */}
      </Canvas>
    </PerformanceMonitor>
  )
}
```

## 12. Système de Navigation avec useKeyboardControls amélioré

### Contrôles plus robustes

```typescript
import { useKeyboardControls } from '@react-three/drei'
import { useEffect } from 'react'

function TrainControls() {
  const [, get] = useKeyboardControls()
  const setSpeed = useTrainStore((state) => state.setSpeed)
  
  useFrame(() => {
    const { forward, backward } = get()
    const currentSpeed = useTrainStore.getState().speed
    
    if (forward) {
      setSpeed(Math.min(2.0, currentSpeed + 0.01))
    }
    if (backward) {
      setSpeed(Math.max(0, currentSpeed - 0.01))
    }
  })
  
  return null
}
```

## 13. Système de Textures avec useTexture

### Chargement optimisé

```typescript
import { useTexture } from '@react-three/drei'

function TexturedGround() {
  const [diffuse, normal, roughness] = useTexture([
    '/textures/ground/diffuse.jpg',
    '/textures/ground/normal.jpg',
    '/textures/ground/roughness.jpg'
  ])
  
  return (
    <mesh>
      <planeGeometry args={[1000, 1000]} />
      <meshStandardMaterial
        map={diffuse}
        normalMap={normal}
        roughnessMap={roughness}
      />
    </mesh>
  )
}
```

## 14. Système de Modèles 3D avec useGLTF

### Chargement de modèles optimisés

```typescript
import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'

function LocomotiveModel() {
  const { scene } = useGLTF('/models/locomotive.glb')
  const clonedScene = useMemo(() => scene.clone(), [scene])
  
  return <primitive object={clonedScene} />
}

// Préchargement
useGLTF.preload('/models/locomotive.glb')
```

## 15. Système de Shaders avec ShaderMaterial de drei

### Shaders plus simples

```typescript
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

const WaterMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(0x4499aa),
  },
  // Vertex shader
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform float time;
    uniform vec3 color;
    varying vec2 vUv;
    void main() {
      gl_FragColor = vec4(color, 0.8);
    }
  `
)

extend({ WaterMaterial })
```

## 16. Système de Gizmos pour Debug

### Outils de développement

```typescript
import { GizmoHelper, GizmoViewport, Grid, OrbitControls } from '@react-three/drei'

function DebugTools() {
  return (
    <>
      <Grid args={[10, 10]} />
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport axisColors={['red', 'green', 'blue']} labelColor="black" />
      </GizmoHelper>
    </>
  )
}
```

## 17. Système de Clipping Planes

### Découpage pour tunnels

```typescript
import { useThree } from '@react-three/fiber'

function TunnelClipping() {
  const { gl } = useThree()
  
  useEffect(() => {
    gl.localClippingEnabled = true
  }, [gl])
  
  return (
    <mesh>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial
        clippingPlanes={[new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)]}
        clipShadows
      />
    </mesh>
  )
}
```

## 18. Système de Mesh Refinement

### Géométrie adaptative

```typescript
import { useSimplification } from '@react-three/drei'

function SimplifiedTree({ geometry }: { geometry: THREE.BufferGeometry }) {
  const simplified = useSimplification(geometry, 0.5) // Réduire de 50%
  return <mesh geometry={simplified} />
}
```

## Résumé des Améliorations Prioritaires

1. **Instancing pour arbres/rochers** - Gain de performance majeur
2. **Store Zustand centralisé** - Meilleure architecture
3. **CameraControls** - Meilleure UX caméra
4. **LOD system** - Performance adaptative
5. **Post-processing avancé** - Meilleurs effets visuels
6. **Audio spatialisé** - Immersion améliorée
7. **Particules avec drei** - Code plus simple et performant

## Migration Progressive

1. Commencer par le store Zustand (impact architectural)
2. Ajouter Instancing pour les éléments répétitifs (performance)
3. Remplacer OrbitControls par CameraControls (UX)
4. Intégrer les particules de drei (simplicité)
5. Ajouter le post-processing avancé (visuels)
6. Implémenter l'audio spatialisé (immersion)

## Notes de Performance

- **Instancing** : Réduit les draw calls de 1000+ à 1-2
- **LOD** : Réduit la complexité géométrique selon la distance
- **Suspense** : Charge les ressources de manière asynchrone
- **useMemo/useCallback** : Évite les recalculs inutiles
- **Zustand selectors** : Évite les re-renders inutiles

