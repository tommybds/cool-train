import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { TrainProps } from '../types'
import { useKeyboardControls } from '@react-three/drei'
import { createNoise2D } from 'simplex-noise'

export function Train({ onPathUpdate, onPositionUpdate, onSpeedUpdate, initialSpeed = 0.5 }: TrainProps) {
  const trainRef = useRef<THREE.Group>(null)
  const pathPoints = useRef<THREE.Vector3[]>([new THREE.Vector3(0, 0, 0)])
  const railsRef = useRef<THREE.Group>(null)
  const speed = useRef(initialSpeed)
  const currentPosition = useRef(0)
  const lastAngle = useRef(0)
  const currentRotation = useRef(new THREE.Quaternion())
  const noise2D = useRef(createNoise2D())

  const [, get] = useKeyboardControls()

  const createRailroad = () => {
    if (!railsRef.current) return
    
    // Nettoyage des anciens rails
    while(railsRef.current.children.length > 0) {
      railsRef.current.remove(railsRef.current.children[0])
    }

    const points = pathPoints.current
    if (points.length < 2) return

    // Paramètres des rails
    const railWidth = 0.2
    const railHeight = 0.1
    const railSpacing = 1.5
    const sleeperWidth = 2.2
    const sleeperHeight = 0.2
    const sleeperLength = 0.8
    const sleeperSpacing = 2

    // Création des rails
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i]
      const end = points[i + 1]
      const direction = end.clone().sub(start)
      const length = direction.length()
      direction.normalize()

      // Calcul des vecteurs perpendiculaires pour positionner les rails
      const up = new THREE.Vector3(0, 1, 0)
      const right = direction.clone().cross(up).normalize()

      // Rails
      const railGeometry = new THREE.BoxGeometry(railWidth, railHeight, length)
      const railMaterial = new THREE.MeshStandardMaterial({ color: '#666', metalness: 0.8, roughness: 0.4 })

      // Rail gauche
      const leftRail = new THREE.Mesh(railGeometry, railMaterial)
      leftRail.position.copy(start.clone().add(end).multiplyScalar(0.5))
      leftRail.position.add(right.clone().multiplyScalar(-railSpacing/2))
      leftRail.position.y += railHeight/2
      leftRail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction)

      // Rail droit
      const rightRail = new THREE.Mesh(railGeometry, railMaterial)
      rightRail.position.copy(start.clone().add(end).multiplyScalar(0.5))
      rightRail.position.add(right.clone().multiplyScalar(railSpacing/2))
      rightRail.position.y += railHeight/2
      rightRail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction)

      // Traverses
      const numSleepers = Math.floor(length / sleeperSpacing)
      for (let j = 0; j <= numSleepers; j++) {
        const sleeperGeometry = new THREE.BoxGeometry(sleeperLength, sleeperHeight, sleeperWidth)
        const sleeperMaterial = new THREE.MeshStandardMaterial({ color: '#4a3728' })
        const sleeper = new THREE.Mesh(sleeperGeometry, sleeperMaterial)
        
        const t = j / numSleepers
        const pos = start.clone().lerp(end, t)
        sleeper.position.copy(pos)
        sleeper.position.y += sleeperHeight/2
        
        // Utilisation du vecteur right pour orienter les traverses perpendiculairement aux rails
        const sleeperDirection = right
        sleeper.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), sleeperDirection)
        
        railsRef.current.add(sleeper)
      }

      railsRef.current.add(leftRail)
      railsRef.current.add(rightRail)
    }
  }

  useEffect(() => {
    createRailroad()
  }, [pathPoints.current])

  useFrame((_, delta) => {
    if (!trainRef.current) return

    const keys = get()
    if (keys.speedUp) {
      speed.current = Math.min(speed.current + delta * 0.5, 2.0)
      if (onSpeedUpdate) onSpeedUpdate(speed.current)
    }
    if (keys.speedDown) {
      speed.current = Math.max(speed.current - delta * 0.5, 0.1)
      if (onSpeedUpdate) onSpeedUpdate(speed.current)
    }

    // Nettoyage des points de chemin trop éloignés
    const cleanupDistance = 200 // Distance de nettoyage
    const currentTrainPoint = pathPoints.current[Math.floor(currentPosition.current)]
    if (currentTrainPoint && pathPoints.current.length > 200) { // Garder au moins 200 points
      const pointsToRemove = []
      for (let i = 0; i < pathPoints.current.length - 100; i++) { // Garder au moins 100 points devant
        const point = pathPoints.current[i]
        const distance = point.distanceTo(currentTrainPoint)
        if (distance > cleanupDistance) {
          pointsToRemove.push(i)
        } else {
          break // Les points sont ordonnés, donc on peut arrêter dès qu'on trouve un point assez proche
        }
      }
      if (pointsToRemove.length > 0) {
        pathPoints.current = pathPoints.current.slice(pointsToRemove.length)
        currentPosition.current -= pointsToRemove.length
        createRailroad() // Recréer les rails après le nettoyage
      }
    }

    // Génère une nouvelle section quand on approche de la fin
    if (currentPosition.current >= pathPoints.current.length - 100) {
      generateNewPathSection()
      createRailroad()
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
      
      // Rotation supplémentaire de 180 degrés pour orienter le train dans la bonne direction
      const flipRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI + Math.PI/2, 0))
      targetRotation.multiply(flipRotation)
      
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
    
    const angleVariation = Math.PI / 6
    const newAngle = lastAngle.current + (Math.random() * angleVariation * 2 - angleVariation)
    lastAngle.current = newAngle
    
    const sectionLength = 40
    const endPoint = new THREE.Vector3(
      lastPoint.x + Math.cos(newAngle) * sectionLength,
      0,
      lastPoint.z + Math.sin(newAngle) * sectionLength
    )

    // Augmentation des variations de hauteur
    const currentHeight = lastPoint.y
    const heightVariation = 5 // Augmenté de 2 à 5
    const targetHeight = currentHeight + (Math.random() * heightVariation * 2 - heightVariation)
    endPoint.y = targetHeight

    // Création des points intermédiaires avec interpolation douce de la hauteur
    const numPoints = 10
    const points: THREE.Vector3[] = []
    for (let i = 1; i <= numPoints; i++) {
      const t = i / numPoints
      const smoothT = t * t * (3 - 2 * t)
      const x = lastPoint.x + (endPoint.x - lastPoint.x) * t
      const z = lastPoint.z + (endPoint.z - lastPoint.z) * t
      const y = currentHeight + (targetHeight - currentHeight) * smoothT
      points.push(new THREE.Vector3(x, y, z))
    }

    pathPoints.current.push(...points)
    
    if (onPathUpdate) {
      onPathUpdate(pathPoints.current)
    }
  }

  // Génère le chemin initial
  useEffect(() => {
    for (let i = 0; i < 10; i++) {
      generateNewPathSection()
    }
    createRailroad()
  }, [])

  useEffect(() => {
    speed.current = initialSpeed
  }, [initialSpeed])

  return (
    <>
      <group ref={railsRef} />
      <group ref={trainRef}>
        {/* Locomotive */}
        <mesh position={[0, 1.2, 0]}>
          {/* Corps principal */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[3, 1.6, 1.8]} />
            <meshStandardMaterial color="#FFD700" /> {/* Jaune doré */}
          </mesh>
          
          {/* Cabine */}
          <mesh position={[1, 0.6, 0]}>
            <boxGeometry args={[1, 0.8, 1.6]} />
            <meshStandardMaterial color="#FFD700" />
          </mesh>

          {/* Cheminée */}
          <mesh position={[-0.8, 0.9, 0]}>
            <cylinderGeometry args={[0.2, 0.3, 0.8]} />
            <meshStandardMaterial color="#424242" />
          </mesh>

          {/* Roues */}
          <group position={[0, -0.8, 0]}>
            {/* Roues avant */}
            <mesh position={[-1, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.4, 0.4, 0.2]} />
              <meshStandardMaterial color="#424242" />
            </mesh>
            <mesh position={[-1, 0, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.4, 0.4, 0.2]} />
              <meshStandardMaterial color="#424242" />
            </mesh>

            {/* Roues milieu */}
            <mesh position={[0, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.5, 0.5, 0.2]} />
              <meshStandardMaterial color="#424242" />
            </mesh>
            <mesh position={[0, 0, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.5, 0.5, 0.2]} />
              <meshStandardMaterial color="#424242" />
            </mesh>

            {/* Roues arrière */}
            <mesh position={[1, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.4, 0.4, 0.2]} />
              <meshStandardMaterial color="#424242" />
            </mesh>
            <mesh position={[1, 0, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.4, 0.4, 0.2]} />
              <meshStandardMaterial color="#424242" />
            </mesh>
          </group>

          {/* Détails décoratifs */}
          <mesh position={[-1.4, -0.2, 0]}>
            <boxGeometry args={[0.4, 0.4, 2]} />
            <meshStandardMaterial color="#424242" />
          </mesh>
        </mesh>
      </group>
    </>
  )
}