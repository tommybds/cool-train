import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { TrainProps } from '../types'
import { useKeyboardControls } from '@react-three/drei'
import { createNoise2D } from 'simplex-noise'

export function Train({ onPathUpdate, onPositionUpdate, onSpeedUpdate, initialSpeed = 0.5 }: TrainProps) {
  const trainRef = useRef<THREE.Mesh>(null)
  const pathPoints = useRef<THREE.Vector3[]>([new THREE.Vector3(0, 0, 0)])
  const speed = useRef(initialSpeed)
  const currentPosition = useRef(0)
  const lastAngle = useRef(0)
  const currentRotation = useRef(new THREE.Quaternion())
  const noise2D = useRef(createNoise2D())

  const [, get] = useKeyboardControls()

  const getTerrainHeight = (x: number, z: number): number => {
    const scale1 = 0.01
    const scale2 = 0.02
    const scale3 = 0.04
    
    const noise1 = noise2D.current(x * scale1, z * scale1) * 20
    const noise2 = noise2D.current(x * scale2, z * scale2) * 10
    const noise3 = noise2D.current(x * scale3, z * scale3) * 5

    return noise1 + noise2 + noise3
  }

  useFrame((_, delta) => {
    if (!trainRef.current) return

    // Gestion de la vitesse avec les touches
    const keys = get()
    if (keys.speedUp) {
      speed.current = Math.min(speed.current + delta * 0.5, 2.0)
      if (onSpeedUpdate) onSpeedUpdate(speed.current)
    }
    if (keys.speedDown) {
      speed.current = Math.max(speed.current - delta * 0.5, 0.1)
      if (onSpeedUpdate) onSpeedUpdate(speed.current)
    }

    // Génère une nouvelle section quand on approche de la fin
    if (currentPosition.current >= pathPoints.current.length - 100) {
      generateNewPathSection()
    }

    currentPosition.current += speed.current
    const pointIndex = Math.floor(currentPosition.current)
    const nextPointIndex = Math.min(pointIndex + 1, pathPoints.current.length - 1)
    const fraction = currentPosition.current - pointIndex

    const currentPoint = pathPoints.current[pointIndex]
    const nextPoint = pathPoints.current[nextPointIndex]

    if (currentPoint && nextPoint) {
      // Position
      trainRef.current.position.lerpVectors(currentPoint, nextPoint, fraction)

      // Rotation
      const direction = nextPoint.clone().sub(currentPoint).normalize()
      const up = new THREE.Vector3(0, 1, 0)
      const matrix = new THREE.Matrix4().lookAt(new THREE.Vector3(), direction, up)
      const targetRotation = new THREE.Quaternion().setFromRotationMatrix(matrix)

      // Ajustement de la rotation pour l'inclinaison en montée/descente
      const heightDiff = nextPoint.y - currentPoint.y
      const distance = currentPoint.distanceTo(nextPoint)
      const angle = Math.atan2(heightDiff, distance)
      const pitchMatrix = new THREE.Matrix4().makeRotationX(angle)
      const pitchQuaternion = new THREE.Quaternion().setFromRotationMatrix(pitchMatrix)
      targetRotation.multiply(pitchQuaternion)
      
      // Interpolation douce de la rotation
      currentRotation.current.slerp(targetRotation, delta * 5)
      trainRef.current.quaternion.copy(currentRotation.current)

      if (onPositionUpdate) {
        onPositionUpdate(trainRef.current.position.clone())
      }
    }
  })

  // Génère plusieurs sections de chemin à l'avance
  const generateNewPathSection = () => {
    const lastPoint = pathPoints.current[pathPoints.current.length - 1]
    
    // Calcul d'un nouvel angle horizontal avec une variation plus douce
    const angleVariation = Math.PI / 6
    const newAngle = lastAngle.current + (Math.random() * angleVariation * 2 - angleVariation)
    lastAngle.current = newAngle
    
    const sectionLength = 40 // Longueur fixe de la section

    // Création du point final de la section
    const endPoint = new THREE.Vector3(
      lastPoint.x + Math.cos(newAngle) * sectionLength,
      0,
      lastPoint.z + Math.sin(newAngle) * sectionLength
    )

    // Ajustement de la hauteur en fonction du terrain
    endPoint.y = getTerrainHeight(endPoint.x, endPoint.z)

    // Création des points intermédiaires pour une ligne droite
    const numPoints = 10
    const points: THREE.Vector3[] = []
    for (let i = 1; i <= numPoints; i++) {
      const t = i / numPoints
      const x = lastPoint.x + (endPoint.x - lastPoint.x) * t
      const z = lastPoint.z + (endPoint.z - lastPoint.z) * t
      const y = getTerrainHeight(x, z)
      points.push(new THREE.Vector3(x, y, z))
    }

    pathPoints.current.push(...points)
    
    if (onPathUpdate) {
      onPathUpdate(pathPoints.current)
    }
  }

  // Génère le chemin initial
  useEffect(() => {
    for (let i = 0; i < 10; i++) { // Génère 10 sections à l'avance
      generateNewPathSection()
    }
  }, [])

  useEffect(() => {
    speed.current = initialSpeed
  }, [initialSpeed])

  return (
    <mesh ref={trainRef}>
      <boxGeometry args={[4, 2, 2]} />
      <meshStandardMaterial color="blue" />
    </mesh>
  )
}