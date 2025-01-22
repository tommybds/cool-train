import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Sky } from '@react-three/drei'
import { Train } from './components/Train'
import { Track } from './components/Track'
import { useKeyboard } from './hooks/useKeyboard'

function Scene() {
  useKeyboard()
  return (
    <>
      <OrbitControls 
        makeDefault
        enableZoom={true}
        enableRotate={true}
        enablePan={false}
        maxPolarAngle={Math.PI / 2 - 0.1}
        minDistance={5}
        maxDistance={50}
        rotateSpeed={0.5}        // Vitesse de rotation
        zoomSpeed={1}            // Vitesse de zoom
        mouseButtons={{
          LEFT: 0,               // 0 = Rotation par défaut (sans maintenir le clic)
          MIDDLE: 1,             // 1 = Zoom avec le clic du milieu
          RIGHT: 2               // 2 = Pan (désactivé par enablePan=false)
        }}
      />
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1} 
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <Train />
      <Track />
      <Sky sunPosition={[100, 20, 100]} />
      <fog attach="fog" args={['#ffffff', 30, 100]} />
    </>
  )
}

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: 'black' }}>
      <Canvas shadows>
        <Scene />
      </Canvas>
    </div>
  )
}

export default App
