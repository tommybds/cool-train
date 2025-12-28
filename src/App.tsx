import { Canvas } from '@react-three/fiber'
import { KeyboardControls, SoftShadows, AdaptiveDpr, AdaptiveEvents, PerformanceMonitor, ContactShadows } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Train } from './components/Train'
import { Path } from './components/Path'
import { MovingGrid } from './components/MovingGrid'
import { useState, useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three'
import { Suspense } from 'react'
import { Ground } from './components/Ground'
import { DistanceCounter } from './components/DistanceCounter'
import { Stats } from './components/Stats'
import { AnimatedLocomotive } from './components/AnimatedLocomotive'
import { Cockpit } from './components/Cockpit'
import { ModernBrakeSparkles } from './components/ModernBrakeSparkles'
import { ModernSmoke } from './components/ModernSmoke'
import { WeatherSystem, WeatherType } from './components/WeatherSystem'
import { EnvironmentInstanced } from './components/EnvironmentInstanced'
import { WaterSystem, RiverGenerator } from './components/WaterSystem'
import { DayNightCycle } from './components/DayNightCycle'
import { CameraSystem } from './components/CameraSystem'
import { PostProcessing } from './components/PostProcessing'
import { TrainControls } from './components/TrainControls'
import { useTrainStore } from './stores/trainStore'
import { useWeatherStore } from './stores/weatherStore'

export default function App() {
  // Store Zustand pour le train
  const trainPosition = useTrainStore((state) => state.position)
  const trainRotation = useTrainStore((state) => state.rotation)
  const speed = useTrainStore((state) => state.speed)
  const wagonCount = useTrainStore((state) => state.wagonCount)
  const fuelLevel = useTrainStore((state) => state.fuelLevel)
  const pressure = useTrainStore((state) => state.pressure)
  const viewMode = useTrainStore((state) => state.viewMode)
  const isBraking = useTrainStore((state) => state.isBraking)
  const distanceTraveled = useTrainStore((state) => state.distanceTraveled)
  const setViewMode = useTrainStore((state) => state.setViewMode)
  const setFuelLevel = useTrainStore((state) => state.setFuelLevel)
  const setPressure = useTrainStore((state) => state.setPressure)
  const addWagon = useTrainStore((state) => state.addWagon)
  const removeWagon = useTrainStore((state) => state.removeWagon)
  
  // Store Zustand pour la météo
  const weatherType = useWeatherStore((state) => state.type)
  const weatherIntensity = useWeatherStore((state) => state.intensity)
  const dayTime = useWeatherStore((state) => state.dayTime)
  const autoRotateTime = useWeatherStore((state) => state.autoRotateTime)
  const setWeatherType = useWeatherStore((state) => state.setType)
  const setWeatherIntensity = useWeatherStore((state) => state.setIntensity)
  const setDayTime = useWeatherStore((state) => state.setDayTime)
  const setAutoRotateTime = useWeatherStore((state) => state.setAutoRotateTime)
  
  const [pathPoints, setPathPoints] = useState<THREE.Vector3[]>([new THREE.Vector3(0, 0, 0)])
  const distanceRef = useRef(0)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    const addSound = new Audio('/sounds/wagon_add.mp3')
    const removeSound = new Audio('/sounds/wagon_remove.mp3')
    const brakeSound = new Audio('/sounds/brake.mp3')
    brakeSound.loop = true
    
    addSound.load()
    removeSound.load()
    brakeSound.load()

    window.wagonSounds = {
      add: addSound,
      remove: removeSound,
      brake: brakeSound
    }

    return () => {
      if (window.wagonSounds) {
        window.wagonSounds = { 
          add: new Audio(), 
          remove: new Audio(), 
          brake: new Audio() 
        };
      }
      brakeSound.pause()
    }
  }, [])
  
  // Synchroniser distanceRef avec le store
  useEffect(() => {
    distanceRef.current = distanceTraveled
  }, [distanceTraveled])
  
  // Gestion du carburant et de la pression
  useEffect(() => {
    const interval = setInterval(() => {
      if (speed > 0.1) {
        setFuelLevel(Math.max(0, fuelLevel - speed * 0.01))
      }
      
      const targetPressure = Math.max(1, 10 - speed * 5)
      setPressure(pressure + (targetPressure - pressure) * 0.1)
      
      if (fuelLevel <= 0 && speed > 0) {
        useTrainStore.getState().setSpeed(Math.max(0, speed - 0.05))
      }
    }, 500)
    
    return () => clearInterval(interval)
  }, [speed, fuelLevel, pressure, setFuelLevel, setPressure])

  const handlePathUpdate = (points: THREE.Vector3[]) => {
    setPathPoints([...points])
  }

  const handlePositionUpdate = (position: THREE.Vector3) => {
    useTrainStore.getState().setPosition(position)
  }

  const handleRotationUpdate = (rotation: THREE.Euler) => {
    useTrainStore.getState().setRotation(rotation)
  }

  const handleSpeedUpdate = (newSpeed: number) => {
    useTrainStore.getState().setSpeed(newSpeed)
  }

  const handleWagonCountUpdate = (count: number) => {
    // Le store gère déjà le wagonCount via addWagon/removeWagon
  }
  
  const handleDistanceUpdate = (distance: number) => {
    useTrainStore.getState().setDistanceTraveled(distance)
  }
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMenu(!showMenu)
      }
      
      if (e.key === 'v' || e.key === 'V') {
        setViewMode(viewMode === 'external' ? 'cockpit' : 'external')
      }
      
      if (e.code === 'F1') {
        setWeatherType(WeatherType.CLEAR)
        e.preventDefault()
      } else if (e.code === 'F2') {
        setWeatherType(WeatherType.CLOUDY)
        e.preventDefault()
      } else if (e.code === 'F3') {
        setWeatherType(WeatherType.RAINY)
        e.preventDefault()
      } else if (e.code === 'F4') {
        setWeatherType(WeatherType.STORMY)
        e.preventDefault()
      } else if (e.code === 'F5') {
        setWeatherType(WeatherType.SNOWY)
        e.preventDefault()
      } else if (e.code === 'F6') {
        setWeatherType(WeatherType.FOGGY)
        e.preventDefault()
      }
      
      if (e.code === 'BracketLeft') {
        setWeatherIntensity(Math.max(0, weatherIntensity - 0.1))
      } else if (e.code === 'BracketRight') {
        setWeatherIntensity(Math.min(1, weatherIntensity + 0.1))
      }
      
      if (e.code === 'KeyT') {
        setAutoRotateTime(!autoRotateTime)
      }
      if (!autoRotateTime) {
        if (e.code === 'Period') {
          setDayTime((dayTime + 0.02) % 1)
        } else if (e.code === 'Comma') {
          setDayTime((dayTime - 0.02 + 1) % 1)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showMenu])
  
  const waterBodies = useMemo(() => {
    if (pathPoints.length < 10) return []
    
    const lakes = []
    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * (pathPoints.length - 10)) + 5
      const point = pathPoints[randomIndex]
      const offset = new THREE.Vector3(
        (Math.random() * 2 - 1) * 100,
        -1,
        (Math.random() * 2 - 1) * 100
      )
      const position = point.clone().add(offset)
      const width = 30 + Math.random() * 70
      const length = 30 + Math.random() * 70
      
      lakes.push(RiverGenerator.createLake(position, width, length, 3))
    }
    
    const riverPath = []
    for (let i = 0; i < pathPoints.length; i += 20) {
      if (Math.random() > 0.7) {
        const pathPoint = pathPoints[i]
        const offset = new THREE.Vector3(
          (Math.random() * 2 - 1) * 80,
          -1,
          (Math.random() * 2 - 1) * 80
        )
        riverPath.push(pathPoint.clone().add(offset))
      }
    }
    
    const riverSegments = riverPath.length > 2 
      ? RiverGenerator.createRiverAlongPath(riverPath, 15, 2)
      : []
    
    return [...lakes, ...riverSegments]
  }, [pathPoints])

  return (
    <>
      <Stats />
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '16px',
        borderRadius: '8px',
        margin: '8px',
        fontFamily: 'monospace',
        zIndex: 1000
      }}>
        <span style={{ fontWeight: 'bold' }}>Speed: {speed.toFixed(2)}</span>
        <br />
        <span style={{ fontWeight: 'bold' }}>Wagons: {wagonCount}</span>
        <br />
        <span style={{ fontWeight: 'bold' }}>View: {viewMode}</span>
        <br />
        <span style={{ fontWeight: 'bold' }}>Fuel: {Math.round(fuelLevel)}%</span>
        <br />
        <span style={{ fontWeight: 'bold' }}>Weather: {weatherType}</span>
        <br />
        <span style={{ fontSize: '12px' }}>
          Press ESC to open/close menu
          <br />
          Use arrows/WASD to accelerate/slow down
          <br />
          A to add wagon, R to remove
          <br />
          V to toggle cockpit view
        </span>
      </div>

      {/* Menu d'interface utilisateur */}
      {showMenu && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: '20px',
          borderRadius: '10px',
          color: 'white',
          fontFamily: 'Arial, sans-serif',
          zIndex: 2000,
          minWidth: '300px'
        }}>
          <h2 style={{ textAlign: 'center', marginTop: 0 }}>Train Simulation Controls</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ marginBottom: '5px' }}>Weather</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {Object.values(WeatherType).map(type => (
                <button 
                  key={type}
                  onClick={() => setWeatherType(type)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: weatherType === type ? '#4a90e2' : '#555',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer',
                    flex: '1 0 auto'
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ marginBottom: '5px' }}>Weather Intensity: {(weatherIntensity * 100).toFixed(0)}%</h3>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              value={weatherIntensity}
              onChange={(e) => setWeatherIntensity(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ marginBottom: '5px' }}>Time of Day</h3>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <input 
                type="checkbox" 
                id="autoRotateTime" 
                checked={autoRotateTime}
                onChange={() => setAutoRotateTime(!autoRotateTime)}
                style={{ marginRight: '10px' }}
              />
              <label htmlFor="autoRotateTime">Auto-rotate time</label>
            </div>
            
            {!autoRotateTime && (
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={dayTime}
                onChange={(e) => setDayTime(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Midnight</span>
              <span>Dawn</span>
              <span>Noon</span>
              <span>Dusk</span>
            </div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ marginBottom: '5px' }}>Train Controls</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => removeWagon()}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#e74c3c',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Remove Wagon
              </button>
              <button 
                onClick={() => addWagon()}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#2ecc71',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Add Wagon
              </button>
            </div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ marginBottom: '5px' }}>View</h3>
            <button 
              onClick={() => setViewMode(viewMode === 'external' ? 'cockpit' : 'external')}
              style={{
                padding: '8px 12px',
                backgroundColor: '#9b59b6',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Toggle {viewMode === 'external' ? 'Cockpit' : 'External'} View
            </button>
          </div>
          
          <button 
            onClick={() => setShowMenu(false)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#34495e',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Close Menu
          </button>
        </div>
      )}
      
      <KeyboardControls
        map={[
          { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
          { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
          { name: 'addWagon', keys: ['KeyA'] },
          { name: 'removeWagon', keys: ['KeyR'] }
        ]}
      >
        <Canvas shadows camera={{ position: [0, 8, 20], fov: 50 }}>
          <Physics gravity={[0, -9.81, 0]}>
            <AdaptiveDpr pixelated />
            <AdaptiveEvents />
            <SoftShadows size={2.5} samples={16} />
            
            <TrainControls />
            
            <CameraSystem />
            
            <DayNightCycle 
              time={dayTime}
              autoRotate={autoRotateTime}
              trainPosition={trainPosition}
              weatherType={weatherType}
              weatherIntensity={weatherIntensity}
            />
            
            <WeatherSystem 
              weatherType={weatherType}
              intensity={weatherIntensity}
              position={trainPosition}
              time={dayTime}
            />

            <Suspense fallback={null}>
              <MovingGrid position={trainPosition} points={pathPoints} size={200} divisions={30} />
              
              {viewMode === 'external' ? (
                <group>
                  <Train 
                    onPathUpdate={handlePathUpdate} 
                    onPositionUpdate={handlePositionUpdate}
                    onRotationUpdate={handleRotationUpdate}
                    onSpeedUpdate={handleSpeedUpdate}
                    onWagonCountUpdate={handleWagonCountUpdate}
                    initialSpeed={speed}
                    distanceRef={distanceRef}
                  >
                    <AnimatedLocomotive speed={speed} />
                  </Train>
                  
                  <ModernSmoke position={trainPosition} />
                  
                  <ModernBrakeSparkles
                    position={trainPosition}
                  />
                </group>
              ) : (
                <group>
                  <Train 
                    onPathUpdate={handlePathUpdate} 
                    onPositionUpdate={handlePositionUpdate}
                    onRotationUpdate={handleRotationUpdate}
                    onSpeedUpdate={handleSpeedUpdate}
                    onWagonCountUpdate={handleWagonCountUpdate}
                    initialSpeed={speed}
                    distanceRef={distanceRef}
                  />
                  <group position={[
                    trainPosition.x,
                    trainPosition.y + 2.2,
                    trainPosition.z
                  ]}>
                    <Cockpit 
                      speed={speed}
                      maxSpeed={2}
                      pressure={pressure}
                      maxPressure={10}
                      isBraking={isBraking}
                      distanceTraveled={distanceTraveled}
                      fuelLevel={fuelLevel}
                      maxFuel={100}
                      isActive={viewMode === 'cockpit'}
                      trainRotation={trainRotation}
                    />
                  </group>
                </group>
              )}
              
              <Path points={pathPoints} />
              <Ground />
              
              <EnvironmentInstanced 
                pathPoints={pathPoints}
                terrainSize={500}
                density={{
                  trees: 0.6,
                  grass: 0.7,
                  rocks: 0.4
                }}
              />
              
              <WaterSystem
                waterBodies={waterBodies}
              />
            </Suspense>
            
            <ContactShadows 
              opacity={0.4} 
              scale={100} 
              blur={2.4} 
              far={20}
              resolution={512}
              color="#000000"
            />
            
            <PostProcessing />
            
            <PerformanceMonitor />
          </Physics>
        </Canvas>
      </KeyboardControls>
      <DistanceCounter distance={distanceTraveled} />
    </>
  )
}
