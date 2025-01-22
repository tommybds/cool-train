import { useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Train } from './components/Train'
import { Track } from './components/Track'
import { Environment } from './components/Environment'
import { useKeyboard } from './hooks/useKeyboard'
import { SceneType, Weather, TimeOfDay, ViewMode, OrbitControlsImpl } from './types'
import * as THREE from 'three'

function Scene({
  sceneType,
  weather,
  timeOfDay,
  viewMode,
  setViewMode
}: {
  sceneType: SceneType
  weather: Weather
  timeOfDay: TimeOfDay
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const trainRef = useRef<THREE.Group>(null)
  const [getTerrainHeight, setTerrainHeight] = useState<((x: number, z: number) => number) | null>(null)
  useKeyboard()

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
          LEFT: 0,
          MIDDLE: 2,
          RIGHT: 1
        }}
      />
      <Environment 
        sceneType={sceneType}
        weather={weather}
        timeOfDay={timeOfDay}
        onTerrainGenerated={setTerrainHeight}
        trainPosition={trainRef.current?.position}
      />
      <Train 
        ref={trainRef}
        controlsRef={controlsRef}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        getTerrainHeight={getTerrainHeight || undefined}
      />
      {getTerrainHeight && (
        <Track 
          getTerrainHeight={getTerrainHeight}
        />
      )}
    </>
  )
}

export default function App() {
  const [sceneType, setSceneType] = useState<SceneType>('mountain')
  const [weather, setWeather] = useState<Weather>('sunny')
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('noon')
  const [viewMode, setViewMode] = useState<ViewMode>('thirdPerson')

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", background: "black" }}>
      <Canvas shadows>
        <Scene
          sceneType={sceneType}
          weather={weather}
          timeOfDay={timeOfDay}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </Canvas>
      <div style={{ 
        position: "absolute", 
        bottom: "20px", 
        left: "0", 
        right: "0",
        color: "white",
        textAlign: "center",
        zIndex: 10
      }}>
        <div style={{ marginBottom: "10px" }}>
          {viewMode === "thirdPerson" &&
            "Vue troisième personne - Maintenir le clic gauche pour faire pivoter la caméra"}
          {viewMode === "cockpit" &&
            "Vue cockpit - Vous êtes aux commandes du train"}
          {viewMode === "pedestrian" && "Vue piéton - Regardez le train passer"}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
          <select
            value={sceneType}
            onChange={(e) => setSceneType(e.target.value as SceneType)}
            style={{
              background: "rgba(0,0,0,0.5)",
              color: "white",
              border: "1px solid white",
              padding: "5px",
            }}
          >
            <option value="plain">Plaine</option>
            <option value="mountain">Montagnes</option>
            <option value="seaside">Bord de mer</option>
          </select>
          <select
            value={weather}
            onChange={(e) => setWeather(e.target.value as Weather)}
            style={{
              background: "rgba(0,0,0,0.5)",
              color: "white",
              border: "1px solid white",
              padding: "5px",
            }}
          >
            <option value="sunny">Ensoleillé</option>
            <option value="cloudy">Nuageux</option>
            <option value="rainy">Pluvieux</option>
          </select>
          <select
            value={timeOfDay}
            onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay)}
            style={{
              background: "rgba(0,0,0,0.5)",
              color: "white",
              border: "1px solid white",
              padding: "5px",
            }}
          >
            <option value="morning">Matin</option>
            <option value="noon">Midi</option>
            <option value="evening">Soir</option>
            <option value="night">Nuit</option>
          </select>
        </div>
        <div style={{ fontSize: "0.8em", marginTop: "10px" }}>
          Appuyez sur C pour changer de vue
        </div>
      </div>
    </div>
  );
}
