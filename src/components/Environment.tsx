import React, { useMemo, useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { EnvironmentProps } from '../types'
import { createNoise2D } from 'simplex-noise'

// Types d'éléments d'infrastructure
export enum InfrastructureType {
  NONE = 'none',
  TUNNEL = 'tunnel',
  BRIDGE = 'bridge',
  STATION = 'station'
}

interface EnvironmentProps {
  pathPoints: THREE.Vector3[]
  trainPosition: THREE.Vector3
  terrainSize: number
  density: {
    trees: number // 0-1
    grass: number // 0-1
    rocks: number // 0-1
    infrastructure: number // 0-1
  }
  infrastructureType?: InfrastructureType
}

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

// Fonction utilitaire pour vérifier si un point est proche du chemin
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

export function Environment({ 
  pathPoints, 
  trainPosition, 
  terrainSize = 500,
  density = { trees: 0.5, grass: 0.5, rocks: 0.3, infrastructure: 0.5 },
  infrastructureType = InfrastructureType.NONE
}: EnvironmentProps) {
  const environmentRef = useRef<THREE.Group>(null)
  const treeGroupRef = useRef<THREE.Group>(null)
  const rockGroupRef = useRef<THREE.Group>(null)
  const grassGroupRef = useRef<THREE.Group>(null)
  const infraGroupRef = useRef<THREE.Group>(null)
  
  // Générer des positions sur une grille pour réduire le calcul
  const [visibleChunks, setVisibleChunks] = useState<string[]>([])
  const chunkSize = 50
  const viewDistance = 200
  
  // Zones générées pour éviter la régénération
  const generatedChunks = useRef<Set<string>>(new Set())
  
  // Générateur de bruit pour les positions aléatoires mais cohérentes
  const noise2D = useMemo(() => createNoise2D(), [])
  
  // Fonction pour générer un ID de chunk basé sur les coordonnées
  const getChunkId = (x: number, z: number) => `${Math.floor(x/chunkSize)}_${Math.floor(z/chunkSize)}`
  
  // Mettre à jour les chunks visibles en fonction de la position du train
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
        
        // Vérifier si le chunk est dans la distance de vue
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
  
  // Générer des données pour un chunk
  const generateChunkData = (chunkId: string) => {
    if (generatedChunks.current.has(chunkId)) return null
    
    const [chunkX, chunkZ] = chunkId.split('_').map(Number)
    const chunkOriginX = chunkX * chunkSize
    const chunkOriginZ = chunkZ * chunkSize
    
    const treeData: { position: THREE.Vector3, scale: number, rotation: number }[] = []
    const rockData: { position: THREE.Vector3, scale: number, rotation: number }[] = []
    const grassData: { position: THREE.Vector3, scale: number, rotation: number }[] = []
    
    // Calculer le nombre d'éléments basé sur la densité
    const treeCount = Math.floor(20 * density.trees)
    const rockCount = Math.floor(30 * density.rocks)
    const grassCount = Math.floor(100 * density.grass)
    
    // Générer des arbres pour ce chunk
    for (let i = 0; i < treeCount; i++) {
      // Utiliser le bruit pour générer des positions plus naturelles
      const noiseX = noise2D(chunkX + i * 0.1, chunkZ + i * 0.1)
      const noiseZ = noise2D(chunkX + i * 0.1 + 100, chunkZ + i * 0.1 + 100)
      
      const x = chunkOriginX + (0.1 + 0.8 * (noiseX * 0.5 + 0.5)) * chunkSize
      const z = chunkOriginZ + (0.1 + 0.8 * (noiseZ * 0.5 + 0.5)) * chunkSize
      
      // Trouver la hauteur du terrain à cette position
      const y = getTerrainHeight(x, z)
      
      const position = new THREE.Vector3(x, y, z)
      
      // Ne pas placer d'arbres trop près du chemin
      if (!isNearPath(position, pathPoints, 10)) {
        const scale = 0.8 + Math.random() * 0.7
        const rotation = Math.random() * Math.PI * 2
        treeData.push({ position, scale, rotation })
      }
    }
    
    // Générer des rochers pour ce chunk
    for (let i = 0; i < rockCount; i++) {
      const noiseX = noise2D(chunkX + i * 0.2, chunkZ + i * 0.2 + 200)
      const noiseZ = noise2D(chunkX + i * 0.2 + 300, chunkZ + i * 0.2 + 400)
      
      const x = chunkOriginX + (0.1 + 0.8 * (noiseX * 0.5 + 0.5)) * chunkSize
      const z = chunkOriginZ + (0.1 + 0.8 * (noiseZ * 0.5 + 0.5)) * chunkSize
      
      const y = getTerrainHeight(x, z)
      
      const position = new THREE.Vector3(x, y - 0.2, z)
      
      // Les rochers peuvent être plus près du chemin
      if (!isNearPath(position, pathPoints, 5)) {
        const scale = 0.3 + Math.random() * 0.6
        const rotation = Math.random() * Math.PI * 2
        rockData.push({ position, scale, rotation })
      }
    }
    
    // Générer de l'herbe pour ce chunk
    for (let i = 0; i < grassCount; i++) {
      const x = chunkOriginX + Math.random() * chunkSize
      const z = chunkOriginZ + Math.random() * chunkSize
      
      const y = getTerrainHeight(x, z)
      
      const position = new THREE.Vector3(x, y, z)
      
      // L'herbe peut être encore plus près du chemin
      if (!isNearPath(position, pathPoints, 3)) {
        const scale = 0.7 + Math.random() * 0.6
        const rotation = Math.random() * Math.PI * 2
        grassData.push({ position, scale, rotation })
      }
    }
    
    generatedChunks.current.add(chunkId)
    
    return { treeData, rockData, grassData }
  }
  
  // Fonction pour obtenir la hauteur du terrain à une position donnée
  // Cette fonction devrait être cohérente avec celle utilisée pour générer le terrain
  const getTerrainHeight = (x: number, z: number) => {
    // Utiliser simplex noise pour générer une hauteur cohérente
    const scale1 = 0.01
    const scale2 = 0.05
    const scale3 = 0.002
    
    const noise1 = noise2D(x * scale1, z * scale1) * 10
    const noise2 = noise2D(x * scale2, z * scale2) * 2
    const noise3 = noise2D(x * scale3, z * scale3) * 20
    
    return noise1 + noise2 + noise3
  }
  
  // Gérer les ponts, tunnels et gares
  const infrastructureElements = useMemo(() => {
    if (infrastructureType === InfrastructureType.NONE || density.infrastructure <= 0) {
      return []
    }
    
    const elements: { type: InfrastructureType, position: THREE.Vector3, rotation: THREE.Euler }[] = []
    
    // Trouver les segments de chemin appropriés pour les infrastructures
    if (pathPoints.length > 10) {
      // Parcourir les points de chemin pour identifier des emplacements appropriés
      for (let i = 5; i < pathPoints.length - 5; i += 20) {
        const position = pathPoints[i].clone()
        
        // Calculer la direction à ce point (moyenne des segments adjacents)
        const prevPoint = pathPoints[i - 1]
        const nextPoint = pathPoints[i + 1]
        
        const dirVector = new THREE.Vector3()
          .subVectors(nextPoint, prevPoint)
          .normalize()
        
        // Rotation basée sur la direction
        const rotation = new THREE.Euler(0, Math.atan2(dirVector.x, dirVector.z), 0)
        
        // Décider du type d'infrastructure en fonction du terrain
        const heightDiff = Math.abs(nextPoint.y - prevPoint.y)
        
        let type = infrastructureType
        
        // Si aucun type spécifique n'est demandé, choisir en fonction du terrain
        if (infrastructureType === InfrastructureType.NONE) {
          if (heightDiff > 3) {
            // Terrain en pente forte : pont ou tunnel
            if (position.y > 10) {
              type = InfrastructureType.BRIDGE
            } else {
              type = InfrastructureType.TUNNEL
            }
          } else if (i % 80 === 0) {
            // Placer des gares à intervalles réguliers sur terrain plat
            type = InfrastructureType.STATION
          }
        }
        
        // Ne pas placer trop d'éléments (contrôle par densité)
        if (Math.random() < density.infrastructure) {
          elements.push({ type, position, rotation })
        }
      }
    }
    
    return elements
  }, [pathPoints, infrastructureType, density.infrastructure])
  
  // Modèles 3D simplifiés (à remplacer par des imports de modèles plus détaillés)
  const TreeModel = () => (
    <group>
      {/* Tronc */}
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.4, 4, 8]} />
        <meshStandardMaterial color="#5D4037" roughness={0.8} />
      </mesh>
      {/* Feuillage */}
      <mesh position={[0, 4.5, 0]} castShadow>
        <coneGeometry args={[2, 5, 8]} />
        <meshStandardMaterial color="#2E7D32" roughness={0.7} />
      </mesh>
    </group>
  )
  
  const RockModel = () => (
    <mesh castShadow receiveShadow>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#757575" roughness={0.9} />
    </mesh>
  )
  
  const GrassModel = () => (
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
  
  // Rendu des infrastructures ferroviaires
  const renderInfrastructure = (type: InfrastructureType, position: THREE.Vector3, rotation: THREE.Euler) => {
    switch (type) {
      case InfrastructureType.TUNNEL:
        return (
          <group position={position} rotation={rotation} key={`tunnel-${position.x}-${position.z}`}>
            <mesh position={[0, 4, 0]} castShadow receiveShadow>
              <boxGeometry args={[5, 8, 20]} />
              <meshStandardMaterial color="#616161" roughness={0.7} />
            </mesh>
            <mesh position={[0, 8, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[5, 5, 20, 16, 1, true]} rotation={[Math.PI/2, 0, 0]} />
              <meshStandardMaterial color="#424242" roughness={0.8} side={THREE.BackSide} />
            </mesh>
          </group>
        )
      
      case InfrastructureType.BRIDGE:
        return (
          <group position={position} rotation={rotation} key={`bridge-${position.x}-${position.z}`}>
            {/* Pylônes */}
            <mesh position={[-3, -5, 0]} castShadow>
              <boxGeometry args={[1, 10, 1]} />
              <meshStandardMaterial color="#455A64" metalness={0.5} roughness={0.5} />
            </mesh>
            <mesh position={[3, -5, 0]} castShadow>
              <boxGeometry args={[1, 10, 1]} />
              <meshStandardMaterial color="#455A64" metalness={0.5} roughness={0.5} />
            </mesh>
            
            {/* Tablier */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[7, 0.5, 20]} />
              <meshStandardMaterial color="#546E7A" metalness={0.4} roughness={0.6} />
            </mesh>
            
            {/* Garde-corps */}
            <mesh position={[-3.25, 0.6, 0]} castShadow>
              <boxGeometry args={[0.2, 1.2, 20]} />
              <meshStandardMaterial color="#455A64" metalness={0.5} roughness={0.5} />
            </mesh>
            <mesh position={[3.25, 0.6, 0]} castShadow>
              <boxGeometry args={[0.2, 1.2, 20]} />
              <meshStandardMaterial color="#455A64" metalness={0.5} roughness={0.5} />
            </mesh>
          </group>
        )
      
      case InfrastructureType.STATION:
        return (
          <group position={position} rotation={rotation} key={`station-${position.x}-${position.z}`}>
            {/* Quai */}
            <mesh position={[0, 0.2, 0]} receiveShadow>
              <boxGeometry args={[6, 0.4, 15]} />
              <meshStandardMaterial color="#CFD8DC" roughness={0.7} />
            </mesh>
            
            {/* Bâtiment */}
            <mesh position={[-3, 2.5, 0]} castShadow>
              <boxGeometry args={[4, 5, 10]} />
              <meshStandardMaterial color="#E0E0E0" roughness={0.8} />
            </mesh>
            
            {/* Toit */}
            <mesh position={[-3, 5.5, 0]} castShadow>
              <boxGeometry args={[5, 1, 12]} />
              <meshStandardMaterial color="#B71C1C" roughness={0.6} />
            </mesh>
            
            {/* Auvent */}
            <mesh position={[1.5, 3, 0]} castShadow>
              <boxGeometry args={[3, 0.2, 15]} />
              <meshStandardMaterial color="#90A4AE" metalness={0.3} roughness={0.6} />
            </mesh>
            
            {/* Supports d'auvent */}
            {[-6, -3, 0, 3, 6].map((z, index) => (
              <mesh position={[1.5, 1.5, z]} castShadow key={index}>
                <cylinderGeometry args={[0.1, 0.1, 3, 8]} />
                <meshStandardMaterial color="#455A64" metalness={0.5} roughness={0.5} />
              </mesh>
            ))}
          </group>
        )
      
      default:
        return null
    }
  }
  
  return (
    <group ref={environmentRef}>
      {/* Arbres */}
      <group ref={treeGroupRef}>
        <TreeModel />
        {visibleChunks.map(chunkId => {
          const chunkData = generateChunkData(chunkId)
          if (!chunkData) return null
          
          return chunkData.treeData.map((tree, index) => (
            <group key={`tree-${chunkId}-${index}`} position={tree.position}>
              <Tree />
            </group>
          ))
        })}
      </group>
      
      {/* Rochers */}
      <group ref={rockGroupRef}>
        <RockModel />
        {visibleChunks.map(chunkId => {
          const chunkData = generateChunkData(chunkId)
          if (!chunkData) return null
          
          return chunkData.rockData.map((rock, index) => (
            <group key={`rock-${chunkId}-${index}`} position={rock.position}>
              <RockModel />
            </group>
          ))
        })}
      </group>
      
      {/* Herbe */}
      <group ref={grassGroupRef}>
        <GrassModel />
        {visibleChunks.map(chunkId => {
          const chunkData = generateChunkData(chunkId)
          if (!chunkData) return null
          
          return chunkData.grassData.map((grass, index) => (
            <group key={`grass-${chunkId}-${index}`} position={grass.position}>
              <GrassModel />
            </group>
          ))
        })}
      </group>
      
      {/* Infrastructures */}
      <group ref={infraGroupRef}>
        {infrastructureElements.map((element, index) => 
          renderInfrastructure(element.type, element.position, element.rotation)
        )}
      </group>
    </group>
  )
} 