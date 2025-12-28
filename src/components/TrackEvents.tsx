import * as THREE from 'three'
import { useRef, useEffect } from 'react'
import { Text } from '@react-three/drei'

interface TrackEventsProps {
  pathPoints: THREE.Vector3[]
  trainPosition?: THREE.Vector3
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

export function TrackEvents({ pathPoints, trainPosition }: TrackEventsProps) {
  const events = useRef<TrackEvent[]>([])
  const MIN_EVENT_SPACING = 50

  const generateEvents = () => {
    if (!pathPoints || pathPoints.length < 2) return
    
    console.log('Generating events for path length:', pathPoints.length)
    const newEvents: TrackEvent[] = []

    try {
      // Parcourir tous les points du chemin
      for (let i = 0; i < pathPoints.length - 1; i++) {
        const currentPoint = pathPoints[i]
        const nextPoint = pathPoints[i + 1]
        
        if (!currentPoint || !nextPoint) continue
        
        const direction = nextPoint.clone().sub(currentPoint).normalize()

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
      }

      events.current = newEvents
    } catch (error) {
      console.error('Error generating events:', error)
    }
  }

  // Générer les événements immédiatement quand les points du chemin changent
  useEffect(() => {
    console.log('Path points updated:', pathPoints)
    if (pathPoints.length >= 2) {
      generateEvents()
    }
  }, [pathPoints])

  return (
    <group>
      {events.current.map((event, index) => {
        switch (event.type) {
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