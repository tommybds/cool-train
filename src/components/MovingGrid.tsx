import * as THREE from 'three'
import { useMemo } from 'react'
import { MovingGridProps } from '../types'
import { createNoise2D } from 'simplex-noise'

export function MovingGrid({ position, size = 200, divisions = 50, points }: MovingGridProps) {
  const noise2D = useMemo(() => createNoise2D(), [])
  
  const gridPosition = new THREE.Vector3(
    Math.round(position.x / size) * size,
    0,
    Math.round(position.z / size) * size
  )

  // Création de la grille déformée
  const customGrid = useMemo(() => {
    const lines: THREE.Vector3[] = []
    const cellSize = size * 3 / divisions
    const halfSize = size * 1.5

    // Fonction pour obtenir la hauteur du terrain
    const getTerrainHeight = (x: number, z: number): number => {
      const worldX = x + gridPosition.x
      const worldZ = z + gridPosition.z
      
      // Base terrain avec bruit
      const scale1 = 0.01
      const scale2 = 0.02
      const scale3 = 0.04
      
      const noise1 = noise2D(worldX * scale1, worldZ * scale1) * 20
      const noise2 = noise2D(worldX * scale2, worldZ * scale2) * 10
      const noise3 = noise2D(worldX * scale3, worldZ * scale3) * 5

      let height = noise1 + noise2 + noise3

      // Influence du chemin
      if (points && points.length > 0) {
        let minDist = Infinity
        let pathHeight = height

        for (const point of points) {
          const dx = worldX - point.x
          const dz = worldZ - point.z
          const dist = Math.sqrt(dx * dx + dz * dz)

          if (dist < minDist) {
            minDist = dist
            pathHeight = point.y
          }
        }

        // Zone d'influence plus large pour le chemin
        const pathWidth = 30
        const influence = Math.max(0, 1 - minDist / pathWidth)
        height = THREE.MathUtils.lerp(height, pathHeight, influence)
      }

      return height
    }

    // Création des lignes de la grille
    for (let i = 0; i <= divisions; i++) {
      const x = -halfSize + i * cellSize
      // Lignes horizontales
      for (let j = 0; j < divisions; j++) {
        const z = -halfSize + j * cellSize
        const z2 = -halfSize + (j + 1) * cellSize
        const y1 = getTerrainHeight(x, z)
        const y2 = getTerrainHeight(x, z2)
        lines.push(new THREE.Vector3(x, y1, z))
        lines.push(new THREE.Vector3(x, y2, z2))
      }
    }

    for (let i = 0; i <= divisions; i++) {
      const z = -halfSize + i * cellSize
      // Lignes verticales
      for (let j = 0; j < divisions; j++) {
        const x = -halfSize + j * cellSize
        const x2 = -halfSize + (j + 1) * cellSize
        const y1 = getTerrainHeight(x, z)
        const y2 = getTerrainHeight(x2, z)
        lines.push(new THREE.Vector3(x, y1, z))
        lines.push(new THREE.Vector3(x2, y2, z))
      }
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(lines)
    return geometry
  }, [size, divisions, points, gridPosition, noise2D])

  // Création du terrain
  const terrain = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(size * 3, size * 3, divisions, divisions)
    const vertices = geometry.attributes.position.array as Float32Array

    // Application du même relief que la grille
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i]
      const z = vertices[i + 2]
      vertices[i + 1] = customGrid.attributes.position.array[i + 1]
    }

    geometry.computeVertexNormals()
    return geometry
  }, [size, divisions, customGrid])

  return (
    <group position={gridPosition}>
      {/* Terrain */}
      <mesh 
        geometry={terrain} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial 
          color="#444"
          wireframe={true}
          side={THREE.DoubleSide}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Grille déformée */}
      <lineSegments geometry={customGrid}>
        <lineBasicMaterial color="#666" linewidth={1} />
      </lineSegments>
    </group>
  )
} 