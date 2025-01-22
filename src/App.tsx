import React, { useRef, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Sky } from '@react-three/drei'
import { Train } from './components/Train'
import { Track } from './components/Track'
import { useKeyboard } from './hooks/useKeyboard'

type SceneType = 'plain' | 'mountain' | 'seaside'
type Weather = 'sunny' | 'cloudy' | 'rainy'
type TimeOfDay = 'morning' | 'noon' | 'evening' | 'night'
export type ViewMode = 'thirdPerson' | 'cockpit' | 'pedestrian'

function Scene() {
  const controlsRef = useRef()
  const [viewMode, setViewMode] = useState<ViewMode>('thirdPerson')
  const [sceneType, setSceneType] = useState<SceneType>('plain')
  const [weather, setWeather] = useState<Weather>('sunny')
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('noon')
  useKeyboard()

  const handleViewModeChange = useCallback((newMode: ViewMode) => {
    setViewMode(newMode)
  }, [])
  
  // Calcul de la position du soleil selon l'heure
  const getSunPosition = () => {
    switch(timeOfDay) {
      case 'morning': return [5, 20, 100]
      case 'noon': return [100, 100, 100]
      case 'evening': return [200, 20, 100]
      case 'night': return [100, -100, 100]
    }
  }

  return (
    <>
      <OrbitControls 
        ref={controlsRef}
        makeDefault
        enableZoom={true}
        enableRotate={viewMode === 'thirdPerson'}
        enablePan={false}
        maxPolarAngle={Math.PI / 2 - 0.1}
        minDistance={5}
        maxDistance={50}
        rotateSpeed={0.5}
        zoomSpeed={1}
        mouseButtons={{
          LEFT: 0,     // 0 = ROTATE (rotation avec clic gauche)
          MIDDLE: 2,   // 2 = ZOOM (zoom avec molette)
          RIGHT: 1     // 1 = PAN (désactivé par enablePan=false)
        }}
        touches={{
          ONE: 0,      // Un doigt pour rotation
          TWO: 2       // Deux doigts pour zoom
        }}
      />
      <ambientLight intensity={timeOfDay === 'night' ? 0.1 : 0.5} />
      <directionalLight 
        position={getSunPosition()} 
        intensity={weather === 'cloudy' ? 0.5 : 1} 
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <Train 
        controlsRef={controlsRef} 
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />
      <Track sceneType={sceneType} />
      <Sky sunPosition={getSunPosition()} />
      <fog attach="fog" args={[
        '#ffffff',
        weather === 'cloudy' ? 10 : 30,
        weather === 'cloudy' ? 50 : 100
      ]} />
    </>
  )
}

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('thirdPerson')
  const [sceneType, setSceneType] = useState<SceneType>('plain')
  const [weather, setWeather] = useState<Weather>('sunny')
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('noon')
  
  return (
    <>
      <div style={{ width: '100vw', height: '100vh', background: 'black' }}>
        <Canvas shadows camera={{ position: [10, 5, 10], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>
      <div style={{
        position: 'fixed',
        bottom: 20,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: 'white',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '10px',
        fontFamily: 'monospace'
      }}>
        <div style={{ marginBottom: '10px' }}>
          {viewMode === 'thirdPerson' && "Vue troisième personne - Maintenir le clic gauche pour faire pivoter la caméra"}
          {viewMode === 'cockpit' && "Vue cockpit - Vous êtes aux commandes du train"}
          {viewMode === 'pedestrian' && "Vue piéton - Regardez le train passer"}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <select 
            value={sceneType} 
            onChange={(e) => setSceneType(e.target.value as SceneType)}
            style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid white', padding: '5px' }}
          >
            <option value="plain">Plaine</option>
            <option value="mountain">Montagnes</option>
            <option value="seaside">Bord de mer</option>
          </select>
          <select 
            value={weather} 
            onChange={(e) => setWeather(e.target.value as Weather)}
            style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid white', padding: '5px' }}
          >
            <option value="sunny">Ensoleillé</option>
            <option value="cloudy">Nuageux</option>
            <option value="rainy">Pluvieux</option>
          </select>
          <select 
            value={timeOfDay} 
            onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay)}
            style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid white', padding: '5px' }}
          >
            <option value="morning">Matin</option>
            <option value="noon">Midi</option>
            <option value="evening">Soir</option>
            <option value="night">Nuit</option>
          </select>
        </div>
        <div style={{ fontSize: '0.8em', marginTop: '10px' }}>
          Appuyez sur C pour changer de vue
        </div>
      </div>
    </>
  )
}

export default App
