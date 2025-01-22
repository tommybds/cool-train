import React, { useRef, useCallback, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls } from '@react-three/drei'
import { ViewMode } from '../App'

interface TrainProps {
  controlsRef: React.RefObject<OrbitControls>
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export function Train({ controlsRef, viewMode, onViewModeChange }: TrainProps) {
  const trainRef = useRef<THREE.Group>(null)
  const { gl, camera } = useThree()
  const lastTrainPosition = useRef(new THREE.Vector3())
  const pedestrianPosition = useRef(new THREE.Vector3(15, 2, 0))
  
  useFrame((state, delta) => {
    if (!trainRef.current) return
    
    if (gl.userData.forward) {
      trainRef.current.position.z -= delta * 5
    }
    if (gl.userData.backward) {
      trainRef.current.position.z += delta * 5
    }

    const trainPosition = trainRef.current.position
    
    switch (viewMode) {
      case 'thirdPerson':
        if (controlsRef.current) {
          controlsRef.current.target.copy(trainPosition)
          
          const movement = new THREE.Vector3().subVectors(trainPosition, lastTrainPosition.current)
          camera.position.add(movement)
        }
        lastTrainPosition.current.copy(trainPosition)
        break
        
      case 'cockpit':
        camera.position.set(
          trainPosition.x,
          trainPosition.y + 2.3,
          trainPosition.z - 0.5
        )
        camera.lookAt(new THREE.Vector3(
          trainPosition.x,
          trainPosition.y + 2.3,
          trainPosition.z - 20
        ))
        break
        
      case 'pedestrian':
        camera.position.copy(pedestrianPosition.current)
        camera.lookAt(trainPosition)
        break
    }
  })

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.code === 'KeyC') {
      const modes: ViewMode[] = ['thirdPerson', 'cockpit', 'pedestrian']
      const currentIndex = modes.indexOf(viewMode)
      const nextMode = modes[(currentIndex + 1) % modes.length]
      
      if (nextMode === 'thirdPerson' && trainRef.current) {
        const pos = trainRef.current.position
        camera.position.set(
          pos.x + 10,
          pos.y + 5,
          pos.z + 10
        )
        if (controlsRef.current) {
          controlsRef.current.target.copy(pos)
        }
        lastTrainPosition.current.copy(pos)
      } else if (nextMode === 'pedestrian') {
        camera.position.copy(pedestrianPosition.current)
      }
      
      onViewModeChange(nextMode)
    }
  }, [camera, controlsRef, viewMode, onViewModeChange])

  useEffect(() => {
    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [handleKeyPress])

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