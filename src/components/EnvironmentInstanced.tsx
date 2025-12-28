import React, { useMemo, useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { Instances, Instance, Detailed, useLOD } from '@react-three/drei'
import { createNoise2D } from 'simplex-noise'
import { useTrainStore } from '../stores/trainStore'

interface EnvironmentInstancedProps {
  pathPoints: THREE.Vector3[]
  terrainSize?: number
  density?: {
    trees: number
    grass: number
    rocks: number
  }
}

function TreeModel() {
  return (
    <group>
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.4, 4, 8]} />
        <meshStandardMaterial color="#5D4037" roughness={0.8} />
      </mesh>
      <mesh position={[0, 4.5, 0]} castShadow>
        <coneGeometry args={[2, 5, 8]} />
        <meshStandardMaterial color="#2E7D32" roughness={0.7} />
      </mesh>
    </group>
  )
}

function RockModel() {
  return (
    <mesh castShadow receiveShadow>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#757575" roughness={0.9} />
    </mesh>
  )
}

function GrassModel() {
  return (
    <group>
      <mesh position={[0, 0.4, 0]} rotation={[0, 0, 0.3]} castShadow>
        <boxGeometry args={[0.05, 0.8, 0.05]} />
        <meshStandardMaterial color="#7CB342" roughness={0.7} />
      </mesh>
      <mesh position={[0.1, 0.3, 0]} rotation={[0, 0, -0.2]} castShadow>
        <boxGeometry args={[0.05, 0.6, 0.05]} />
        <meshStandardMaterial color="#8BC34A" roughness={0.7} />
      </mesh>
      <mesh position={[-0.1, 0.35, 0]} rotation={[0, 0, 0.1]} castShadow>
        <boxGeometry args={[0.05, 0.7, 0.05]} />
        <meshStandardMaterial color="#9CCC65" roughness={0.7} />
      </mesh>
    </group>
  )
}

function isNearPath(point: THREE.Vector3, pathPoints: THREE.Vector3[], threshold: number): boolean {
  for (const pathPoint of pathPoints) {
    const dx = point.x - pathPoint.x
    const dz = point.z - pathPoint.z
    const distanceSquared = dx * dx + dz * dz
    if (distanceSquared < threshold * threshold) {
      return true
    }
  }
  return false
}

