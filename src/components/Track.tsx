import React from 'react'
import { useRef } from 'react'
import * as THREE from 'three'

export function Track() {
  const trackRef = useRef<THREE.Group>(null)

  // Fonction pour créer les traverses
  const createTies = () => {
    const ties = []
    const tieCount = 200 // Nombre de traverses
    const tieSpacing = 5 // Espacement entre les traverses
    
    for (let i = 0; i < tieCount; i++) {
      const z = i * tieSpacing - (tieCount * tieSpacing) / 2
      ties.push(
        <mesh 
          key={i} 
          castShadow 
          receiveShadow 
          position={[0, 0, z]}
        >
          <boxGeometry args={[2.4, 0.2, 0.4]} />
          <meshStandardMaterial color="#4d3319" />
        </mesh>
      )
    }
    return ties
  }

  // Fonction pour créer le ballast (les pierres sous les rails)
  const createBallast = () => {
    return (
      <mesh receiveShadow position={[0, -0.1, 0]}>
        <boxGeometry args={[3, 0.2, 1000]} />
        <meshStandardMaterial color="#808080" />
      </mesh>
    )
  }

  return (
    <group ref={trackRef}>
      {/* Sol */}
      <mesh receiveShadow rotation-x={-Math.PI / 2} position-y={-0.2}>
        <planeGeometry args={[50, 1000]} />
        <meshStandardMaterial color="#2e7d32" />
      </mesh>

      {/* Ballast */}
      {createBallast()}

      {/* Traverses */}
      {createTies()}

      {/* Rails */}
      <group position-y={0.2}>
        {/* Rail gauche */}
        <mesh position={[-1, 0, 0]}>
          <boxGeometry args={[0.2, 0.2, 1000]} />
          <meshStandardMaterial color="#424242" />
        </mesh>
        {/* Rail droit */}
        <mesh position={[1, 0, 0]}>
          <boxGeometry args={[0.2, 0.2, 1000]} />
          <meshStandardMaterial color="#424242" />
        </mesh>
      </group>
    </group>
  )
}