import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import { useTrainStore } from '../stores/trainStore'
import * as THREE from 'three'

export function CameraSystem() {
  const controlsRef = useRef<CameraControls>(null)
  const viewMode = useTrainStore((state) => state.viewMode)
  const trainPosition = useTrainStore((state) => state.position)
  const trainRotation = useTrainStore((state) => state.rotation)
  const lastTrainPosition = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0))
  
  // Initialisation de la caméra quand le mode change
  useEffect(() => {
    if (!controlsRef.current) return
    
    const timeout = setTimeout(() => {
      if (!controlsRef.current) return
      
      if (viewMode === 'cockpit') {
        // Mode cockpit : caméra fixée au train
        const offset = new THREE.Vector3(0, 1.5, 0)
        offset.applyEuler(trainRotation)
        
        const camPos = new THREE.Vector3(
          trainPosition.x + offset.x,
          trainPosition.y + offset.y,
          trainPosition.z + offset.z
        )
        
        const lookAt = new THREE.Vector3(0, 1.5, -5)
        lookAt.applyEuler(trainRotation)
        const lookAtPos = new THREE.Vector3(
          trainPosition.x + lookAt.x,
          trainPosition.y + lookAt.y,
          trainPosition.z + lookAt.z
        )
        
        try {
          controlsRef.current.setLookAt(
            camPos.x, camPos.y, camPos.z,
            lookAtPos.x, lookAtPos.y, lookAtPos.z,
            true
          )
        } catch {
          // Ignore
        }
      } else {
        // Mode externe : caméra derrière le train
        const rotationY = trainRotation.y
        const camPos = new THREE.Vector3(
          trainPosition.x - Math.sin(rotationY) * 5,
          trainPosition.y + 2.2,
          trainPosition.z - Math.cos(rotationY) * 5
        )
        
        try {
          controlsRef.current.setLookAt(
            camPos.x, camPos.y, camPos.z,
            trainPosition.x, trainPosition.y, trainPosition.z,
            true
          )
        } catch {
          // Ignore
        }
      }
      
      lastTrainPosition.current.copy(trainPosition)
    }, 200)
    
    return () => clearTimeout(timeout)
  }, [viewMode, trainPosition, trainRotation])
  
  // Mise à jour continue pour suivre le train
  useFrame(() => {
    if (!controlsRef.current) return
    
    const trainDelta = trainPosition.distanceTo(lastTrainPosition.current)
    if (trainDelta < 0.001) return
    
    if (viewMode === 'cockpit') {
      // Mode cockpit : suivre le train exactement
      const offset = new THREE.Vector3(0, 1.5, 0)
      offset.applyEuler(trainRotation)
      
      const camPos = new THREE.Vector3(
        trainPosition.x + offset.x,
        trainPosition.y + offset.y,
        trainPosition.z + offset.z
      )
      
      const lookAt = new THREE.Vector3(0, 1.5, -5)
      lookAt.applyEuler(trainRotation)
      const lookAtPos = new THREE.Vector3(
        trainPosition.x + lookAt.x,
        trainPosition.y + lookAt.y,
        trainPosition.z + lookAt.z
      )
      
      try {
        controlsRef.current.setLookAt(
          camPos.x, camPos.y, camPos.z,
          lookAtPos.x, lookAtPos.y, lookAtPos.z,
          false
        )
      } catch {
        // Ignore
      }
    } else if (viewMode === 'external') {
      // Mode externe : déplacer la caméra avec le train
      const currentPos = controlsRef.current.getPosition(new THREE.Vector3())
      const delta = trainPosition.clone().sub(lastTrainPosition.current)
      const newPos = currentPos.clone().add(delta)
      
      try {
        controlsRef.current.setLookAt(
          newPos.x, newPos.y, newPos.z,
          trainPosition.x, trainPosition.y, trainPosition.z,
          false
        )
      } catch {
        // Ignore
      }
    }
    
    lastTrainPosition.current.copy(trainPosition)
  })
  
  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      enabled={viewMode === 'external'}
      minDistance={5}
      maxDistance={30}
      minPolarAngle={Math.PI * 0.2}
      maxPolarAngle={Math.PI * 0.4}
    />
  )
}
