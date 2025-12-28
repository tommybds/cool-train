import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface BrakeSparklesProps {
  position: THREE.Vector3
  isBraking: boolean
  speed: number
}

export function BrakeSparkles({ position, isBraking, speed }: BrakeSparklesProps) {
  const MAX_PARTICLES = 100
  const particlesRef = useRef<THREE.Points>(null)
  const particleData = useRef<Array<{
    life: number,
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    size: number,
    initialSize: number
  }>>([])
  
  // Créer une texture pour les étincelles
  const sparkleTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const context = canvas.getContext('2d')!
    
    // Dessiner l'étincelle
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(0.3, 'rgba(255, 230, 150, 0.8)')
    gradient.addColorStop(0.6, 'rgba(255, 120, 0, 0.6)')
    gradient.addColorStop(1, 'rgba(255, 20, 0, 0)')
    
    context.fillStyle = gradient
    context.fillRect(0, 0, 64, 64)
    
    const texture = new THREE.Texture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])
  
  // Création du matériau et de la géométrie des particules
  const { geometry, material } = useMemo(() => {
    // Initialiser les particules
    for (let i = 0; i < MAX_PARTICLES; i++) {
      particleData.current.push({
        life: 0,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        size: 0,
        initialSize: 0
      })
    }
    
    // Créer la géométrie des particules
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(MAX_PARTICLES * 3)
    const sizes = new Float32Array(MAX_PARTICLES)
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    
    // Créer le matériau avec shader personnalisé
    const material = new THREE.PointsMaterial({
      size: 1,
      map: sparkleTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      vertexColors: true
    })
    
    return { geometry, material }
  }, [sparkleTexture])
  
  // Animation des particules
  useFrame((_, delta) => {
    if (!particlesRef.current) return
    
    const positions = geometry.attributes.position.array as Float32Array
    const sizes = geometry.attributes.size.array as Float32Array
    const actualSpeed = Math.abs(speed)
    
    // Émission de nouvelles particules si on freine et qu'on a une vitesse suffisante
    if (isBraking && actualSpeed > 0.5) {
      let particlesToEmit = Math.min(5 + Math.floor(actualSpeed * 3), 10)
      
      for (let i = 0; i < MAX_PARTICLES; i++) {
        const particle = particleData.current[i]
        
        if (particle.life <= 0 && particlesToEmit > 0) {
          // Position de départ (près des roues)
          const randomOffset = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,  // X offset
            (Math.random() - 0.2) * 0.1,  // Y offset
            (Math.random() - 0.5) * 0.1   // Z offset
          )
          
          // Positionner les étincelles sous les roues
          particle.position.copy(position).add(randomOffset)
          
          // Vitesse aléatoire avec direction vers l'arrière (freinage)
          const speed = 0.5 + Math.random() * 3 * actualSpeed
          const angle = Math.PI * 0.8 + Math.random() * Math.PI * 0.4 // Direction principalement vers l'arrière
          const elevation = -Math.PI * 0.25 + Math.random() * Math.PI * 0.5 // Légèrement vers le bas et le haut
          
          particle.velocity.set(
            Math.cos(angle) * Math.cos(elevation) * speed,
            Math.sin(elevation) * speed,
            Math.sin(angle) * Math.cos(elevation) * speed
          )
          
          // Durée de vie et taille
          particle.life = 0.2 + Math.random() * 0.2 // Courte durée de vie
          particle.initialSize = 0.05 + Math.random() * 0.15 * actualSpeed
          particle.size = particle.initialSize
          
          particlesToEmit--
        }
        
        // Mettre à jour les particules actives
        if (particle.life > 0) {
          // Mettre à jour la position
          particle.position.addScaledVector(particle.velocity, delta)
          
          // Appliquer la gravité
          particle.velocity.y -= 5 * delta
          
          // Ralentir horizontalement
          particle.velocity.x *= 0.95
          particle.velocity.z *= 0.95
          
          // Réduire la taille
          particle.size = particle.initialSize * (particle.life / 0.4)
          
          // Réduire la durée de vie
          particle.life -= delta
          
          // Mettre à jour la position et la taille dans la géométrie
          const i3 = i * 3
          positions[i3] = particle.position.x
          positions[i3 + 1] = particle.position.y
          positions[i3 + 2] = particle.position.z
          sizes[i] = particle.size
        }
      }
      
      // Mettre à jour la géométrie
      geometry.attributes.position.needsUpdate = true
      geometry.attributes.size.needsUpdate = true
    }
  })
  
  return <points ref={particlesRef} geometry={geometry} material={material} />
} 