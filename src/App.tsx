import { Canvas } from '@react-three/fiber'
import { OrbitControls, KeyboardControls, PerspectiveCamera } from '@react-three/drei'
import { Train } from './components/Train'
import { Path } from './components/Path'
import { MovingGrid } from './components/MovingGrid'
import { useState } from 'react'
import * as THREE from 'three'

export default function App() {
  const [pathPoints, setPathPoints] = useState<THREE.Vector3[]>([new THREE.Vector3(0, 0, 0)])
  const [trainPosition, setTrainPosition] = useState(new THREE.Vector3(0, 0, 0))
  const [speed, setSpeed] = useState(0.5)

  const handlePathUpdate = (points: THREE.Vector3[]) => {
    setPathPoints([...points])
  }

  const handlePositionUpdate = (position: THREE.Vector3) => {
    setTrainPosition(position)
  }

  const handleSpeedUpdate = (newSpeed: number) => {
    setSpeed(newSpeed)
  }

  return (
    <KeyboardControls
      map={[
        { name: 'speedUp', keys: ['KeyZ', 'ArrowUp'] },
        { name: 'speedDown', keys: ['KeyS', 'ArrowDown'] },
      ]}
    >
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          color: 'white',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '10px',
          borderRadius: '5px',
          fontFamily: 'monospace',
          zIndex: 1000
        }}>
          Speed: {speed.toFixed(2)}x
          <br />
          <span style={{ fontSize: '0.8em' }}>Use Z/↑ to accelerate, S/↓ to slow down</span>
        </div>
        <Canvas>
          <color attach="background" args={['#000']} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <MovingGrid position={trainPosition} points={pathPoints} size={200} divisions={30} />
          <Train 
            onPathUpdate={handlePathUpdate} 
            onPositionUpdate={handlePositionUpdate}
            onSpeedUpdate={handleSpeedUpdate}
            initialSpeed={speed}
          />
          <Path points={pathPoints} />
          <OrbitControls
            target={trainPosition}
            enablePan={false}
            minDistance={10}
            maxDistance={30}
            minPolarAngle={Math.PI * 0.15}
            maxPolarAngle={Math.PI * 0.4}
            makeDefault
            enableDamping
            dampingFactor={0.05}
            rotateSpeed={0.5}
            autoRotate={false}
            enableZoom={true}
            zoomSpeed={0.5}
          />
          <PerspectiveCamera
            makeDefault
            position={[0, 10, 15]}
            fov={60}
            near={0.1}
            far={1000}
          />
        </Canvas>
      </div>
    </KeyboardControls>
  )
}
