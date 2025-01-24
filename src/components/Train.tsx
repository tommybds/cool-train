import { useRef, useEffect, useState } from 'react'
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

export function Train({ onPathUpdate, onPositionUpdate, onSpeedUpdate, onWagonCountUpdate, initialSpeed = 0 }: TrainProps) {
  const trainRef = useRef<THREE.Group>(null)
  const pathPoints = useRef<THREE.Vector3[]>([new THREE.Vector3(0, 0, 0)])
  const railsRef = useRef<THREE.Group>(null)
  const speed = useRef(0)
  const currentPosition = useRef(0)
  const lastAngle = useRef(0)
  const currentRotation = useRef(new THREE.Euler())
  const lastKeyPress = useRef<number>(0)

  // Utiliser useState pour les wagons pour forcer le re-rendu
  const [wagons, setWagons] = useState<{ position: THREE.Vector3, rotation: THREE.Euler, scale: number, opacity: number }[]>([])

  const WAGON_SPACING = 0.8
  const WAGON_COLORS = ['#4a90e2', '#e24a4a', '#4ae24a', '#e2e24a', '#4ae2e2', '#e24ae2']
  const MAX_WAGONS = 10
  const KEY_COOLDOWN = 200
  const ANIMATION_DURATION = 200
  const MIN_SPEED = 0
  const MAX_SPEED = 2.0
  const SPEED_INCREMENT = 0.5
  const MOVEMENT_SPEED = 5

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
    // Générer les deux premières sections du chemin
    generateNewPathSection()
    generateNewPathSection()
    createRailroad()

    // Positionner le train au début de la deuxième section
    currentPosition.current = 10

    // S'assurer que le chemin est généré avant de créer les wagons
    if (pathPoints.current.length >= 2) {
      console.log('Initializing wagons, path length:', pathPoints.current.length)
      
      // Initialisation des wagons avec des positions correctes
      const initialWagons = Array(3).fill(0).map((_, index) => {
        const wagonOffset = (index + 1) * WAGON_SPACING
        const wagonPosition = currentPosition.current - wagonOffset
        console.log(`Initial wagon ${index} position:`, wagonPosition)

        const wagonPointIndex = Math.floor(Math.abs(wagonPosition)) % pathPoints.current.length
        const wagonNextPointIndex = (wagonPointIndex + 1) % pathPoints.current.length
        const wagonFraction = wagonPosition - Math.floor(wagonPosition)

        console.log(`Wagon ${index} indices:`, wagonPointIndex, wagonNextPointIndex)

        const wagonPoint = pathPoints.current[wagonPointIndex]
        const wagonNextPoint = pathPoints.current[wagonNextPointIndex]

        const position = new THREE.Vector3()
        const rotation = new THREE.Euler()

        if (wagonPoint && wagonNextPoint) {
          position.lerpVectors(wagonPoint, wagonNextPoint, wagonFraction)
          console.log(`Wagon ${index} initial position:`, position)

          const direction = wagonNextPoint.clone().sub(wagonPoint).normalize()
          const up = new THREE.Vector3(0, 1, 0)
          const matrix = new THREE.Matrix4().lookAt(new THREE.Vector3(), direction, up)
          rotation.setFromRotationMatrix(matrix)

          const heightDiff = wagonNextPoint.y - wagonPoint.y
          const distance = wagonPoint.distanceTo(wagonNextPoint)
          const angle = Math.atan2(heightDiff, distance)
          rotation.x += angle
          rotation.y += Math.PI + Math.PI/2
        }

        return {
          position,
          rotation,
          scale: 1,
          opacity: 1
        }
      })

      console.log('Setting initial wagons:', initialWagons)
      setWagons(initialWagons)

      if (onWagonCountUpdate) {
        onWagonCountUpdate(3)
      }
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

  const addWagon = () => {
    if (wagons.length < MAX_WAGONS) {
      const wagonOffset = (wagons.length + 1) * WAGON_SPACING
      const wagonPosition = currentPosition.current - wagonOffset
      const wagonPointIndex = Math.floor(Math.abs(wagonPosition)) % pathPoints.current.length
      const wagonNextPointIndex = (wagonPointIndex + 1) % pathPoints.current.length
      const wagonFraction = wagonPosition - Math.floor(wagonPosition)

      const wagonPoint = pathPoints.current[wagonPointIndex]
      const wagonNextPoint = pathPoints.current[wagonNextPointIndex]

      const position = new THREE.Vector3()
      const rotation = new THREE.Euler()

      if (wagonPoint && wagonNextPoint) {
        position.lerpVectors(wagonPoint, wagonNextPoint, wagonFraction)

        const direction = wagonNextPoint.clone().sub(wagonPoint).normalize()
        const up = new THREE.Vector3(0, 1, 0)
        const matrix = new THREE.Matrix4().lookAt(new THREE.Vector3(), direction, up)
        rotation.setFromRotationMatrix(matrix)

        const heightDiff = wagonNextPoint.y - wagonPoint.y
        const distance = wagonPoint.distanceTo(wagonNextPoint)
        const angle = Math.atan2(heightDiff, distance)
        rotation.x += angle
        rotation.y += Math.PI + Math.PI/2
      }

      const newWagon = {
        position,
        rotation,
        scale: 1,
        opacity: 1
      }

      setWagons(prev => [...prev, newWagon])

      if (window.wagonSounds?.add) {
        window.wagonSounds.add.play()
      }

      setTimeout(() => {
        setWagons(prev => {
          const updated = [...prev]
          const lastIndex = updated.length - 1
          if (updated[lastIndex]) {
            updated[lastIndex] = {
              ...updated[lastIndex],
              scale: 1,
              opacity: 1
            }
          }
          return updated
        })
      }, ANIMATION_DURATION)

      if (onWagonCountUpdate) {
        onWagonCountUpdate(wagons.length + 1)
      }
    }
  }

  const removeWagon = () => {
    if (wagons.length > 1) {  // Changé de 0 à 1 pour garder au moins un wagon
      if (window.wagonSounds?.remove) {
        window.wagonSounds.remove.play()
      }

      setWagons(prev => {
        const updated = [...prev]
        const lastIndex = updated.length - 1
        if (updated[lastIndex]) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            scale: 0,
            opacity: 0
          }
        }
        return updated
      })

      setTimeout(() => {
        setWagons(prev => prev.slice(0, -1))
        if (onWagonCountUpdate) {
          onWagonCountUpdate(wagons.length - 1)
        }
      }, ANIMATION_DURATION)
    }
  }

  useFrame((_, delta) => {
    if (!trainRef.current || pathPoints.current.length < 2) return

    const keys = get()
    const currentTime = Date.now()

    // Gestion de la vitesse
    if (keys.forward) {
      speed.current = Math.min(speed.current + SPEED_INCREMENT * delta, MAX_SPEED)
      if (onSpeedUpdate) onSpeedUpdate(speed.current)
    }
    if (keys.backward) {
      speed.current = Math.max(speed.current - SPEED_INCREMENT * delta, MIN_SPEED)
      if (onSpeedUpdate) onSpeedUpdate(speed.current)
    }

    // Mise à jour de la position du train
    const movement = speed.current * delta * MOVEMENT_SPEED
    currentPosition.current += movement

    // Génération de nouvelles sections si nécessaire
    if (currentPosition.current >= pathPoints.current.length - 20) {
      generateNewPathSection()
      createRailroad()
    }

    // Position et rotation du train
    const trainPointIndex = Math.floor(currentPosition.current) % pathPoints.current.length
    const trainNextPointIndex = (trainPointIndex + 1) % pathPoints.current.length
    const trainFraction = currentPosition.current - Math.floor(currentPosition.current)

    const currentPoint = pathPoints.current[trainPointIndex]
    const nextPoint = pathPoints.current[trainNextPointIndex]

    if (currentPoint && nextPoint && trainRef.current) {
      // Mise à jour de la position et rotation du train
      trainRef.current.position.lerpVectors(currentPoint, nextPoint, trainFraction)

      const direction = nextPoint.clone().sub(currentPoint).normalize()
      
      // Calcul de la rotation en Y (direction horizontale)
      const horizontalDirection = direction.clone()
      horizontalDirection.y = 0
      horizontalDirection.normalize()
      
      // Calcul de la rotation en Y (direction)
      const targetRotation = new THREE.Euler(
        0,
        Math.atan2(horizontalDirection.x, horizontalDirection.z) - Math.PI/2 + Math.PI,
        0
      )

      // Calcul de la rotation en Z (pente) - inversé et sur l'axe Z
      const heightDiff = nextPoint.y - currentPoint.y
      const horizontalDistance = Math.sqrt(Math.pow(nextPoint.x - currentPoint.x, 2) + Math.pow(nextPoint.z - currentPoint.z, 2))
      const slopeAngle = -Math.atan2(heightDiff, horizontalDistance)  // Note le signe négatif ici
      targetRotation.z = slopeAngle

      // Interpolation douce des rotations
      currentRotation.current.x = 0 // Pas de rotation en X
      currentRotation.current.y += (targetRotation.y - currentRotation.current.y) * delta * 10
      currentRotation.current.z += (targetRotation.z - currentRotation.current.z) * delta * 10
      trainRef.current.rotation.copy(currentRotation.current)

      // Mise à jour des wagons
      if (wagons.length > 0) {
        const updatedWagons = wagons.map((wagon, index) => {
          const wagonOffset = (index + 1) * WAGON_SPACING
          const wagonPosition = currentPosition.current - wagonOffset
          const wagonPointIndex = Math.floor(Math.abs(wagonPosition)) % pathPoints.current.length
          const wagonNextPointIndex = (wagonPointIndex + 1) % pathPoints.current.length
          const wagonFraction = wagonPosition - Math.floor(wagonPosition)

          const wagonPoint = pathPoints.current[wagonPointIndex]
          const wagonNextPoint = pathPoints.current[wagonNextPointIndex]

          if (wagonPoint && wagonNextPoint) {
            const newPosition = new THREE.Vector3()
            newPosition.lerpVectors(wagonPoint, wagonNextPoint, wagonFraction)

            const wagonDirection = wagonNextPoint.clone().sub(wagonPoint).normalize()
            
            // Même logique que pour le train
            const wagonHorizontalDirection = wagonDirection.clone()
            wagonHorizontalDirection.y = 0
            wagonHorizontalDirection.normalize()
            
            const wagonRotation = new THREE.Euler(
              0,
              Math.atan2(wagonHorizontalDirection.x, wagonHorizontalDirection.z) - Math.PI/2 + Math.PI,
              0
            )

            // Calcul de la rotation en Z (pente) pour le wagon - même logique que le train
            const wagonHeightDiff = wagonNextPoint.y - wagonPoint.y
            const wagonHorizontalDistance = Math.sqrt(Math.pow(wagonNextPoint.x - wagonPoint.x, 2) + Math.pow(wagonNextPoint.z - wagonPoint.z, 2))
            const wagonSlopeAngle = -Math.atan2(wagonHeightDiff, wagonHorizontalDistance)  // Note le signe négatif ici
            wagonRotation.z = wagonSlopeAngle

            return {
              ...wagon,
              position: newPosition,
              rotation: wagonRotation
            }
          }
          return wagon
        })

        setWagons(updatedWagons)
      }

      if (onPositionUpdate) {
        const distance = Math.floor(currentPosition.current)
        onPositionUpdate(trainRef.current.position.clone(), distance)
      }
    }

    // Nettoyage des points anciens
    if (pathPoints.current.length > 200) {
      const safetyMargin = Math.floor(currentPosition.current - WAGON_SPACING * (wagons.length + 1))
      if (safetyMargin > 100) {
        pathPoints.current = pathPoints.current.slice(safetyMargin - 50)
        currentPosition.current -= (safetyMargin - 50)
        createRailroad()
      }
    }

    // Gestion des touches pour ajouter/supprimer des wagons
    if (currentTime - lastKeyPress.current > KEY_COOLDOWN) {
      if (keys.addWagon && wagons.length < MAX_WAGONS) {
        addWagon()
        lastKeyPress.current = currentTime
      }
      if (keys.removeWagon && wagons.length > 1) {
        removeWagon()
        lastKeyPress.current = currentTime
      }
    }
  })

  return (
    <>
      <group ref={railsRef} />
      <group ref={trainRef}>
        <Locomotive />
      </group>
      {wagons.map((wagon, index) => (
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