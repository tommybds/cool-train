import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { TrainProps } from '../types'
import { useKeyboardControls } from '@react-three/drei'

interface WagonProps {
  position: THREE.Vector3
  rotation: THREE.Euler
  color: string
  scale?: number
  opacity?: number
}

function Wagon({ position, rotation, color, scale = 1, opacity = 1 }: WagonProps) {
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

function Locomotive() {
  const locomotiveRef = useRef<THREE.Group>(null)

  return (
    <group ref={locomotiveRef}>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[3, 1.6, 1.8]} />
        <meshStandardMaterial color="#FFD700" />
        
        <mesh position={[1, 0.6, 0]}>
          <boxGeometry args={[1, 0.8, 1.6]} />
          <meshStandardMaterial color="#FFD700" />
        </mesh>

        <mesh position={[-0.8, 0.9, 0]}>
          <cylinderGeometry args={[0.2, 0.3, 0.8]} />
          <meshStandardMaterial color="#424242" />
        </mesh>

        <group position={[0, -0.8, 0]}>
          <mesh position={[-1, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.2]} />
            <meshStandardMaterial color="#424242" />
          </mesh>
          <mesh position={[-1, 0, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.2]} />
            <meshStandardMaterial color="#424242" />
          </mesh>
          <mesh position={[0, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.2]} />
            <meshStandardMaterial color="#424242" />
          </mesh>
          <mesh position={[0, 0, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.2]} />
            <meshStandardMaterial color="#424242" />
          </mesh>
          <mesh position={[1, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.2]} />
            <meshStandardMaterial color="#424242" />
          </mesh>
          <mesh position={[1, 0, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.2]} />
            <meshStandardMaterial color="#424242" />
          </mesh>
        </group>

        <mesh position={[-1.4, -0.2, 0]}>
          <boxGeometry args={[0.4, 0.4, 2]} />
          <meshStandardMaterial color="#424242" />
        </mesh>
      </mesh>
    </group>
  )
}

