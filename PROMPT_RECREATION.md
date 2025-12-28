# Prompt de Recréation - Simulateur de Train 3D

## Description Générale

Créer un simulateur de train 3D interactif en utilisant React, TypeScript, Three.js et React Three Fiber. L'application doit offrir une expérience immersive avec un train qui se déplace sur des rails générés procéduralement, un environnement dynamique avec météo et cycle jour/nuit, et des effets visuels avancés.

## Stack Technique

- **Framework**: React 18+ avec TypeScript
- **3D**: Three.js 0.172+ avec React Three Fiber 8.17+
- **Bibliothèques 3D**: 
  - @react-three/drei (composants utilitaires)
  - @react-three/rapier (physique)
  - @react-three/postprocessing (post-processing)
- **Build**: Vite 6+
- **Audio**: HTML5 Audio API
- **Génération procédurale**: simplex-noise
- **State Management**: Zustand (optionnel)

## Fonctionnalités Principales

### 1. Système de Train

#### Locomotive
- Modèle 3D animé de locomotive avec roues qui tournent
- Système de fumée avec particules animées :
  - Émission de fumée proportionnelle à la vitesse
  - Particules avec mouvement vertical et horizontal
  - Texture de fumée générée dynamiquement
  - Opacité et taille variables selon l'âge des particules
- Animation des roues synchronisée avec la vitesse

#### Wagons
- Système de wagons attachés dynamiquement (1 à 10 wagons)
- Wagons colorés avec palette de 6 couleurs différentes
- Animation d'ajout/suppression avec transition de scale et opacity
- Wagons suivent la locomotive le long du chemin avec espacement correct
- Son d'ajout/suppression de wagon

#### Physique et Mouvement
- Vitesse variable de 0 à 2.0 unités
- Accélération/décélération avec touches W/S ou flèches haut/bas
- Le train suit un chemin généré procéduralement
- Rotation automatique selon la direction du chemin
- Gestion des pentes avec rotation sur l'axe X
- Interpolation fluide des positions et rotations

### 2. Génération Procédurale du Chemin

- Génération infinie de sections de chemin
- Chaque section fait ~80 unités de long
- Variation d'angle entre sections (±30 degrés)
- Variation de hauteur avec limites (0-50 unités)
- Lissage des transitions avec courbes de Bézier
- Génération automatique de nouvelles sections quand le train approche de la fin

### 3. Système de Rails

- Rails métalliques avec matériau réaliste (metalness: 0.8, roughness: 0.4)
- Traverses en bois placées régulièrement
- Rails générés dynamiquement le long du chemin
- Espacement correct entre rails (1.5 unités)
- Rails et traverses orientés selon la direction du chemin

### 4. Système de Caméra

