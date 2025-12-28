import { Sparkles } from '@react-three/drei'
import { useTrainStore } from '../stores/trainStore'
import * as THREE from 'three'

interface ModernBrakeSparklesProps {
  position: THREE.Vector3
}

export function ModernBrakeSparkles({ position }: ModernBrakeSparklesProps) {
  const isBraking = useTrainStore((state) => state.isBraking)
  const speed = useTrainStore((state) => state.speed)
  
  if (!isBraking || speed < 0.5) return null
  
  return (
    <Sparkles
      position={[position.x - 0.5, position.y + 0.2, position.z]}
      count={Math.floor(10 + speed * 5)}
      scale={[1, 0.5, 1]}
      size={2 + speed}
      speed={0.4 + speed * 0.2}
      color="#ffaa00"
      opacity={0.6 + speed * 0.2}
    />
  )
}

