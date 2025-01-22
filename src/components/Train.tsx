import React, { useRef, useCallback, useEffect, forwardRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControlsImpl, ViewMode } from '../types'

interface TrainProps {
  controlsRef: React.RefObject<OrbitControlsImpl>
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  getTerrainHeight?: (x: number, z: number) => number
}

const Train = forwardRef<THREE.Group, TrainProps>(
  ({ controlsRef, viewMode, onViewModeChange, getTerrainHeight }, ref) => {
    const { gl, camera } = useThree()
    const lastTrainPosition = useRef(new THREE.Vector3())
    const pedestrianPosition = useRef(new THREE.Vector3(15, 2, 0))
    
    useFrame((_, delta) => {
      if (!ref || !controlsRef.current || typeof ref === 'function') return
      
      const speed = 50
      if (gl.userData.forward) {
        ref.current.position.z -= delta * speed
      }
      if (gl.userData.backward) {
        ref.current.position.z += delta * speed
      }

      // Mettre à jour la hauteur du train selon le terrain
      if (getTerrainHeight) {
        const pos = ref.current.position
        const height = getTerrainHeight(pos.x, pos.z)
        pos.y = height + 0.5
      }

      const trainPosition = ref.current.position
      
      switch (viewMode) {
        case 'thirdPerson': {
          const controls = controlsRef.current as unknown as { target: THREE.Vector3 }
          controls.target.copy(trainPosition)
          const movement = new THREE.Vector3().subVectors(trainPosition, lastTrainPosition.current)
          camera.position.add(movement)
          lastTrainPosition.current.copy(trainPosition)
          break
        }
          
        case 'cockpit':
          camera.position.set(
            trainPosition.x,
            trainPosition.y + 2.3,
            trainPosition.z - 0.5
          )
          camera.lookAt(new THREE.Vector3(
            trainPosition.x,
            trainPosition.y + 2,
            trainPosition.z - 20
          ))
          break
          
        case 'pedestrian':
          if (getTerrainHeight) {
            const height = getTerrainHeight(pedestrianPosition.current.x, pedestrianPosition.current.z)
            pedestrianPosition.current.y = height + 2
          }
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
        
        if (nextMode === 'thirdPerson' && ref && typeof ref !== 'function' && ref.current) {
          const pos = ref.current.position
          camera.position.set(
            pos.x + 10,
            pos.y + 5,
            pos.z + 10
          )
          if (controlsRef.current) {
            const controls = controlsRef.current as unknown as { target: THREE.Vector3 }
            controls.target.copy(pos)
          }
          lastTrainPosition.current.copy(pos)
        } else if (nextMode === 'pedestrian') {
          camera.position.copy(pedestrianPosition.current)
        }
        
        onViewModeChange(nextMode)
      }
    }, [camera, controlsRef, viewMode, onViewModeChange, ref])

    useEffect(() => {
      window.addEventListener('keypress', handleKeyPress)
      return () => window.removeEventListener('keypress', handleKeyPress)
    }, [handleKeyPress])

    return (
      <group ref={ref}>
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
            <group position={[0.8, 0.5, z]} rotation={[0, 0, Math.PI / 2]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.5, 0.5, 0.2, 16]} />
                <meshStandardMaterial color="#424242" />
              </mesh>
            </group>
            <group position={[-0.8, 0.5, z]} rotation={[0, 0, Math.PI / 2]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.5, 0.5, 0.2, 16]} />
                <meshStandardMaterial color="#424242" />
              </mesh>
            </group>
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
)

Train.displayName = 'Train'

export { Train }