export function EnvironmentInstanced({ 
  pathPoints, 
  terrainSize = 500,
  density = { trees: 0.6, grass: 0.7, rocks: 0.4 }
}: EnvironmentInstancedProps) {
  const trainPosition = useTrainStore((state) => state.position)
  const [visibleChunks, setVisibleChunks] = useState<string[]>([])
  const chunkSize = 50
  const viewDistance = 200
  const generatedChunks = useRef<Set<string>>(new Set())
  const noise2D = useMemo(() => createNoise2D(), [])
  
  const getChunkId = (x: number, z: number) => `${Math.floor(x/chunkSize)}_${Math.floor(z/chunkSize)}`
  
  useEffect(() => {
    const currentChunkX = Math.floor(trainPosition.x / chunkSize)
    const currentChunkZ = Math.floor(trainPosition.z / chunkSize)
    const visibleDistance = Math.ceil(viewDistance / chunkSize)
    
    const newVisibleChunks: string[] = []
    
    for (let x = currentChunkX - visibleDistance; x <= currentChunkX + visibleDistance; x++) {
      for (let z = currentChunkZ - visibleDistance; z <= currentChunkZ + visibleDistance; z++) {
        const chunkId = `${x}_${z}`
        const chunkCenterX = (x + 0.5) * chunkSize
        const chunkCenterZ = (z + 0.5) * chunkSize
        
        const dx = chunkCenterX - trainPosition.x
        const dz = chunkCenterZ - trainPosition.z
        const distanceSquared = dx * dx + dz * dz
        
        if (distanceSquared <= viewDistance * viewDistance) {
          newVisibleChunks.push(chunkId)
        }
      }
    }
    
    setVisibleChunks(newVisibleChunks)
  }, [trainPosition, chunkSize, viewDistance])
  
  const getTerrainHeight = (x: number, z: number) => {
    const scale1 = 0.01
    const scale2 = 0.05
    const scale3 = 0.002
    
    const noise1 = noise2D(x * scale1, z * scale1) * 10
    const noise2 = noise2D(x * scale2, z * scale2) * 2
    const noise3 = noise2D(x * scale3, z * scale3) * 20
    
    return noise1 + noise2 + noise3
  }
  
  const generateChunkData = (chunkId: string) => {
    if (generatedChunks.current.has(chunkId)) return null
    
    const [chunkX, chunkZ] = chunkId.split('_').map(Number)
    const chunkOriginX = chunkX * chunkSize
    const chunkOriginZ = chunkZ * chunkSize
    
    const treeData: THREE.Vector3[] = []
    const rockData: THREE.Vector3[] = []
    const grassData: THREE.Vector3[] = []
    
    const treeCount = Math.floor(20 * density.trees)
    const rockCount = Math.floor(30 * density.rocks)
    const grassCount = Math.floor(100 * density.grass)
    
    for (let i = 0; i < treeCount; i++) {
      const noiseX = noise2D(chunkX + i * 0.1, chunkZ + i * 0.1)
      const noiseZ = noise2D(chunkX + i * 0.1 + 100, chunkZ + i * 0.1 + 100)
      
      const x = chunkOriginX + (0.1 + 0.8 * (noiseX * 0.5 + 0.5)) * chunkSize
      const z = chunkOriginZ + (0.1 + 0.8 * (noiseZ * 0.5 + 0.5)) * chunkSize
      const y = getTerrainHeight(x, z)
      
      const position = new THREE.Vector3(x, y, z)
      
      if (!isNearPath(position, pathPoints, 10)) {
        treeData.push(position)
      }
    }
    
    for (let i = 0; i < rockCount; i++) {
      const noiseX = noise2D(chunkX + i * 0.2, chunkZ + i * 0.2 + 200)
      const noiseZ = noise2D(chunkX + i * 0.2 + 300, chunkZ + i * 0.2 + 400)
      
      const x = chunkOriginX + (0.1 + 0.8 * (noiseX * 0.5 + 0.5)) * chunkSize
      const z = chunkOriginZ + (0.1 + 0.8 * (noiseZ * 0.5 + 0.5)) * chunkSize
      const y = getTerrainHeight(x, z)
      
      const position = new THREE.Vector3(x, y - 0.2, z)
      
      if (!isNearPath(position, pathPoints, 5)) {
        rockData.push(position)
      }
    }
    
    for (let i = 0; i < grassCount; i++) {
      const x = chunkOriginX + Math.random() * chunkSize
      const z = chunkOriginZ + Math.random() * chunkSize
      const y = getTerrainHeight(x, z)
      
      const position = new THREE.Vector3(x, y, z)
      
      if (!isNearPath(position, pathPoints, 3)) {
        grassData.push(position)
      }
    }
    
    generatedChunks.current.add(chunkId)
    
    return { treeData, rockData, grassData }
  }
  
  // Géométries pour instancing
  const treeTrunkGeometry = useMemo(() => new THREE.CylinderGeometry(0.2, 0.4, 4, 8), [])
  const treeCrownGeometry = useMemo(() => new THREE.ConeGeometry(2, 5, 8), [])
  const rockGeometry = useMemo(() => new THREE.IcosahedronGeometry(1, 0), [])
  
  // Collecter toutes les positions
  const allTreePositions = useMemo(() => {
    const positions: THREE.Vector3[] = []
    visibleChunks.forEach(chunkId => {
      const data = generateChunkData(chunkId)
      if (data) {
        positions.push(...data.treeData)
      }
    })
    return positions
  }, [visibleChunks])
  
  const allRockPositions = useMemo(() => {
    const positions: THREE.Vector3[] = []
    visibleChunks.forEach(chunkId => {
      const data = generateChunkData(chunkId)
      if (data) {
        positions.push(...data.rockData)
      }
    })
    return positions
  }, [visibleChunks])
  
  return (
    <group>
      {/* Arbres avec instancing */}
      {allTreePositions.length > 0 && (
        <>
          <Instances limit={allTreePositions.length} range={allTreePositions.length}>
            <cylinderGeometry args={[0.2, 0.4, 4, 8]} />
            <meshStandardMaterial color="#5D4037" roughness={0.8} />
            {allTreePositions.map((pos, i) => (
              <Instance key={`trunk-${i}`} position={[pos.x, pos.y + 2, pos.z]} />
            ))}
          </Instances>
          <Instances limit={allTreePositions.length} range={allTreePositions.length}>
            <coneGeometry args={[2, 5, 8]} />
            <meshStandardMaterial color="#2E7D32" roughness={0.7} />
            {allTreePositions.map((pos, i) => (
              <Instance key={`crown-${i}`} position={[pos.x, pos.y + 4.5, pos.z]} />
            ))}
          </Instances>
        </>
      )}
      
      {/* Rochers avec instancing */}
      {allRockPositions.length > 0 && (
        <Instances limit={allRockPositions.length} range={allRockPositions.length}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#757575" roughness={0.9} />
          {allRockPositions.map((pos, i) => (
            <Instance key={`rock-${i}`} position={[pos.x, pos.y, pos.z]} />
          ))}
        </Instances>
      )}
    </group>
  )
}