export function Train({ onPathUpdate, onPositionUpdate, onSpeedUpdate, onWagonCountUpdate, initialSpeed = 0.5 }: TrainProps) {
  const trainRef = useRef<THREE.Group>(null)
  const pathPoints = useRef<THREE.Vector3[]>([new THREE.Vector3(0, 0, 0)])
  const railsRef = useRef<THREE.Group>(null)
  const speed = useRef(initialSpeed)
  const currentPosition = useRef(0)
  const lastAngle = useRef(0)
  const currentRotation = useRef(new THREE.Euler())
  const wagonsData = useRef<{ position: THREE.Vector3, rotation: THREE.Euler, scale: number, opacity: number }[]>([])
  const lastKeyPress = useRef<number>(0)

  const WAGON_SPACING = 2
  const WAGON_COLORS = ['#4a90e2', '#e24a4a', '#4ae24a', '#e2e24a', '#4ae2e2', '#e24ae2']
  const MAX_WAGONS = 10
  const KEY_COOLDOWN = 200
  const ANIMATION_DURATION = 500

  const [, get] = useKeyboardControls()

  const createRailroad = () => {
    if (!railsRef.current) return
    
    while(railsRef.current.children.length > 0) {
      railsRef.current.remove(railsRef.current.children[0])
    }

    const points = pathPoints.current
    if (points.length < 2) return

    const railWidth = 0.2
    const railHeight = 0.1
    const railSpacing = 1.5
    const sleeperWidth = 2.2
    const sleeperHeight = 0.2
    const sleeperLength = 0.8
    const sleeperSpacing = 2

    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i]
      const end = points[i + 1]
      const direction = end.clone().sub(start)
      const length = direction.length()
      direction.normalize()

      const up = new THREE.Vector3(0, 1, 0)
      const right = direction.clone().cross(up).normalize()

      // Rails
      const railGeometry = new THREE.BoxGeometry(railWidth, railHeight, length)
      const railMaterial = new THREE.MeshStandardMaterial({ color: '#666', metalness: 0.8, roughness: 0.4 })

      const leftRail = new THREE.Mesh(railGeometry, railMaterial)
      leftRail.position.copy(start.clone().add(end).multiplyScalar(0.5))
      leftRail.position.add(right.clone().multiplyScalar(-railSpacing/2))
      leftRail.position.y += railHeight/2
      leftRail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction)

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

  useEffect(() => {
    console.log('Train component initialized')
    console.log('Initializing wagons...')
    
    // Position initiale de la locomotive
    const initialPosition = new THREE.Vector3(0, 0, 0)
    const initialDirection = new THREE.Vector3(-1, 0, 0) // Direction vers l'arrière
    
    wagonsData.current = Array(3).fill(0).map((_, index) => {
      console.log(`Creating wagon ${index}`)
      const position = initialPosition.clone().add(initialDirection.clone().multiplyScalar(WAGON_SPACING * (index + 1)))
      return {
        position,
        rotation: new THREE.Euler(0, Math.PI + Math.PI/2, 0), // Même rotation initiale que la locomotive
        scale: 1,
        opacity: 1
      }
    })
    if (onWagonCountUpdate) {
      console.log('Initial wagon count update:', wagonsData.current.length)
      onWagonCountUpdate(wagonsData.current.length)
    }
  }, [])

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

    const currentHeight = lastPoint.y
    const heightVariation = 5
    const rawTargetHeight = currentHeight + (Math.random() * heightVariation * 2 - heightVariation)
    const targetHeight = Math.min(Math.max(rawTargetHeight, 0), 50)
    endPoint.y = targetHeight

    const numPoints = 10
    const points: THREE.Vector3[] = []
    for (let i = 1; i <= numPoints; i++) {
      const t = i / numPoints
      const smoothT = t * t * (3 - 2 * t)
      const x = lastPoint.x + (endPoint.x - lastPoint.x) * t
      const z = lastPoint.z + (endPoint.z - lastPoint.z) * t
      const y = Math.min(Math.max(currentHeight + (targetHeight - currentHeight) * smoothT, 0), 50)
      points.push(new THREE.Vector3(x, y, z))
    }

    pathPoints.current.push(...points)
    
    if (onPathUpdate) {
      onPathUpdate(pathPoints.current)
    }
  }

  // Génération initiale du chemin
  useEffect(() => {
    for (let i = 0; i < 10; i++) {
      generateNewPathSection()
    }
  }, [])

  const addWagon = () => {
    console.log('addWagon called')
    if (wagonsData.current.length < MAX_WAGONS) {
      const lastWagonIndex = wagonsData.current.length
      const position = new THREE.Vector3(-2 - (lastWagonIndex * WAGON_SPACING), 0, 0)
      
      console.log(`Adding wagon at index ${lastWagonIndex}`)
      wagonsData.current.push({
        position,
        rotation: new THREE.Euler(),
        scale: 0,
        opacity: 0
      })
      
      if (window.wagonSounds?.add) {
        console.log('Playing add sound')
        window.wagonSounds.add.play()
      }
      
      setTimeout(() => {
        console.log(`Completing wagon ${lastWagonIndex} animation`)
        if (wagonsData.current[lastWagonIndex]) {
          wagonsData.current[lastWagonIndex].scale = 1
          wagonsData.current[lastWagonIndex].opacity = 1
        }
      }, ANIMATION_DURATION)

      if (onWagonCountUpdate) {
        console.log('Updating wagon count:', wagonsData.current.length)
        onWagonCountUpdate(wagonsData.current.length)
      }
    } else {
      console.log('Maximum number of wagons reached')
    }
  }

  const removeWagon = () => {
    console.log('removeWagon called')
    if (wagonsData.current.length > 0) {
      const lastIndex = wagonsData.current.length - 1
      
      console.log(`Removing wagon at index ${lastIndex}`)
      if (window.wagonSounds?.remove) {
        console.log('Playing remove sound')
        window.wagonSounds.remove.play()
      }
      
      if (wagonsData.current[lastIndex]) {
        wagonsData.current[lastIndex].scale = 0
        wagonsData.current[lastIndex].opacity = 0
      }
      
      setTimeout(() => {
        console.log('Completing wagon removal')
        wagonsData.current.pop()
        if (onWagonCountUpdate) {
          console.log('Updating wagon count:', wagonsData.current.length)
          onWagonCountUpdate(wagonsData.current.length)
        }
      }, ANIMATION_DURATION)
    } else {
      console.log('No wagons to remove')
    }
  }

  useFrame((_, delta) => {
    if (!trainRef.current) return

    const keys = get()
    const currentTime = Date.now()

    // Gestion de la vitesse
    if (keys.speedUp) {
      speed.current = Math.min(speed.current + delta * 0.5, 2.0)
      if (onSpeedUpdate) onSpeedUpdate(speed.current)
    }
    if (keys.speedDown) {
      speed.current = Math.max(speed.current - delta * 0.5, 0)
      if (onSpeedUpdate) onSpeedUpdate(speed.current)
    }

    // Gestion des wagons avec cooldown
    if (currentTime - lastKeyPress.current > KEY_COOLDOWN) {
      if (keys.addWagon) {
        console.log('Add wagon key pressed')
        addWagon()
        lastKeyPress.current = currentTime
      }
      if (keys.removeWagon) {
        console.log('Remove wagon key pressed')
        removeWagon()
        lastKeyPress.current = currentTime
      }
    }

    // Ne pas mettre à jour les positions si la vitesse est 0
    if (speed.current === 0) return

    // Nettoyage des points de chemin trop éloignés
    const cleanupDistance = 200
    const currentTrainPoint = pathPoints.current[Math.floor(currentPosition.current)]
    if (currentTrainPoint && pathPoints.current.length > 200) {
      const pointsToRemove = []
      for (let i = 0; i < pathPoints.current.length - 100; i++) {
        const point = pathPoints.current[i]
        const distance = point.distanceTo(currentTrainPoint)
        if (distance > cleanupDistance) {
          pointsToRemove.push(i)
        } else {
          break
        }
      }
      if (pointsToRemove.length > 0) {
        pathPoints.current = pathPoints.current.slice(pointsToRemove.length)
        currentPosition.current -= pointsToRemove.length
      }
    }

    // Génère une nouvelle section quand on approche de la fin
    if (currentPosition.current >= pathPoints.current.length - 100) {
      generateNewPathSection()
    }

    // Mise à jour des positions
    currentPosition.current += speed.current
    const pointIndex = Math.floor(currentPosition.current)
    const nextPointIndex = Math.min(pointIndex + 1, pathPoints.current.length - 1)
    const fraction = currentPosition.current - pointIndex

    const currentPoint = pathPoints.current[pointIndex]
    const nextPoint = pathPoints.current[nextPointIndex]

    if (currentPoint && nextPoint && trainRef.current) {
      // Position de la locomotive
      trainRef.current.position.lerpVectors(currentPoint, nextPoint, fraction)

      // Rotation de la locomotive
      const direction = nextPoint.clone().sub(currentPoint).normalize()
      const up = new THREE.Vector3(0, 1, 0)
      const matrix = new THREE.Matrix4().lookAt(new THREE.Vector3(), direction, up)
      const targetRotation = new THREE.Euler().setFromRotationMatrix(matrix)

      // Ajustement de la rotation pour l'inclinaison en montée/descente
      const heightDiff = nextPoint.y - currentPoint.y
      const distance = currentPoint.distanceTo(nextPoint)
      const angle = Math.atan2(heightDiff, distance)
      targetRotation.x += angle

      // Rotation supplémentaire de 180 degrés pour orienter le train dans la bonne direction
      targetRotation.y += Math.PI + Math.PI/2

      // Interpolation de la rotation
      currentRotation.current.x += (targetRotation.x - currentRotation.current.x) * delta * 10
      currentRotation.current.y += (targetRotation.y - currentRotation.current.y) * delta * 10
      currentRotation.current.z += (targetRotation.z - currentRotation.current.z) * delta * 10
      trainRef.current.rotation.copy(currentRotation.current)

      // Mise à jour des wagons
      let previousPosition = trainRef.current.position.clone()
      let previousDirection = direction.clone()

      for (let i = 0; i < wagonsData.current.length; i++) {
        // Calcul de la position cible du wagon
        const targetPosition = previousPosition.clone().add(previousDirection.multiplyScalar(-WAGON_SPACING))
        
        // Interpolation douce de la position
        wagonsData.current[i].position.lerp(targetPosition, delta * 5)
        
        // Calcul de la direction pour le prochain wagon
        previousDirection = targetPosition.clone().sub(previousPosition).normalize()
        
        // Calcul de la rotation du wagon
        const wagonMatrix = new THREE.Matrix4().lookAt(previousPosition, wagonsData.current[i].position, up)
        const wagonTargetRotation = new THREE.Euler().setFromRotationMatrix(wagonMatrix)
        
        // Ajustement de la rotation pour l'inclinaison
        const wagonHeightDiff = wagonsData.current[i].position.y - previousPosition.y
        const wagonDistance = wagonsData.current[i].position.distanceTo(previousPosition)
        const wagonAngle = Math.atan2(wagonHeightDiff, wagonDistance)
        wagonTargetRotation.x += wagonAngle
        wagonTargetRotation.y += Math.PI + Math.PI/2

        // Interpolation douce de la rotation
        const rotationSpeed = 5 - (i * 0.5) // Ralentit progressivement la rotation pour les wagons suivants
        wagonsData.current[i].rotation.x += (wagonTargetRotation.x - wagonsData.current[i].rotation.x) * delta * rotationSpeed
        wagonsData.current[i].rotation.y += (wagonTargetRotation.y - wagonsData.current[i].rotation.y) * delta * rotationSpeed
        wagonsData.current[i].rotation.z += (wagonTargetRotation.z - wagonsData.current[i].rotation.z) * delta * rotationSpeed
        
        // Prépare pour le prochain wagon
        previousPosition = wagonsData.current[i].position.clone()
      }

      if (onPositionUpdate) {
        onPositionUpdate(trainRef.current.position.clone())
      }
    }
  })

  return (
    <>
      <group ref={railsRef} />
      <group ref={trainRef}>
        <Locomotive />
      </group>
      {wagonsData.current.map((wagon, index) => (
        <Wagon
          key={`wagon-${index}`}
          position={wagon.position}
          rotation={wagon.rotation}
          color={WAGON_COLORS[index % WAGON_COLORS.length]}
          scale={wagon.scale}
          opacity={wagon.opacity}
        />
      ))}
    </>
  )
}