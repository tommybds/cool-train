import { useRef } from 'react'
import { Trail } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useTrainStore } from '../stores/trainStore'

interface ModernSmokeProps {
  position: THREE.Vector3
}

export function ModernSmoke({ position }: ModernSmokeProps) {
  const trailRef = useRef<THREE.Group>(null)
  const speed = useTrainStore((state) => state.speed)
  
  useFrame(() => {
    if (trailRef.current) {
      trailRef.current.position.copy(position)
      trailRef.current.position.y += 1.4
    }
  })
  
  if (speed < 0.1) return null
  
  return (
    <group ref={trailRef}>
      <Trail
        width={0.3 + speed * 0.2}
        length={5 + speed * 3}
        color={new THREE.Color(0xcccccc)}
        attenuation={(width) => width * 0.8}
      >
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </Trail>
    </group>
  )
}

