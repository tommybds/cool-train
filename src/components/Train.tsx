import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { TrackEvents } from './TrackEvents'
import { Wagon } from './Wagon'
import { AnimatedLocomotive } from './AnimatedLocomotive'
import { SmokeParticles } from './SmokeParticles'
import { useTrainStore } from '../stores/trainStore'

interface TrainProps {
  onPathUpdate: (points: THREE.Vector3[]) => void
  onPositionUpdate: (position: THREE.Vector3) => void
  onRotationUpdate?: (rotation: THREE.Euler) => void
  onSpeedUpdate: (newSpeed: number) => void
  onWagonCountUpdate: (count: number) => void
  initialSpeed: number
  distanceRef: React.MutableRefObject<number>
  children?: React.ReactNode
}

function Locomotive() {
  return <AnimatedLocomotive speed={1} />
}

export function Train({ onPathUpdate, onPositionUpdate, onRotationUpdate, onSpeedUpdate, onWagonCountUpdate, initialSpeed, distanceRef, children }: TrainProps) {
  const trainRef = useRef<THREE.Group>(null)
  const pathPoints = useRef<THREE.Vector3[]>([new THREE.Vector3(0, 0, 0)])
  const railsRef = useRef<THREE.Group>(null)
  const speed = useRef(initialSpeed)
  const currentPosition = useRef(0)
  const lastAngle = useRef(0)
  const currentRotation = useRef(new THREE.Euler())
  const totalDistanceTraveled = useRef<number>(0)
  
  // Utiliser le store Zustand pour la vitesse
  const storeSpeed = useTrainStore((state) => state.speed)
  const setSpeed = useTrainStore((state) => state.setSpeed)
  const setPosition = useTrainStore((state) => state.setPosition)
  const setRotation = useTrainStore((state) => state.setRotation)
  const setDistanceTraveled = useTrainStore((state) => state.setDistanceTraveled)
  const wagonCount = useTrainStore((state) => state.wagonCount)

  // Utiliser useState pour les wagons pour forcer le re-rendu
  const [wagons, setWagons] = useState<{ position: THREE.Vector3, rotation: THREE.Euler, scale: number, opacity: number }[]>([])

  const WAGON_SPACING = 0.5
  const WAGON_COLORS = ['#4a90e2', '#e24a4a', '#4ae24a', '#e2e24a', '#4ae2e2', '#e24ae2']
  const MAX_WAGONS = 10
  const ANIMATION_DURATION = 200
  const MOVEMENT_SPEED = 5
  
  // Synchroniser la vitesse du store avec la ref locale
  useEffect(() => {
    speed.current = storeSpeed
  }, [storeSpeed])

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
      // Forcer la mise à jour du chemin pour déclencher la génération des événements
      onPathUpdate([...pathPoints.current])
      
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

          // Calculer la direction et la rotation (même logique que le train principal)
          const direction = wagonNextPoint.clone().sub(wagonPoint).normalize()
          
        // Calculer l'angle de rotation sur l'axe Y (direction horizontale)
        const targetRotationY = Math.atan2(direction.x, direction.z)
          
          // Calculer l'angle de pente pour la rotation sur l'axe X
          const horizontalDistance = Math.sqrt(
            Math.pow(wagonNextPoint.x - wagonPoint.x, 2) +
            Math.pow(wagonNextPoint.z - wagonPoint.z, 2)
          )
          const heightDifference = wagonNextPoint.y - wagonPoint.y
          const slopeAngle = Math.atan2(heightDifference, horizontalDistance)
          
          // Appliquer les rotations
          rotation.y = targetRotationY
          rotation.x = -slopeAngle
          rotation.z = 0
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
    
    const sectionLength = 80
    const endPoint = new THREE.Vector3(
      lastPoint.x + Math.cos(newAngle) * sectionLength,
      0,
      lastPoint.z + Math.sin(newAngle) * sectionLength
    )

    const currentHeight = lastPoint.y
    const heightVariation = 10
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

        // Calculer la direction et la rotation (même logique que le train principal)
        const direction = wagonNextPoint.clone().sub(wagonPoint).normalize()
        
        // Calculer l'angle de rotation sur l'axe Y (direction horizontale)
        // Utiliser la même formule que le train principal
        const targetRotationY = Math.atan2(direction.x, direction.z) - Math.PI / 2
        
        // Calculer l'angle de pente pour la rotation sur l'axe X
        const horizontalDistance = Math.sqrt(
          Math.pow(wagonNextPoint.x - wagonPoint.x, 2) +
          Math.pow(wagonNextPoint.z - wagonPoint.z, 2)
        )
        const heightDifference = wagonNextPoint.y - wagonPoint.y
        const slopeAngle = Math.atan2(heightDifference, horizontalDistance)
        
        // Appliquer les rotations
        rotation.y = targetRotationY
        rotation.x = -slopeAngle
        rotation.z = 0
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
        onWagonCountUpdate(wagonCount)
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
          onWagonCountUpdate(wagonCount)
        }
      }, ANIMATION_DURATION)
    }
  }

  const updateWagons = () => {
    if (pathPoints.current.length < 2) return

    setWagons(prev => prev.map((wagon, index) => {
      const wagonOffset = (index + 1) * WAGON_SPACING
      const wagonPosition = currentPosition.current - wagonOffset
      
      // Gérer les positions négatives en utilisant modulo
      const normalizedPosition = ((wagonPosition % pathPoints.current.length) + pathPoints.current.length) % pathPoints.current.length
      const wagonPointIndex = Math.floor(normalizedPosition)
      const wagonNextPointIndex = (wagonPointIndex + 1) % pathPoints.current.length
      const wagonFraction = normalizedPosition - wagonPointIndex

      const wagonPoint = pathPoints.current[wagonPointIndex]
      const wagonNextPoint = pathPoints.current[wagonNextPointIndex]

      const position = new THREE.Vector3()
      const rotation = new THREE.Euler()

      if (wagonPoint && wagonNextPoint) {
        // Interpoler la position entre les points
        position.lerpVectors(wagonPoint, wagonNextPoint, wagonFraction)

        // Calculer la direction et la rotation (même logique que le train principal)
        const direction = wagonNextPoint.clone().sub(wagonPoint).normalize()
        
        // Calculer l'angle de rotation sur l'axe Y (direction horizontale)
        // Utiliser la même formule que le train principal
        const targetRotationY = Math.atan2(direction.x, direction.z) - Math.PI / 2
        
        // Calculer l'angle de pente pour la rotation sur l'axe X
        const horizontalDistance = Math.sqrt(
          Math.pow(wagonNextPoint.x - wagonPoint.x, 2) +
          Math.pow(wagonNextPoint.z - wagonPoint.z, 2)
        )
        const heightDifference = wagonNextPoint.y - wagonPoint.y
        const slopeAngle = Math.atan2(heightDifference, horizontalDistance)
        
        // Appliquer les rotations avec interpolation pour un mouvement plus fluide
        const currentWagonRotation = wagon.rotation
        rotation.y = THREE.MathUtils.lerp(
          currentWagonRotation.y,
          targetRotationY,
          0.1
        )
        rotation.x = THREE.MathUtils.lerp(
          currentWagonRotation.x,
          -slopeAngle,
          0.1
        )
        rotation.z = 0 // Pas de rotation sur l'axe Z
      }

      return {
        position,
        rotation,
        scale: wagon.scale,
        opacity: wagon.opacity
      }
    }))
  }

  useFrame(() => {
    if (!trainRef.current || pathPoints.current.length < 2) return

    // Utiliser la vitesse du store
    speed.current = storeSpeed

    // Avancer le train le long du chemin
    currentPosition.current += speed.current * MOVEMENT_SPEED * 0.01
    
    // Vérifier si nous avons besoin de générer une nouvelle section de chemin
    if (currentPosition.current > pathPoints.current.length - 20) {
      generateNewPathSection()
      createRailroad()
      onPathUpdate([...pathPoints.current])
    }
    
    // Calculer la position actuelle du train
    const pointIndex = Math.floor(currentPosition.current) % pathPoints.current.length
    const nextPointIndex = (pointIndex + 1) % pathPoints.current.length
    const fraction = currentPosition.current - Math.floor(currentPosition.current)
    
    const currentPoint = pathPoints.current[pointIndex]
    const nextPoint = pathPoints.current[nextPointIndex]
    
    if (currentPoint && nextPoint && trainRef.current) {
      // Interpoler la position entre les points
      trainRef.current.position.lerpVectors(currentPoint, nextPoint, fraction)
      
      // Calculer la direction et la rotation
      const direction = nextPoint.clone().sub(currentPoint).normalize()
      
      // Calculer l'angle de rotation sur l'axe Y (direction horizontale)
      // Le train doit regarder dans la direction de la voie
      const targetRotationY = Math.atan2(direction.x, direction.z) - Math.PI / 2
      
      // Calculer l'angle de pente pour la rotation sur l'axe X
      const horizontalDistance = Math.sqrt(
        Math.pow(nextPoint.x - currentPoint.x, 2) +
        Math.pow(nextPoint.z - currentPoint.z, 2)
      )
      const heightDifference = nextPoint.y - currentPoint.y
      const slopeAngle = Math.atan2(heightDifference, horizontalDistance)
      
      // Appliquer les rotations avec interpolation pour un mouvement plus fluide
      currentRotation.current.y = THREE.MathUtils.lerp(
        currentRotation.current.y,
        targetRotationY,
        0.1
      )
      currentRotation.current.x = THREE.MathUtils.lerp(
        currentRotation.current.x,
        -slopeAngle,
        0.1
      )
      
      trainRef.current.rotation.copy(currentRotation.current)
      
      // Mettre à jour le store Zustand
      setPosition(trainRef.current.position.clone())
      setRotation(currentRotation.current.clone())
      
      // Mettre à jour la position pour les composants parents (compatibilité)
      if (onPositionUpdate) {
        onPositionUpdate(trainRef.current.position)
      }
      
      // Mettre à jour la rotation pour les composants parents (compatibilité)
      if (onRotationUpdate) {
        onRotationUpdate(currentRotation.current)
      }
      
      // Mettre à jour la distance parcourue
      totalDistanceTraveled.current += speed.current * MOVEMENT_SPEED * 0.01
      if (distanceRef) {
        distanceRef.current = totalDistanceTraveled.current
      }
      setDistanceTraveled(totalDistanceTraveled.current)
    }
    
    // Mettre à jour les positions des wagons
    updateWagons()
  })

  return (
    <>
      <group ref={railsRef} />
      <group ref={trainRef}>
        {children || <Locomotive />}
        <SmokeParticles 
          position={new THREE.Vector3(0, 1.8, 0)} 
          speed={speed.current} 
        />
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
      <TrackEvents 
        pathPoints={pathPoints.current}
        trainPosition={trainRef.current?.position || new THREE.Vector3()}
      />
    </>
  )
}