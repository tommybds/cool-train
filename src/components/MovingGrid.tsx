import * as THREE from 'three'
import { useMemo, useEffect } from 'react'
import { MovingGridProps } from '../types'
import { createNoise2D } from 'simplex-noise'

export function MovingGrid({ position, size = 200, divisions = 120, points }: MovingGridProps) {
  const noise2D = useMemo(() => createNoise2D(), [])
  
  const gridPosition = new THREE.Vector3(
    Math.round(position.x / size) * size,
    0,
    Math.round(position.z / size) * size
  )

  const getTerrainHeight = (x: number, z: number): number => {
    const worldX = x + gridPosition.x
    const worldZ = z + gridPosition.z
    
    const scale1 = 0.003
    const scale2 = 0.006
    const scale3 = 0.012
    
    const noise1 = noise2D(worldX * scale1, worldZ * scale1) * 6
    const noise2 = noise2D(worldX * scale2, worldZ * scale2) * 3
    const noise3 = noise2D(worldX * scale3, worldZ * scale3) * 1.5

    let height = noise1 + noise2 + noise3

    if (points && points.length > 0) {
      let minDist = Infinity
      let pathHeight = Math.max(height, 0)

      for (const point of points) {
        const dx = worldX - point.x
        const dz = worldZ - point.z
        const dist = Math.sqrt(dx * dx + dz * dz)

        if (dist < minDist) {
          minDist = dist
          pathHeight = Math.max(point.y, 0)
        }
      }

      const pathWidth = 40
      const influence = Math.max(0, 1 - (minDist / pathWidth) ** 2)
      height = THREE.MathUtils.lerp(height, pathHeight, influence)
    }

    return Math.max(height, 0)
  }

  // Création de la grille
  const customGrid = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const vertices: number[] = []
    const cellSize = size * 3 / divisions
    const halfSize = size * 1.5

    // Création des faces de la grille
    for (let i = 0; i < divisions; i++) {
      for (let j = 0; j < divisions; j++) {
        const x = -halfSize + i * cellSize
        const z = -halfSize + j * cellSize
        const x2 = x + cellSize
        const z2 = z + cellSize

        const y1 = getTerrainHeight(x, z)
        const y2 = getTerrainHeight(x2, z)
        const y3 = getTerrainHeight(x, z2)
        const y4 = getTerrainHeight(x2, z2)

        // Premier triangle (sens anti-horaire)
        vertices.push(x, y1, z)
        vertices.push(x, y3, z2)
        vertices.push(x2, y2, z)

        // Second triangle (sens anti-horaire)
        vertices.push(x2, y2, z)
        vertices.push(x, y3, z2)
        vertices.push(x2, y4, z2)
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.computeVertexNormals()
    return geometry
  }, [size, divisions, points, gridPosition, noise2D])

  // Nettoyage des ressources
  useEffect(() => {
    return () => {
      customGrid.dispose()
    }
  }, [customGrid])

  return (
    <group position={gridPosition}>
      {/* Plan d'eau */}
      <mesh 
        position={[0, -0.05, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[size * 3.2, size * 3.2]} />
        <meshPhysicalMaterial 
          color="#0077be"
          transparent
          opacity={0.8}
          roughness={0}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.1}
          envMapIntensity={1}
        />
      </mesh>

      {/* Terrain */}
      <mesh geometry={customGrid}>
        <meshStandardMaterial 
          color="#2d5e1e" 
          side={THREE.FrontSide}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Lignes de la grille */}
      <mesh geometry={customGrid}>
        <meshBasicMaterial 
          color="#666" 
          wireframe={true} 
          opacity={0.15}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  )
} 