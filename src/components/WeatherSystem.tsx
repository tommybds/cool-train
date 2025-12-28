import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Clouds, Cloud, useTexture } from '@react-three/drei'

// Types de météo disponibles
export enum WeatherType {
  CLEAR = 'clear',
  CLOUDY = 'cloudy',
  RAINY = 'rainy',
  STORMY = 'stormy',
  SNOWY = 'snowy',
  FOGGY = 'foggy'
}

interface WeatherSystemProps {
  weatherType: WeatherType
  intensity: number // 0 à 1 pour l'intensité de l'effet
  position: THREE.Vector3 // Position du train pour suivre le joueur
  time: number // 0 à 1 pour cycle jour/nuit (0 = minuit, 0.5 = midi)
}

export function WeatherSystem({ weatherType, intensity, position, time }: WeatherSystemProps) {
  const { scene, camera } = useThree()
  const particleRef = useRef<THREE.Points>(null)
  const fogRef = useRef<THREE.Fog | null>(null)
  const cloudsRef = useRef<THREE.Group>(null)
  const lightningRef = useRef<THREE.PointLight>(null)
  const lastLightningTime = useRef(0)
  
  // Paramètres des particules
  const MAX_RAIN_PARTICLES = 5000
  const MAX_SNOW_PARTICLES = 3000
  
  // Intensité locale pour éviter les changements brusques
  const [localIntensity, setLocalIntensity] = useState(intensity)
  useEffect(() => {
    // Transition douce entre les intensités
    const interval = setInterval(() => {
      setLocalIntensity(prev => {
        if (Math.abs(prev - intensity) < 0.01) return intensity
        return prev + (intensity - prev) * 0.05
      })
    }, 100)
    return () => clearInterval(interval)
  }, [intensity])
  
  // Créer la texture des gouttes de pluie
  const rainTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const context = canvas.getContext('2d')!
    
    context.fillStyle = 'rgba(200, 200, 220, 0.8)'
    context.beginPath()
    context.ellipse(16, 16, 1, 8, 0, 0, Math.PI * 2)
    context.fill()
    
    const texture = new THREE.Texture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])
  
  // Créer la texture des flocons de neige
  const snowTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const context = canvas.getContext('2d')!
    
    context.fillStyle = 'white'
    context.beginPath()
    context.arc(16, 16, 4, 0, Math.PI * 2)
    context.fill()
    
    const texture = new THREE.Texture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])
  
  // Créer les systèmes de particules pour la pluie et la neige
  const { rainGeometry, rainMaterial, snowGeometry, snowMaterial } = useMemo(() => {
    // Géométrie pour la pluie
    const rainGeometry = new THREE.BufferGeometry()
    const rainPositions = new Float32Array(MAX_RAIN_PARTICLES * 3)
    for (let i = 0; i < MAX_RAIN_PARTICLES; i++) {
      const i3 = i * 3
      rainPositions[i3] = (Math.random() * 2 - 1) * 100
      rainPositions[i3 + 1] = Math.random() * 50 + 20
      rainPositions[i3 + 2] = (Math.random() * 2 - 1) * 100
    }
    rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3))
    
    // Matériau pour la pluie
    const rainMaterial = new THREE.PointsMaterial({
      size: 0.3,
      map: rainTexture,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
    
    // Géométrie pour la neige
    const snowGeometry = new THREE.BufferGeometry()
    const snowPositions = new Float32Array(MAX_SNOW_PARTICLES * 3)
    for (let i = 0; i < MAX_SNOW_PARTICLES; i++) {
      const i3 = i * 3
      snowPositions[i3] = (Math.random() * 2 - 1) * 80
      snowPositions[i3 + 1] = Math.random() * 40 + 10
      snowPositions[i3 + 2] = (Math.random() * 2 - 1) * 80
    }
    snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3))
    
    // Matériau pour la neige
    const snowMaterial = new THREE.PointsMaterial({
      size: 0.5,
      map: snowTexture,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    })
    
    return { rainGeometry, rainMaterial, snowGeometry, snowMaterial }
  }, [rainTexture, snowTexture])
  
  // Gérer le brouillard
  useEffect(() => {
    if (weatherType === WeatherType.FOGGY) {
      const fog = new THREE.FogExp2('#CCCCCC', 0.02 * localIntensity)
      scene.fog = fog
      fogRef.current = fog
      
      // Couleur de fond plus grisâtre
      scene.background = new THREE.Color('#AAAAAA')
    } else if (weatherType === WeatherType.SNOWY) {
      const fog = new THREE.FogExp2('#EEEEF5', 0.01 * localIntensity)
      scene.fog = fog
      fogRef.current = fog
      
      // Couleur de fond bleuâtre
      scene.background = new THREE.Color('#D8E1F9')
    } else if (weatherType === WeatherType.RAINY || weatherType === WeatherType.STORMY) {
      const fog = new THREE.FogExp2('#606875', 0.008 * localIntensity)
      scene.fog = fog
      fogRef.current = fog
      
      // Couleur de fond plus sombre
      scene.background = new THREE.Color('#505A6B')
    } else {
      scene.fog = null
      fogRef.current = null
      
      // Calculer la couleur du ciel en fonction du temps
      let skyColor
      if (time < 0.25) { // Nuit
        skyColor = new THREE.Color('#030b17')
      } else if (time < 0.30) { // Lever du soleil
        const t = (time - 0.25) / 0.05
        skyColor = new THREE.Color().lerpColors(
          new THREE.Color('#030b17'),
          new THREE.Color('#d46e33'),
          t
        )
      } else if (time < 0.35) { // Après lever du soleil
        const t = (time - 0.30) / 0.05
        skyColor = new THREE.Color().lerpColors(
          new THREE.Color('#d46e33'),
          new THREE.Color('#87CEEB'),
          t
        )
      } else if (time < 0.65) { // Jour
        skyColor = new THREE.Color('#87CEEB')
      } else if (time < 0.70) { // Début coucher soleil
        const t = (time - 0.65) / 0.05
        skyColor = new THREE.Color().lerpColors(
          new THREE.Color('#87CEEB'),
          new THREE.Color('#f77622'),
          t
        )
      } else if (time < 0.75) { // Fin coucher soleil
        const t = (time - 0.70) / 0.05
        skyColor = new THREE.Color().lerpColors(
          new THREE.Color('#f77622'),
          new THREE.Color('#030b17'),
          t
        )
      } else { // Nuit
        skyColor = new THREE.Color('#030b17')
      }
      
      scene.background = skyColor
    }
    
    return () => {
      scene.fog = null
    }
  }, [scene, weatherType, localIntensity, time])
  
  // Animation des particules et effet météo
  useFrame((_, delta) => {
    // Suivre la position du joueur
    if (particleRef.current) {
      particleRef.current.position.x = position.x
      particleRef.current.position.z = position.z
    }
    
    if (cloudsRef.current) {
      cloudsRef.current.position.x = position.x
      cloudsRef.current.position.z = position.z
    }
    
    // Mise à jour des positions des particules de pluie
    if (weatherType === WeatherType.RAINY || weatherType === WeatherType.STORMY) {
      const positions = rainGeometry.attributes.position.array as Float32Array
      const rainSpeed = 30 * localIntensity
      const windFactor = weatherType === WeatherType.STORMY ? 15 : 5
      
      for (let i = 0; i < MAX_RAIN_PARTICLES; i++) {
        const i3 = i * 3
        
        // Descente des gouttes de pluie avec vent
        positions[i3] += Math.sin(Date.now() * 0.001) * delta * windFactor * localIntensity
        positions[i3 + 1] -= delta * rainSpeed
        
        // Réinitialiser les gouttes qui sont trop basses
        if (positions[i3 + 1] < 0) {
          positions[i3] = (Math.random() * 2 - 1) * 100 + position.x
          positions[i3 + 1] = Math.random() * 20 + 40
          positions[i3 + 2] = (Math.random() * 2 - 1) * 100 + position.z
        }
      }
      
      rainGeometry.attributes.position.needsUpdate = true
    }
    
    // Mise à jour des positions des particules de neige
    if (weatherType === WeatherType.SNOWY) {
      const positions = snowGeometry.attributes.position.array as Float32Array
      const snowSpeed = 5 * localIntensity
      
      for (let i = 0; i < MAX_SNOW_PARTICLES; i++) {
        const i3 = i * 3
        
        // Mouvement des flocons de neige (descente lente + déplacement latéral oscillant)
        positions[i3] += Math.sin(Date.now() * 0.0001 + i * 0.1) * delta * 2
        positions[i3 + 1] -= delta * snowSpeed
        positions[i3 + 2] += Math.cos(Date.now() * 0.0001 + i * 0.1) * delta * 2
        
        // Réinitialiser les flocons qui sont trop bas
        if (positions[i3 + 1] < 0) {
          positions[i3] = (Math.random() * 2 - 1) * 80 + position.x
          positions[i3 + 1] = Math.random() * 20 + 30
          positions[i3 + 2] = (Math.random() * 2 - 1) * 80 + position.z
        }
      }
      
      snowGeometry.attributes.position.needsUpdate = true
    }
    
    // Générer des éclairs aléatoires pendant les orages
    if (weatherType === WeatherType.STORMY && lightningRef.current) {
      const time = Date.now()
      const timeSinceLastLightning = time - lastLightningTime.current
      
      // Probabilité d'éclair qui augmente avec l'intensité
      if (timeSinceLastLightning > 5000 && Math.random() < 0.01 * localIntensity) {
        // Déclencher un éclair
        lightningRef.current.intensity = 2 + Math.random() * 5 * localIntensity
        
        // Position aléatoire de l'éclair
        lightningRef.current.position.set(
          position.x + (Math.random() * 2 - 1) * 100,
          30 + Math.random() * 20,
          position.z + (Math.random() * 2 - 1) * 100
        )
        
        // Enregistrer le temps de l'éclair
        lastLightningTime.current = time
        
        // Faire disparaître l'éclair après un court moment
        setTimeout(() => {
          if (lightningRef.current) {
            lightningRef.current.intensity = 0
          }
        }, 100 + Math.random() * 150)
      }
    }
    
    // Mise à jour de l'intensité du brouillard
    if (fogRef.current) {
      if (weatherType === WeatherType.FOGGY) {
        (fogRef.current as THREE.FogExp2).density = 0.02 * localIntensity
      } else if (weatherType === WeatherType.SNOWY) {
        (fogRef.current as THREE.FogExp2).density = 0.01 * localIntensity
      } else if (weatherType === WeatherType.RAINY || weatherType === WeatherType.STORMY) {
        (fogRef.current as THREE.FogExp2).density = 0.008 * localIntensity
      }
    }
  })
  
  // Ajuster les nuages en fonction de la météo
  const cloudCount = useMemo(() => {
    if (weatherType === WeatherType.CLEAR) return 0
    if (weatherType === WeatherType.CLOUDY) return Math.floor(5 + 10 * localIntensity)
    if (weatherType === WeatherType.RAINY) return Math.floor(10 + 15 * localIntensity)
    if (weatherType === WeatherType.STORMY) return Math.floor(20 + 15 * localIntensity)
    if (weatherType === WeatherType.SNOWY) return Math.floor(15 + 10 * localIntensity)
    if (weatherType === WeatherType.FOGGY) return Math.floor(8 + 7 * localIntensity)
    return 0
  }, [weatherType, localIntensity])
  
  // Générer les nuages une seule fois par type de météo
  const cloudConfigs = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 50,
        20 + Math.random() * 10,
        (Math.random() - 0.5) * 50
      ],
      scale: [5 + Math.random() * 15, 5 + Math.random() * 10, 10 + Math.random() * 10],
      rotation: Math.random() * Math.PI * 2,
      rotationZ: Math.random() * 0.1,
      speed: 0.1 + Math.random() * 0.3,
      opacity: 0.4 + Math.random() * 0.6
    }))
  }, [weatherType]) // Ne regénérer que si le type de météo change
  
  return (
    <>
      {/* Nuages - réactivés pour améliorer les effets météo */}
      {cloudCount > 0 && (
        <group ref={cloudsRef}>
          <Clouds material={THREE.MeshLambertMaterial} limit={cloudCount}>
            {cloudConfigs.slice(0, cloudCount).map((config, i) => (
              <Cloud
                key={i}
                position={config.position}
                scale={config.scale}
                rotation-y={config.rotation}
                rotation-z={config.rotationZ}
                speed={config.speed}
                opacity={config.opacity}
              />
            ))}
          </Clouds>
        </group>
      )}
      
      {/* Pluie */}
      {(weatherType === WeatherType.RAINY || weatherType === WeatherType.STORMY) && (
        <points ref={particleRef} geometry={rainGeometry} material={rainMaterial} />
      )}
      
      {/* Neige */}
      {weatherType === WeatherType.SNOWY && (
        <points ref={particleRef} geometry={snowGeometry} material={snowMaterial} />
      )}
      
      {/* Éclairs */}
      {weatherType === WeatherType.STORMY && (
        <pointLight
          ref={lightningRef}
          position={[0, 50, 0]}
          intensity={0}
          distance={150}
          decay={2}
          color="#f0f6ff"
        />
      )}
    </>
  )
} 