#### Vue Externe (par défaut)
- Caméra qui suit le train à distance
- Contrôles OrbitControls pour rotation autour du train
- Distance minimale: 5 unités, maximale: 30 unités
- Angle de vue limité (20-40 degrés de l'horizon)
- Zoom avec molette de souris
- Pan disponible

#### Vue Cockpit
- Vue à la première personne depuis la cabine du conducteur
- Position de caméra à l'intérieur de la locomotive
- Orientation automatique selon la direction du train
- Tableau de bord avec instruments :
  - Compteur de vitesse (0-maxSpeed km/h) avec aiguille animée
  - Manomètre de pression (0-10 bar) avec aiguille animée
  - Jauge de carburant (0-100%) avec aiguille animée
  - Odomètre affichant la distance parcourue
  - Voyant de freinage (rouge quand on freine)
- Fenêtre avant avec transparence
- Contrôles visuels (volant, levier de frein)
- Commutateur de vue avec touche V

### 5. Système de Météo

#### Types de Météo
- **Clear** (Dégagé) : Ciel bleu, pas de précipitations
- **Cloudy** (Nuageux) : Nuages, lumière réduite
- **Rainy** (Pluvieux) : Pluie avec particules, brouillard léger
- **Stormy** (Orageux) : Pluie intense, éclairs aléatoires, vent fort
- **Snowy** (Neigeux) : Flocons de neige, brouillard blanc
- **Foggy** (Brouillard) : Brouillard dense, visibilité réduite

#### Effets Visuels
- Système de particules pour pluie (5000 particules max)
- Système de particules pour neige (3000 particules max)
- Nuages dynamiques avec @react-three/drei Clouds
- Éclairs aléatoires pendant les orages (lumière ponctuelle)
- Brouillard avec THREE.FogExp2
- Changement de couleur de fond selon la météo
- Intensité réglable (0-1) avec touches [ et ]

#### Contrôles
- F1: Clear
- F2: Cloudy
- F3: Rainy
- F4: Stormy
- F5: Snowy
- F6: Foggy
- [ : Réduire l'intensité
- ] : Augmenter l'intensité

### 6. Cycle Jour/Nuit

- Cycle automatique ou manuel
- 6 phases : Minuit → Aube → Jour → Crépuscule → Nuit → Minuit
- Position dynamique du soleil (lumière directionnelle)
- Position dynamique de la lune (lumière directionnelle)
- Étoiles visibles la nuit (2000 étoiles)
- Ciel dynamique avec composant Sky de drei
- Lumière ambiante qui change selon l'heure
- Lumière hémisphérique pour éclairage naturel
- Lumière ponctuelle supplémentaire la nuit
- Couleur du ciel change selon l'heure et la météo
- Contrôles :
  - T : Activer/désactiver rotation automatique
  - . : Avancer le temps (si rotation désactivée)
  - , : Reculer le temps (si rotation désactivée)

### 7. Environnement 3D

#### Terrain
- Terrain généré avec simplex noise
- Grille de sol qui suit le train
- Hauteur variable du terrain
- Système de chunks pour optimisation

#### Éléments Naturels
- **Arbres** : Génération procédurale avec tronc et feuillage
  - Densité réglable (0-1)
  - Évite les zones proches des rails
  - Utilise simplex noise pour distribution naturelle
- **Rochers** : Modèles icosaèdres avec variations
  - Densité réglable (0-1)
  - Placement aléatoire mais cohérent
- **Herbe** : Petits éléments de végétation
  - Densité élevée (0-1)
  - Modèles simples avec plusieurs tiges

#### Système d'Eau
- Génération de lacs (3 lacs aléatoires)
- Génération de rivières le long du chemin
- Shaders personnalisés pour l'eau :
  - Vagues animées avec plusieurs fréquences
  - Effet Fresnel pour réflexion du ciel
  - Texture de bruit pour variations
  - Couleur d'eau réaliste (bleu-vert)
  - Transparence et opacité variables
- Rivières avec méandres naturels
- Lacs avec contours irréguliers

#### Infrastructures (optionnel)
- Tunnels
- Ponts
- Gares
- Densité réglable

### 8. Effets Visuels

#### Particules de Fumée
- Système de particules avec shaders personnalisés
- Texture générée dynamiquement (gradient radial)
- Mouvement vertical et horizontal
- Croissance et fade-out selon l'âge
- Intensité proportionnelle à la vitesse

#### Étincelles de Freinage
- Particules émises lors du freinage
- Texture d'étincelle (gradient orange-rouge)
- Physique avec gravité
- Direction vers l'arrière lors du freinage
- Visible uniquement si vitesse > 0.5

#### Ombres
- Ombres douces (SoftShadows)
- Ombres de contact sous les objets
- Résolution d'ombre : 2048x2048

#### Post-Processing
- Adaptive DPR pour performance
- Adaptive Events
- Performance Monitor intégré

### 9. Système de Carburant et Pression

- Jauge de carburant (0-100%)
- Consommation proportionnelle à la vitesse
- Le train ralentit si carburant = 0
- Manomètre de pression (0-10 bar)
- Pression diminue avec la vitesse
- Affichage dans le cockpit et dans l'UI

### 10. Interface Utilisateur

#### HUD Principal
- Affichage de la vitesse
- Nombre de wagons
- Mode de vue (external/cockpit)
- Niveau de carburant
- Type de météo actuel
- Instructions de contrôle

#### Menu (ESC)
- Sélection du type de météo (boutons)
- Slider d'intensité météo
- Contrôles du cycle jour/nuit :
  - Checkbox rotation automatique
  - Slider temps de la journée
- Boutons ajouter/retirer wagon
- Bouton changer de vue
- Bouton fermer le menu

#### Compteur de Distance
- Affichage de la distance parcourue
- Format : X km YYY m
- Position fixe en haut à droite

#### Stats de Performance
- FPS en temps réel
- Mémoire utilisée (si disponible)
- Position fixe en haut à droite

### 11. Système Audio

- Son d'ajout de wagon (`/sounds/wagon_add.mp3`)
- Son de suppression de wagon (`/sounds/wagon_remove.mp3`)
- Son de freinage en boucle (`/sounds/brake.mp3`)
- Sons chargés au démarrage
- Gestion via window.wagonSounds

### 12. Contrôles Clavier

- **W** ou **↑** : Accélérer
- **S** ou **↓** : Ralentir/Freiner
- **A** : Ajouter un wagon
- **R** : Retirer un wagon
- **V** : Changer de vue (cockpit/externe)
- **ESC** : Ouvrir/fermer le menu
- **F1-F6** : Changer le type de météo
- **[** : Réduire intensité météo
- **]** : Augmenter intensité météo
- **T** : Activer/désactiver rotation automatique du temps
- **.** : Avancer le temps (si rotation désactivée)
- **,** : Reculer le temps (si rotation désactivée)
- **Souris** : Rotation de la caméra (vue externe)
- **Molette** : Zoom (vue externe)

### 13. Optimisations

- Système de chunks pour l'environnement
- Génération à la demande des éléments
- Culling des éléments hors de vue
- Adaptive DPR pour performance
- Performance Monitor pour surveillance
- Limite de wagons (max 10)
- Cooldown sur les touches pour éviter les spam

### 14. Structure de Fichiers Recommandée

```
src/
├── components/
│   ├── Train.tsx              # Composant principal du train
│   ├── AnimatedLocomotive.tsx  # Locomotive avec animations
│   ├── Wagon.tsx               # Composant wagon
│   ├── Path.tsx                # Affichage du chemin
│   ├── MovingGrid.tsx          # Grille qui suit le train
│   ├── Ground.tsx              # Terrain
│   ├── Cockpit.tsx             # Vue cockpit avec instruments
│   ├── SmokeParticles.tsx      # Système de fumée
│   ├── BrakeSparkles.tsx       # Étincelles de freinage
│   ├── WeatherSystem.tsx       # Système météo
│   ├── DayNightCycle.tsx      # Cycle jour/nuit
│   ├── Environment.tsx        # Environnement (arbres, rochers, etc.)
│   ├── WaterSystem.tsx         # Système d'eau
│   ├── DistanceCounter.tsx    # Compteur de distance
│   ├── Stats.tsx               # Stats de performance
│   └── TrackEvents.tsx         # Événements sur la voie
├── hooks/
│   └── useKeyboard.ts          # Hook pour gestion clavier
├── types.ts                    # Types TypeScript
├── App.tsx                     # Composant principal
└── main.tsx                    # Point d'entrée
```

### 15. Assets Requis

- `/sounds/wagon_add.mp3`
- `/sounds/wagon_remove.mp3`
- `/sounds/brake.mp3` (optionnel)
- `/textures/skybox/` (optionnel)

### 16. Dépendances Principales

```json
{
  "@react-three/drei": "^9.121.3",
  "@react-three/fiber": "^8.17.12",
  "@react-three/postprocessing": "^2.19.1",
  "@react-three/rapier": "^1.5.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "simplex-noise": "^4.0.3",
  "three": "^0.172.0",
  "zustand": "^5.0.3"
}
```

## Points Techniques Importants

1. **Génération Procédurale** : Utiliser simplex-noise pour générer des positions cohérentes mais aléatoires
2. **Performance** : Implémenter un système de chunks pour ne charger que ce qui est visible
3. **Physique** : Utiliser @react-three/rapier pour la physique (même si simplifiée ici)
4. **Shaders** : Créer des shaders personnalisés pour l'eau et les particules
5. **Animations** : Utiliser useFrame de React Three Fiber pour toutes les animations
6. **État** : Gérer l'état du train, météo, temps, etc. avec useState/useRef
7. **Audio** : Charger les sons au démarrage et les jouer selon les événements

## Notes de Design

- L'application doit être immersive et visuellement attrayante
- Les transitions doivent être fluides
- L'interface doit être intuitive et non intrusive
- Les performances doivent être optimisées pour une expérience fluide
- Le code doit être modulaire et maintenable

## Extensions Possibles

- Système de tunnels avec transition visuelle
- Gares avec arrêts automatiques
- Système de signaux ferroviaires
- Multiples types de locomotives
- Système de cargaison pour les wagons
- Mode multijoueur
- Enregistrement de parcours
- Système de missions/objectifs

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

