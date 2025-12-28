import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface AnimatedLocomotiveProps {
  speed: number
}

export const AnimatedLocomotive: React.FC<AnimatedLocomotiveProps> = ({ speed }) => {
  const wheelRef = useRef<THREE.Group>(null)
  const pistonRef = useRef<THREE.Mesh>(null)
  const smokeRef = useRef<THREE.Group>(null)
  
  useFrame((_, delta) => {
    if (wheelRef.current) {
      // Rotation des roues proportionnelle à la vitesse
      wheelRef.current.rotation.z -= delta * speed * 5
    }
    
    if (pistonRef.current) {
      // Animation du piston
      pistonRef.current.position.x = Math.sin(wheelRef.current?.rotation.z || 0) * 0.15
    }
    
    if (smokeRef.current && speed > 0.1) {
      // Émission de fumée proportionnelle à la vitesse
      if (Math.random() < speed * 0.2) {
        const smoke = new THREE.Mesh(
          new THREE.SphereGeometry(0.1 + Math.random() * 0.1),
          new THREE.MeshBasicMaterial({ 
            color: 0xcccccc, 
            transparent: true, 
            opacity: 0.4 + Math.random() * 0.2 
          })
        )
        smoke.position.set(0, 0, 0)
        smokeRef.current.add(smoke)
        
        // Animation de la fumée
        const direction = new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          1,
          (Math.random() - 0.5) * 0.2
        )
        
        const animate = () => {
          if (!smoke.parent) return
          
          smoke.position.add(direction.clone().multiplyScalar(0.05))
          smoke.scale.multiplyScalar(1.02)
          
          const material = smoke.material as THREE.MeshBasicMaterial
          material.opacity *= 0.97
          
          if (material.opacity < 0.01) {
            smoke.removeFromParent()
          } else {
            requestAnimationFrame(animate)
          }
        }
        
        animate()
      }
    }
  })
  
  return (
    <group scale={[1.39, 1.75, 2.0]}>
      {/* Corps de la locomotive */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[1.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#FFD700" metalness={0.7} roughness={0.2} />
      </mesh>
      
      {/* Cheminée */}
      <mesh position={[0.7, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 0.6, 8]} />
        <meshStandardMaterial color="#333333" metalness={0.6} roughness={0.3} />
      </mesh>
      
      {/* Point d'émission de fumée */}
      <group ref={smokeRef} position={[0.7, 1.5, 0]} />
      
      {/* Cabine */}
      <mesh position={[-0.6, 1, 0]} castShadow>
        <boxGeometry args={[0.6, 0.8, 0.7]} />
        <meshStandardMaterial color="#FFD700" metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* Fenêtres de la cabine */}
      <mesh position={[-0.6, 1, 0.36]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.02]} />
        <meshStandardMaterial color="#aaccff" metalness={0.3} roughness={0.2} transparent opacity={0.7} />
      </mesh>
      <mesh position={[-0.6, 1, -0.36]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.02]} />
        <meshStandardMaterial color="#aaccff" metalness={0.3} roughness={0.2} transparent opacity={0.7} />
      </mesh>
      
      {/* Roues motrices (plus grandes) avec animation */}
      <group ref={wheelRef}>
        {[-0.6, 0, 0.6].map((x, i) => (
          <mesh 
            key={`wheel-${i}`}
            position={[x, 0.25, 0]} 
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          >
            <cylinderGeometry args={[0.25, 0.25, 0.1, 16]} />
            <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.2} />
            
            {/* Rayons des roues */}
            {Array.from({ length: 8 }).map((_, j) => (
              <mesh 
                key={`spoke-${i}-${j}`}
                position={[0, 0, 0]}
                rotation={[0, 0, j * Math.PI / 4]}
              >
                <boxGeometry args={[0.05, 0.48, 0.02]} />
                <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
              </mesh>
            ))}
          </mesh>
        ))}
      </group>
      
      {/* Piston animé */}
      <mesh ref={pistonRef} position={[0, 0.25, 0.45]} castShadow>
        <boxGeometry args={[0.4, 0.08, 0.08]} />
        <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Détails décoratifs */}
      <mesh position={[0.3, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.2, 8]} />
        <meshStandardMaterial color="#aa8833" metalness={0.9} roughness={0.1} />
      </mesh>
      
      <mesh position={[0.2, 1.05, 0]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.2} />
      </mesh>
      
      <mesh position={[0.95, 0.4, 0]} castShadow>
        <boxGeometry args={[0.1, 0.1, 0.7]} />
        <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  )
} 