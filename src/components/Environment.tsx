import React, { useMemo, useRef, useEffect } from 'react'
import { Sky } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EnvironmentProps } from '../types'
import { createNoise2D } from 'simplex-noise'

function Tree({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 3]} />
        <meshStandardMaterial color="#3e2723" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 3.5, 0]}>
        <coneGeometry args={[1.5, 3, 8]} />
        <meshStandardMaterial color="#2e7d32" roughness={0.8} />
      </mesh>
    </group>
  )
}

export function Environment({ sceneType, weather, timeOfDay, onTerrainGenerated, trainPosition, trackPath }: EnvironmentProps) {
  const terrainRef = useRef<THREE.Mesh>(null)
  const noise2D = useMemo(() => createNoise2D(), [])
  const treesRef = useRef<THREE.Vector3[]>([])
  const lightRef = useRef<THREE.DirectionalLight>(null)

  const params = useMemo(() => ({
    scale: sceneType === 'mountain' ? 150 : 100,
    heightScale: sceneType === 'mountain' ? 15 : 5,
    octaves: sceneType === 'mountain' ? 6 : 3,
    persistence: sceneType === 'mountain' ? 0.5 : 0.3,
    railwayWidth: 5,
    chunkSize: 50,
    resolution: 32,
    renderDistance: 5
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

      if (trackPath) {
        const points = trackPath.getPoints(200)
        let minDist = Infinity
        let closestPoint = null

        for (let i = 0; i < points.length; i++) {
          const point = points[i]
          const dist = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.z - z, 2))
          if (dist < minDist) {
            minDist = dist
            closestPoint = point
          }
        }

        if (closestPoint && minDist < params.railwayWidth * 4) {
          const t = Math.min(minDist / (params.railwayWidth * 4), 1)
          const smoothStep = t * t * (3 - 2 * t)
          return closestPoint.y + height * smoothStep * params.heightScale
        }
      }
      
      return height * params.heightScale
    }
  }, [noise2D, params, trackPath])

  const sunPos = useMemo(() => {
    switch(timeOfDay) {
      case 'morning': return new THREE.Vector3(5, 20, 100)
      case 'noon': return new THREE.Vector3(100, 100, 100)
      case 'evening': return new THREE.Vector3(200, 20, 100)
      case 'night': return new THREE.Vector3(100, -100, 100)
    }
  }, [timeOfDay])

  useFrame(() => {
    if (lightRef.current && trainPosition) {
      lightRef.current.position.copy(trainPosition.clone().add(sunPos))
      lightRef.current.target.position.copy(trainPosition)
      lightRef.current.target.updateMatrixWorld()
    }
  })

  useEffect(() => {
    if (onTerrainGenerated) {
      onTerrainGenerated(getHeight)
    }
  }, [onTerrainGenerated, getHeight])

  const getTerrainMaterial = () => {
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.1,
    })

    if (terrainRef.current && terrainRef.current.geometry) {
      const colors = []
      const positions = terrainRef.current.geometry.getAttribute('position')
      
      for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i)
        const color = new THREE.Color()
        
        if (y < 0) {
          color.setStyle('#1e3d59') // Eau profonde
        } else if (y < 2) {
          color.setStyle('#2d5a27') // Herbe
        } else if (y < 8) {
          color.setStyle('#4b5320') // Forêt
        } else if (y < 12) {
          color.setStyle('#8b4513') // Montagne
        } else {
          color.setStyle('#f5f5f5') // Neige
        }
        
        colors.push(color.r, color.g, color.b)
      }
      
      terrainRef.current.geometry.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(colors, 3)
      )
    }
    
    return material
  }

  return (
    <>
      <Sky distance={450000} sunPosition={sunPos} rayleigh={weather === 'rainy' ? 5 : 2} />
      
      <ambientLight intensity={timeOfDay === 'night' ? 0.1 : 0.3} />
      
      <directionalLight
        ref={lightRef}
        position={sunPos}
        intensity={weather === 'cloudy' ? 0.5 : 1}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-camera-near={0.1}
        shadow-camera-far={500}
      />

      <mesh ref={terrainRef} receiveShadow>
        <meshStandardMaterial {...getTerrainMaterial()} />
      </mesh>

      {treesRef.current.map((position, index) => (
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