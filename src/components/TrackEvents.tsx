import * as THREE from 'three'
import { useRef, useEffect } from 'react'
import { Text } from '@react-three/drei'

interface TrackEventsProps {
  pathPoints: THREE.Vector3[]
}

interface TrackEvent {
  type: 'kilometer' | 'station' | 'signal' | 'tree' | 'rock' | 'sign'
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: number
  data?: {
    kilometer?: number
  }
}

function Station() {
  return (
    <group>
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[6, 4, 4]} />
        <meshStandardMaterial color="#e8e8e8" />
      </mesh>
      <mesh position={[0, 4, 2.5]}>
        <boxGeometry args={[7, 1, 1]} />
        <meshStandardMaterial color="#c62828" />
      </mesh>
    </group>
  )
}

function Signal() {
  return (
    <group>
      <mesh position={[0, 3, 0]}>
        <boxGeometry args={[0.3, 6, 0.3]} />
        <meshStandardMaterial color="#424242" />
      </mesh>
      <mesh position={[0, 5, 0.5]}>
        <boxGeometry args={[0.8, 1.5, 0.2]} />
        <meshStandardMaterial color="#424242" />
      </mesh>
      <mesh position={[0, 5.5, 0.6]}>
        <sphereGeometry args={[0.3]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>
      <mesh position={[0, 5, 0.6]}>
        <sphereGeometry args={[0.3]} />
        <meshStandardMaterial color="#ffeb3b" />
      </mesh>
      <mesh position={[0, 4.5, 0.6]}>
        <sphereGeometry args={[0.3]} />
        <meshStandardMaterial color="#4caf50" />
      </mesh>
    </group>
  )
}

function Tree() {
  return (
    <group>
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0, 2, 6]} />
        <meshStandardMaterial color="#2e7d32" />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 1.6]} />
        <meshStandardMaterial color="#795548" />
      </mesh>
    </group>
  )
}

function Rock() {
  return (
    <group>
      <mesh position={[0, 0.8, 0]}>
        <dodecahedronGeometry args={[1.5]} />
        <meshStandardMaterial color="#9e9e9e" roughness={0.8} />
      </mesh>
    </group>
  )
}

function Sign({ text = "STATION" }) {
  return (
    <group>
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[0.2, 4, 0.2]} />
        <meshStandardMaterial color="#424242" />
      </mesh>
      <mesh position={[0, 3.5, 0]}>
        <boxGeometry args={[2, 1, 0.1]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      <Text position={[0, 3.5, 0.1]} fontSize={0.4} color="black">
        {text}
      </Text>
    </group>
  )
}

