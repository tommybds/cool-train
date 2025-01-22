import React, { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

export function Train() {
  const trainRef = useRef<THREE.Group>(null)
  const { gl, camera, controls } = useThree()
  const [cameraMode, setCameraMode] = useState<'thirdPerson' | 'cockpit'>('thirdPerson')
  
  useFrame((state, delta) => {
    if (!trainRef.current) return
    
    if (gl.userData.forward) {
      trainRef.current.position.z -= delta * 5
    }
    if (gl.userData.backward) {
      trainRef.current.position.z += delta * 5
    }

    // Mise à jour de la cible des contrôles
    if (controls) {
      controls.target.copy(trainRef.current.position)
      if (cameraMode === 'cockpit') {
        camera.position.set(
          trainRef.current.position.x,
          trainRef.current.position.y + 2.3,
          trainRef.current.position.z - 0.5
        )
      }
    }
  })

  // Gestion du changement de caméra
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'KeyC') {
        setCameraMode(prev => prev === 'thirdPerson' ? 'cockpit' : 'thirdPerson')
      }
    }
    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [])

  return (
    <group ref={trainRef}>
      {/* Corps principal */}
      <mesh castShadow position={[0, 1.2, 0]}>
        <boxGeometry args={[2.2, 2, 5]} />
        <meshStandardMaterial color="#1a237e" />
      </mesh>

      {/* Cabine */}
      <mesh castShadow position={[0, 2.3, -1]}>
        <boxGeometry args={[2, 1, 2]} />
        <meshStandardMaterial color="#303f9f" />
      </mesh>

      {/* Fenêtres de la cabine */}
      <mesh position={[0, 2.3, -2]}>
        <boxGeometry args={[1.8, 0.8, 0.1]} />
        <meshStandardMaterial color="#90caf9" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0.9, 2.3, -1]}>
        <boxGeometry args={[0.1, 0.8, 1.8]} />
        <meshStandardMaterial color="#90caf9" transparent opacity={0.3} />
      </mesh>
      <mesh position={[-0.9, 2.3, -1]}>
        <boxGeometry args={[0.1, 0.8, 1.8]} />
        <meshStandardMaterial color="#90caf9" transparent opacity={0.3} />
      </mesh>

      {/* Tableau de bord */}
      <mesh position={[0, 1.8, -1.8]}>
        <boxGeometry args={[1.5, 0.4, 0.1]} />
        <meshStandardMaterial color="#212121" />
      </mesh>

      {/* Cheminée */}
      <mesh castShadow position={[0, 3, 0.5]}>
        <cylinderGeometry args={[0.2, 0.3, 0.8]} />
        <meshStandardMaterial color="#424242" />
      </mesh>

      {/* Roues */}
      {[-1.5, 0, 1.5].map((z) => (
        <React.Fragment key={z}>
          <mesh castShadow position={[0.8, 0.5, z]}>
            <cylinderGeometry args={[0.5, 0.5, 0.2, 16]} rotation={[0, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#424242" />
          </mesh>
          <mesh castShadow position={[-0.8, 0.5, z]}>
            <cylinderGeometry args={[0.5, 0.5, 0.2, 16]} rotation={[0, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#424242" />
          </mesh>
        </React.Fragment>
      ))}

      {/* Détails avant */}
      <mesh castShadow position={[0, 0.8, -2.4]}>
        <boxGeometry args={[1.5, 0.4, 0.2]} />
        <meshStandardMaterial color="#b71c1c" />
      </mesh>
    </group>
  )
}