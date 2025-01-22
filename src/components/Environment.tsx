import React, { useMemo, useRef, useEffect } from 'react'
import { Sky } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { SceneType, Weather, TimeOfDay, SunPosition } from '../types'
import { createNoise2D } from 'simplex-noise'

interface EnvironmentProps {
  sceneType: SceneType
  weather: Weather
  timeOfDay: TimeOfDay
  onTerrainGenerated: (heightMap: (x: number, z: number) => number) => void
  trainPosition?: THREE.Vector3
}

function Tree({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position}>
      {/* Tronc */}
      <mesh castShadow position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 3]} />
        <meshStandardMaterial color="#3e2723" />
      </mesh>
      {/* Feuillage */}
      <mesh castShadow position={[0, 3.5, 0]}>
        <coneGeometry args={[1.5, 3, 8]} />
        <meshStandardMaterial color="#2e7d32" />
      </mesh>
    </group>
  )
}

export function Environment({ sceneType, weather, timeOfDay, onTerrainGenerated, trainPosition }: EnvironmentProps) {
  const terrainRef = useRef<THREE.Mesh>(null)
  const lastPosition = useRef<THREE.Vector3>(new THREE.Vector3())
  const noise2D = useMemo(() => createNoise2D(), [])
  const { camera } = useThree()

  const params = useMemo(() => ({
    scale: sceneType === 'mountain' ? 150 : 100,
    heightScale: sceneType === 'mountain' ? 15 : 5,
    octaves: sceneType === 'mountain' ? 6 : 3,
    persistence: sceneType === 'mountain' ? 0.5 : 0.3,
    railwayWidth: 5,
    chunkSize: 400,
    resolution: 100
  }), [sceneType])

  const getHeight = useMemo(() => {
    return (x: number, z: number) => {
      let height = 0
      let frequency = 1
      let amplitude = 1
      let totalAmplitude = 0
      
      for (let i = 0; i < params.octaves; i++) {
        height += noise2D(x / params.scale * frequency, z / params.scale * frequency) * amplitude
        totalAmplitude += amplitude
        frequency *= 2
        amplitude *= params.persistence
      }
      
      height = height / totalAmplitude
      
      const trainX = trainPosition?.x || 0
      const distanceFromTrack = Math.abs(x - trainX)
      if (distanceFromTrack < params.railwayWidth) {
        const t = distanceFromTrack / params.railwayWidth
        const smoothStep = t * t * (3 - 2 * t)
        height *= smoothStep
      }
      
      return height * params.heightScale
    }
  }, [noise2D, params, trainPosition])

  const generateTerrain = (centerX: number, centerZ: number) => {
    const vertices = []
    const indices = []

    for (let i = 0; i <= params.resolution; i++) {
      for (let j = 0; j <= params.resolution; j++) {
        const x = centerX + (i / params.resolution - 0.5) * params.chunkSize
        const z = centerZ + (j / params.resolution - 0.5) * params.chunkSize
        const y = getHeight(x, z)
        vertices.push(x, y, z)
      }
    }

    for (let i = 0; i < params.resolution; i++) {
      for (let j = 0; j < params.resolution; j++) {
        const a = i * (params.resolution + 1) + j
        const b = a + 1
        const c = a + (params.resolution + 1)
        const d = c + 1
        indices.push(a, b, d)
        indices.push(a, d, c)
      }
    }

    if (terrainRef.current) {
      const geometry = terrainRef.current.geometry
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
      geometry.setIndex(indices)
      geometry.computeVertexNormals()
      geometry.computeBoundingSphere()
    }
  }

  // Initialiser le terrain au montage
  useEffect(() => {
    generateTerrain(0, 0)
    onTerrainGenerated(getHeight)
  }, [getHeight])

  // Mettre à jour le terrain quand le train bouge
  useFrame(() => {
    if (trainPosition) {
      if (!lastPosition.current.equals(trainPosition)) {
        generateTerrain(trainPosition.x, trainPosition.z)
        lastPosition.current.copy(trainPosition)
      }
      // Mettre à jour la position de la Sky et du brouillard
      camera.updateMatrixWorld()
    }
  })

  const treePositions = useMemo(() => {
    if (!trainPosition) return []
    
    const positions: THREE.Vector3[] = []
    const numTrees = sceneType === 'mountain' ? 200 : 100
    const spread = params.chunkSize * 0.8

    for (let i = 0; i < numTrees; i++) {
      const x = trainPosition.x + (Math.random() * spread - spread/2)
      const z = trainPosition.z + (Math.random() * spread - spread/2)
      const y = getHeight(x, z)
      
      if (Math.abs(x - trainPosition.x) > params.railwayWidth * 2) {
        positions.push(new THREE.Vector3(x, y, z))
      }
    }

    return positions
  }, [sceneType, getHeight, params, trainPosition])

  const getSunPosition = (): SunPosition => {
    switch(timeOfDay) {
      case 'morning': return [5, 20, 100]
      case 'noon': return [100, 100, 100]
      case 'evening': return [200, 20, 100]
      case 'night': return [100, -100, 100]
    }
  }

  const getLightIntensity = () => {
    const baseIntensity = timeOfDay === 'night' ? 0.1 : 0.5
    return weather === 'cloudy' ? baseIntensity * 0.5 : baseIntensity
  }

  const sunPos = getSunPosition()
  const sunVector = new THREE.Vector3(...sunPos)

  return (
    <>
      <Sky distance={450000} sunPosition={sunVector} />
      <ambientLight intensity={getLightIntensity()} />
      <directionalLight 
        position={sunVector}
        intensity={weather === 'cloudy' ? 0.5 : 1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      <mesh ref={terrainRef} receiveShadow>
        <bufferGeometry />
        <meshStandardMaterial 
          color={sceneType === 'mountain' ? '#4b5320' : '#4caf50'}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {treePositions.map((position, index) => (
        <Tree key={index} position={position} />
      ))}

      <fog 
        attach="fog" 
        args={[
          weather === 'rainy' ? '#203040' : (weather === 'cloudy' ? '#808080' : '#ffffff'),
          weather === 'rainy' ? 50 : 100,
          weather === 'rainy' ? 300 : 1000
        ]} 
      />
    </>
  )
} 