export function TrackEvents({ pathPoints }: TrackEventsProps) {
  const events = useRef<TrackEvent[]>([])
  const METERS_PER_UNIT = 100
  const MIN_EVENT_SPACING = 50

  const generateEvents = () => {
    console.log('Generating events for path length:', pathPoints.length)
    const newEvents: TrackEvent[] = []

    // Ajouter une borne au départ
    if (pathPoints.length > 1) {
      const startDirection = pathPoints[1].clone().sub(pathPoints[0]).normalize()
      const startPosition = pathPoints[0].clone()
      const startOffset = new THREE.Vector3(-startDirection.z, 0, startDirection.x).multiplyScalar(2)
      startPosition.add(startOffset)

      newEvents.push({
        type: 'kilometer',
        position: startPosition,
        rotation: new THREE.Euler(0, Math.atan2(startDirection.x, startDirection.z), 0),
        scale: 1,
        data: { kilometer: 0 }
      })
      console.log('Added start marker at:', startPosition)
    }

    // Calculer la distance totale
    let accumulatedDistance = 0

    // Parcourir tous les points du chemin
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const currentPoint = pathPoints[i]
      const nextPoint = pathPoints[i + 1]
      const segmentLength = currentPoint.distanceTo(nextPoint)
      const direction = nextPoint.clone().sub(currentPoint).normalize()

      // Vérifier si nous devons placer une borne kilométrique
      const currentKm = Math.floor(accumulatedDistance * METERS_PER_UNIT / 1000)
      const nextKm = Math.floor((accumulatedDistance + segmentLength) * METERS_PER_UNIT / 1000)

      if (nextKm > currentKm) {
        // Calculer la position exacte du kilomètre
        const kmDistance = (currentKm + 1) * 1000 / METERS_PER_UNIT - accumulatedDistance
        const fraction = kmDistance / segmentLength
        const position = currentPoint.clone().lerp(nextPoint, fraction)
        const offset = new THREE.Vector3(-direction.z, 0, direction.x).multiplyScalar(2)
        position.add(offset)

        newEvents.push({
          type: 'kilometer',
          position,
          rotation: new THREE.Euler(0, Math.atan2(direction.x, direction.z), 0),
          scale: 1,
          data: { kilometer: nextKm }
        })
      }

      // Autres événements aléatoires
      if (i % MIN_EVENT_SPACING === 0 && Math.random() < 0.3) {
        const eventType = ['station', 'signal', 'tree', 'rock', 'sign'][Math.floor(Math.random() * 5)] as TrackEvent['type']
        const position = currentPoint.clone()
        const side = Math.random() < 0.5 ? -1 : 1
        const offset = new THREE.Vector3(-direction.z, 0, direction.x).multiplyScalar(side * 3)
        position.add(offset)

        newEvents.push({
          type: eventType,
          position,
          rotation: new THREE.Euler(0, Math.atan2(direction.x, direction.z), 0),
          scale: 1
        })
      }

      accumulatedDistance += segmentLength
    }

    events.current = newEvents
  }

  // Générer les événements immédiatement quand les points du chemin changent
  useEffect(() => {
    console.log('Path points updated:', pathPoints)
    if (pathPoints.length >= 2) {
      generateEvents()
    }
  }, [pathPoints])

  const KilometerMarker = ({ position, rotation, data, scale }: TrackEvent) => {
    return (
      <group position={position} rotation={rotation} scale={scale}>
        {/* Poteau principal */}
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[0.3, 3, 0.3]} />
          <meshStandardMaterial color="#666666" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Panneau */}
        <mesh position={[0, 2.8, 0]}>
          <boxGeometry args={[1.2, 0.8, 0.1]} />
          <meshStandardMaterial color="#444444" metalness={0.4} roughness={0.6} />
        </mesh>
        {/* Texte face avant */}
        <Text 
          position={[0, 2.8, 0.06]} 
          fontSize={0.4} 
          color="white"
          anchorX="center"
          anchorY="middle"
          font="/fonts/Inter-Bold.woff"
        >
          {`${data?.kilometer}km`}
        </Text>
        {/* Texte face arrière */}
        <Text 
          position={[0, 2.8, -0.06]} 
          fontSize={0.4} 
          color="white"
          anchorX="center"
          anchorY="middle"
          rotation={[0, Math.PI, 0]}
          font="/fonts/Inter-Bold.woff"
        >
          {`${data?.kilometer}km`}
        </Text>
      </group>
    )
  }

  return (
    <group>
      {events.current.map((event, index) => {
        switch (event.type) {
          case 'kilometer':
            return <KilometerMarker key={`km-${index}`} {...event} />
          case 'station':
            return <group key={`station-${index}`} position={event.position} rotation={event.rotation} scale={event.scale}><Station /></group>
          case 'signal':
            return <group key={`signal-${index}`} position={event.position} rotation={event.rotation} scale={event.scale}><Signal /></group>
          case 'tree':
            return <group key={`tree-${index}`} position={event.position} rotation={event.rotation} scale={event.scale}><Tree /></group>
          case 'rock':
            return <group key={`rock-${index}`} position={event.position} rotation={event.rotation} scale={event.scale}><Rock /></group>
          case 'sign':
            return <group key={`sign-${index}`} position={event.position} rotation={event.rotation} scale={event.scale}><Sign text="STATION" /></group>
          default:
            return null
        }
      })}
    </group>
  )
} 