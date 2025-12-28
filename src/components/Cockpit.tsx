import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'

interface CockpitProps {
  speed: number
  maxSpeed: number
  pressure: number
  maxPressure: number
  isBraking: boolean
  distanceTraveled: number
  fuelLevel: number
  maxFuel: number
  isActive: boolean
  trainRotation?: THREE.Euler // Rotation du train pour aligner le cockpit
}

export const Cockpit: React.FC<CockpitProps> = ({
  speed,
  maxSpeed,
  pressure,
  maxPressure,
  isBraking,
  distanceTraveled,
  fuelLevel,
  maxFuel,
  isActive,
  trainRotation = new THREE.Euler(0, 0, 0)
}) => {
  const { camera } = useThree()
  const cockpitRef = useRef<THREE.Group>(null)
  const speedometerRef = useRef<THREE.Mesh>(null)
  const pressureGaugeRef = useRef<THREE.Mesh>(null)
  const fuelGaugeRef = useRef<THREE.Mesh>(null)
  const brakeLightRef = useRef<THREE.Mesh>(null)
  
  // Textures pour les instruments
  const textures = useMemo(() => {
    const createGaugeTexture = (label: string, min: number, max: number, divisions: number = 10) => {
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 256
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      
      // Fond
      ctx.fillStyle = '#333'
      ctx.beginPath()
      ctx.arc(128, 128, 120, 0, Math.PI * 2)
      ctx.fill()
      
      // Bordure
      ctx.strokeStyle = '#888'
      ctx.lineWidth = 8
      ctx.beginPath()
      ctx.arc(128, 128, 116, 0, Math.PI * 2)
      ctx.stroke()
      
      // Graduations
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      const totalAngle = 270 * (Math.PI / 180) // 270 degrés en radians
      const startAngle = -225 * (Math.PI / 180) // -225 degrés en radians
      
      for (let i = 0; i <= divisions; i++) {
        const ratio = i / divisions
        const angle = startAngle + ratio * totalAngle
        const innerRadius = i % 5 === 0 ? 90 : 100
        
        ctx.beginPath()
        ctx.moveTo(
          128 + innerRadius * Math.cos(angle),
          128 + innerRadius * Math.sin(angle)
        )
        ctx.lineTo(
          128 + 110 * Math.cos(angle),
          128 + 110 * Math.sin(angle)
        )
        ctx.stroke()
        
        if (i % 5 === 0) {
          ctx.fillStyle = '#fff'
          ctx.font = '18px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          const value = min + ratio * (max - min)
          const textRadius = 75
          ctx.fillText(
            value.toFixed(0),
            128 + textRadius * Math.cos(angle),
            128 + textRadius * Math.sin(angle)
          )
        }
      }
      
      // Étiquette
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 20px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, 128, 180)
      
      return new THREE.CanvasTexture(canvas)
    }
    
    return {
      speedometer: createGaugeTexture('Speed', 0, maxSpeed * 100, 20),
      pressure: createGaugeTexture('Pressure', 0, maxPressure, 10),
      fuel: createGaugeTexture('Fuel %', 0, 100, 10)
    }
  }, [maxSpeed, maxPressure])
  
  // Création de l'aiguille
  const createNeedle = () => {
    const needle = new THREE.Shape()
    needle.moveTo(0, -5)
    needle.lineTo(0.5, 0)
    needle.lineTo(0, 50)
    needle.lineTo(-0.5, 0)
    needle.lineTo(0, -5)
    
    const extrudeSettings = {
      steps: 1,
      depth: 1,
      bevelEnabled: false
    }
    
    return new THREE.ExtrudeGeometry(needle, extrudeSettings)
  }
  
  // Mise à jour de la caméra si la vue cockpit est active
  useEffect(() => {
    if (isActive && camera) {
      // Positionner la caméra pour voir correctement le tableau de bord et la voie
      camera.position.set(0, 0.5, 0.2)
      camera.lookAt(0, 0.1, -5)
      camera.updateProjectionMatrix()
    }
  }, [isActive, camera, trainRotation])
  
  // Animation des instruments
  useFrame(() => {
    if (!cockpitRef.current) return
    
    // Mettre à jour la rotation de l'aiguille du compteur de vitesse avec une animation plus fluide
    if (speedometerRef.current) {
      const speedRatio = Math.min(speed / maxSpeed, 1)
      const targetRotation = -Math.PI * 0.75 + speedRatio * Math.PI * 1.5
      speedometerRef.current.rotation.z = THREE.MathUtils.lerp(
        speedometerRef.current.rotation.z,
        targetRotation,
        0.15
      )
    }
    
    // Mettre à jour la rotation de l'aiguille du manomètre
    if (pressureGaugeRef.current) {
      const pressureRatio = Math.min(pressure / maxPressure, 1)
      const targetRotation = -Math.PI * 0.75 + pressureRatio * Math.PI * 1.5
      pressureGaugeRef.current.rotation.z = THREE.MathUtils.lerp(
        pressureGaugeRef.current.rotation.z,
        targetRotation,
        0.15
      )
    }
    
    // Mettre à jour la rotation de l'aiguille de la jauge de carburant
    if (fuelGaugeRef.current) {
      const fuelRatio = Math.min(fuelLevel / maxFuel, 1)
      const targetRotation = -Math.PI * 0.75 + fuelRatio * Math.PI * 1.5
      fuelGaugeRef.current.rotation.z = THREE.MathUtils.lerp(
        fuelGaugeRef.current.rotation.z,
        targetRotation,
        0.15
      )
    }
    
    // Mettre à jour la lumière de freinage
    if (brakeLightRef.current) {
      const material = brakeLightRef.current.material as THREE.MeshBasicMaterial
      if (isBraking) {
        material.color.set(0xff0000)
      } else {
        material.color.set(0x330000)
      }
    }
  })
  
  if (!isActive) return null
  
  return (
    <group ref={cockpitRef} position={[0, 0, 0]} rotation={trainRotation}>
      {/* Tableau de bord - abaissé et incliné pour une meilleure visibilité */}
      <mesh position={[0, -0.15, -0.3]} rotation={[Math.PI / 12, 0, 0]} receiveShadow>
        <boxGeometry args={[1.2, 0.4, 0.05]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Compteur de vitesse */}
      <group position={[-0.35, -0.15, -0.25]} rotation={[Math.PI / 12, 0, 0]}>
        <mesh>
          <circleGeometry args={[0.15, 32]} />
          <meshBasicMaterial map={textures.speedometer} />
        </mesh>
        <mesh ref={speedometerRef} position={[0, 0, 0.01]}>
          <primitive object={createNeedle()} />
          <meshBasicMaterial color="red" />
        </mesh>
        <Text 
          position={[0, -0.2, 0.01]}
          fontSize={0.02}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {(speed * 100).toFixed(0)} km/h
        </Text>
      </group>
      
      {/* Manomètre de pression */}
      <group position={[0, -0.15, -0.25]} rotation={[Math.PI / 12, 0, 0]}>
        <mesh>
          <circleGeometry args={[0.15, 32]} />
          <meshBasicMaterial map={textures.pressure} />
        </mesh>
        <mesh ref={pressureGaugeRef} position={[0, 0, 0.01]}>
          <primitive object={createNeedle()} />
          <meshBasicMaterial color="red" />
        </mesh>
        <Text 
          position={[0, -0.2, 0.01]}
          fontSize={0.02}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {pressure.toFixed(1)} bar
        </Text>
      </group>
      
      {/* Jauge de carburant */}
      <group position={[0.35, -0.15, -0.25]} rotation={[Math.PI / 12, 0, 0]}>
        <mesh>
          <circleGeometry args={[0.15, 32]} />
          <meshBasicMaterial map={textures.fuel} />
        </mesh>
        <mesh ref={fuelGaugeRef} position={[0, 0, 0.01]}>
          <primitive object={createNeedle()} />
          <meshBasicMaterial color="red" />
        </mesh>
        <Text 
          position={[0, -0.2, 0.01]}
          fontSize={0.02}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {Math.round(fuelLevel)}%
        </Text>
      </group>
      
      {/* Odomètre */}
      <group position={[0, -0.35, -0.25]} rotation={[Math.PI / 12, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.4, 0.05, 0.01]} />
          <meshStandardMaterial color="#222222" />
        </mesh>
        <Text 
          position={[0, 0, 0.01]}
          fontSize={0.03}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {distanceTraveled.toFixed(1)} m
        </Text>
        <Text 
          position={[0, -0.04, 0.01]}
          fontSize={0.015}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          Distance
        </Text>
      </group>
      
      {/* Voyant de freinage */}
      <group position={[-0.45, -0.35, -0.25]} rotation={[Math.PI / 12, 0, 0]}>
        <mesh ref={brakeLightRef}>
          <circleGeometry args={[0.03, 16]} />
          <meshBasicMaterial color={isBraking ? 0xff0000 : 0x330000} />
        </mesh>
        <Text 
          position={[0, -0.04, 0.01]}
          fontSize={0.015}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          Brake
        </Text>
      </group>
      
      {/* Fenêtre avant - plus grande et plus haute pour une meilleure visibilité */}
      <mesh position={[0, 0.4, -0.5]} receiveShadow>
        <boxGeometry args={[1.5, 0.8, 0.02]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.3} />
      </mesh>
      
      {/* Panneaux latéraux - plus écartés pour une meilleure visibilité */}
      <mesh position={[-0.8, 0.2, -0.5]} receiveShadow>
        <boxGeometry args={[0.05, 0.8, 0.1]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      <mesh position={[0.8, 0.2, -0.5]} receiveShadow>
        <boxGeometry args={[0.05, 0.8, 0.1]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Toit de la cabine */}
      <mesh position={[0, 0.8, -0.5]} receiveShadow>
        <boxGeometry args={[1.6, 0.05, 0.6]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      
      {/* Volant/Manette de contrôle - repositionné pour être plus accessible */}
      <group position={[0.4, -0.2, -0.1]} rotation={[Math.PI / 4, 0, 0]}>
        <mesh castShadow>
          <torusGeometry args={[0.1, 0.01, 16, 32]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.01, 0.01, 0.2, 16]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.01, 0.01, 0.2, 16]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
      </group>
      
      {/* Levier de frein */}
      <group position={[-0.4, -0.2, -0.1]} rotation={[Math.PI / 6, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.03, 0.2, 0.03]} />
          <meshStandardMaterial color="#661111" />
        </mesh>
        <mesh position={[0, 0.12, 0]} castShadow>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshStandardMaterial color="#880000" />
        </mesh>
        <Text 
          position={[0, -0.1, 0.03]}
          fontSize={0.02}
          color="white"
          anchorX="center"
          anchorY="middle"
          rotation={[-Math.PI / 6, 0, 0]}
        >
          Brake
        </Text>
      </group>
      
      {/* Plancher de la cabine */}
      <mesh position={[0, -0.4, -0.5]} receiveShadow>
        <boxGeometry args={[1.6, 0.05, 1.0]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
    </group>
  )
} 