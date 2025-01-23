import * as THREE from 'three'

export interface TrainProps {
  onPathUpdate?: (points: THREE.Vector3[]) => void
  onPositionUpdate?: (position: THREE.Vector3) => void
  onSpeedUpdate?: (speed: number) => void
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