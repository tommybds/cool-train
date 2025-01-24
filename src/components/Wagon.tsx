import { useRef } from 'react'
import * as THREE from 'three'

interface WagonProps {
  position: THREE.Vector3
  rotation: THREE.Euler
  color: string
  scale?: number
  opacity?: number
}

export function Wagon({ position, rotation, color, scale = 1, opacity = 1 }: WagonProps) {
  const wagonRef = useRef<THREE.Group>(null)

  return (
    <group ref={wagonRef} position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[2.5, 1.4, 1.6]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} />
        
        <group position={[0, -0.8, 0]}>
          <mesh position={[-0.8, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.2]} />
            <meshStandardMaterial color="#424242" transparent opacity={opacity} />
          </mesh>
          <mesh position={[-0.8, 0, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.2]} />
            <meshStandardMaterial color="#424242" transparent opacity={opacity} />
          </mesh>
          <mesh position={[0.8, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.2]} />
            <meshStandardMaterial color="#424242" transparent opacity={opacity} />
          </mesh>
          <mesh position={[0.8, 0, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.2]} />
            <meshStandardMaterial color="#424242" transparent opacity={opacity} />
          </mesh>
        </group>
      </mesh>
    </group>
  )
} 