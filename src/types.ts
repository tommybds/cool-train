import * as THREE from 'three'

declare global {
  interface Window {
    wagonSounds: {
      add: HTMLAudioElement
      remove: HTMLAudioElement
    }
  }
}

export interface TrainProps {
  onPathUpdate?: (points: THREE.Vector3[]) => void
  onPositionUpdate?: (position: THREE.Vector3) => void
  onSpeedUpdate?: (speed: number) => void
  onWagonCountUpdate?: (count: number) => void
  initialSpeed?: number
}

export interface MovingGridProps {
  position: THREE.Vector3
  size?: number
  divisions?: number
  points?: THREE.Vector3[]
}

export interface PathProps {
  points: THREE.Vector3[]
}

export interface EnvironmentProps {
  sceneType: 'mountain' | 'plain'
  weather: 'clear' | 'cloudy' | 'rainy'
  timeOfDay: 'morning' | 'noon' | 'evening' | 'night'
  onTerrainGenerated?: (getHeight: (x: number, z: number) => number) => void
  trainPosition?: THREE.Vector3
  trackPath?: THREE.CurvePath<THREE.Vector3>
}