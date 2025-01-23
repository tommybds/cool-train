import { Canvas } from '@react-three/fiber'
import { OrbitControls, KeyboardControls, Sky, Environment, Stars, Cloud, SoftShadows, AdaptiveDpr, AdaptiveEvents, PerformanceMonitor, ContactShadows } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Train } from './components/Train'
import { Path } from './components/Path'
import { MovingGrid } from './components/MovingGrid'
import { useState, useEffect } from 'react'
import * as THREE from 'three'
import { Suspense } from 'react'
import { Ground } from './components/Ground'

export default function App() {
  const [pathPoints, setPathPoints] = useState<THREE.Vector3[]>([new THREE.Vector3(0, 0, 0)])
  const [trainPosition, setTrainPosition] = useState(new THREE.Vector3(0, 0, 0))
  const [speed, setSpeed] = useState(0.91)
  const [wagonCount, setWagonCount] = useState(3)

  // Création des sons
  useEffect(() => {
    const addSound = new Audio('/sounds/wagon_add.mp3')
    const removeSound = new Audio('/sounds/wagon_remove.mp3')
    
    // Précharger les sons
    addSound.load()
    removeSound.load()

    // Ajouter les sons au window pour y accéder depuis le composant Train
    window.wagonSounds = {
      add: addSound,
      remove: removeSound
    }

    return () => {
      
      delete window.wagonSounds
    }
  }, [])

  const handlePathUpdate = (points: THREE.Vector3[]) => {
    setPathPoints([...points])
  }

  const handlePositionUpdate = (position: THREE.Vector3) => {
    setTrainPosition(position)
  }

  const handleSpeedUpdate = (newSpeed: number) => {
    setSpeed(newSpeed)
  }

  const handleWagonCountUpdate = (count: number) => {
    setWagonCount(count)
  }

  return (
    <>
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '16px',
        borderRadius: '8px',
        margin: '8px',
        fontFamily: 'sans-serif',
        padding: '10px',
        borderRadius: '5px',
        fontFamily: 'monospace',
        zIndex: 1000
      }}>
        <span style={{ fontWeight: 'bold' }}>Speed: {speed.toFixed(2)}</span>
        <br />
        <span style={{ fontWeight: 'bold' }}>Wagons: {wagonCount}</span>
        <br />
        <span style={{ fontSize: '12px' }}>
          Use arrows/WASD to accelerate/slow down
          <br />
          Press A to add wagon, R to remove
        </span>
      </div>
      <KeyboardControls
        map={[
          { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
          { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
          { name: 'addWagon', keys: ['KeyA'] },
          { name: 'removeWagon', keys: ['KeyR'] }
        ]}
      >
        <Canvas shadows camera={{ position: [0, 10, 15], fov: 50 }}>
          <Physics gravity={[0, -9.81, 0]}>
            <AdaptiveDpr pixelated />
            <AdaptiveEvents />
            <SoftShadows size={2.5} samples={16} />
            <Environment preset="sunset" />
            <color attach="background" args={['#87CEEB']} />
            <Sky sunPosition={[100, 10, 100]} />
            <Stars radius={100} depth={50} count={5000} factor={4} />
            <Cloud position={[0, 100, 0]} opacity={0.5} speed={0.4} segments={20} />

            <ambientLight intensity={0.5} />
            <directionalLight 
              position={[50, 50, 25]} 
              intensity={1} 
              castShadow 
              shadow-mapSize={[2048, 2048]}
              shadow-camera-far={100}
              shadow-camera-near={1}
              shadow-camera-top={50}
              shadow-camera-bottom={-50}
              shadow-camera-left={-50}
              shadow-camera-right={50}
            />
            
            <Suspense fallback={null}>
              <MovingGrid position={trainPosition} points={pathPoints} size={200} divisions={30} />
              <Train 
                onPathUpdate={handlePathUpdate} 
                onPositionUpdate={handlePositionUpdate}
                onSpeedUpdate={handleSpeedUpdate}
                onWagonCountUpdate={handleWagonCountUpdate}
                initialSpeed={speed}
              />
              <Path points={pathPoints} />
              <Ground />
            </Suspense>

            <OrbitControls
              target={trainPosition}
              enablePan={true}
              minDistance={5}
              maxDistance={30}
              minPolarAngle={Math.PI * 0.2}
              maxPolarAngle={Math.PI * 0.4}
              makeDefault
              enableDamping
              dampingFactor={0.05}
              rotateSpeed={0.5}
              autoRotate={false}
              enableZoom={true}
              zoomSpeed={0.5}
            />
            
            <ContactShadows 
              opacity={0.4} 
              scale={100} 
              blur={2.4} 
              far={20}
              resolution={512}
              color="#000000"
            />
            
            <PerformanceMonitor />
          </Physics>
        </Canvas>
      </KeyboardControls>
    </>
  )
}
