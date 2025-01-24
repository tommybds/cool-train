import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface SmokeParticlesProps {
  position: THREE.Vector3
  speed: number
}

export function SmokeParticles({ position, speed }: SmokeParticlesProps) {
  const MAX_PARTICLES = 50
  const particlesRef = useRef<THREE.Points>(null)
  const particlePositions = useRef<Float32Array>()
  const particleData = useRef<Array<{ life: number, speed: number }>>([])

  const smokeTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const context = canvas.getContext('2d')!
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    context.fillStyle = gradient
    context.fillRect(0, 0, 32, 32)
    const texture = new THREE.Texture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])

  const { geometry, material } = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(MAX_PARTICLES * 3)
    particlePositions.current = positions
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      size: 2,
      map: smokeTexture,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: 0x666666
    })

    // Initialiser les données des particules
    for (let i = 0; i < MAX_PARTICLES; i++) {
      particleData.current.push({
        life: 0,
        speed: Math.random() * 0.2 + 0.1
      })
    }

    return { geometry, material }
  }, [smokeTexture])

  useFrame((state, delta) => {
    if (!particlesRef.current || !particlePositions.current) return

    const positions = particlePositions.current
    const actualSpeed = Math.abs(speed)

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const i3 = i * 3
      const particle = particleData.current[i]

      if (particle.life <= 0 && actualSpeed > 0.1) {
        // Réinitialiser la particule
        positions[i3] = position.x
        positions[i3 + 1] = position.y + 1.5 // Position de la cheminée
        positions[i3 + 2] = position.z
        particle.life = 1
        particle.speed = (Math.random() * 0.2 + 0.1) * (actualSpeed + 0.5)
      }

      if (particle.life > 0) {
        // Mettre à jour la position
        positions[i3 + 1] += particle.speed * delta * 2
        positions[i3] += (Math.random() - 0.5) * 0.1
        positions[i3 + 2] += (Math.random() - 0.5) * 0.1
        particle.life -= delta * (0.5 + actualSpeed * 0.5)

        // Ajuster l'opacité en fonction de la vie
        if (i === 0) {
          material.opacity = Math.min(actualSpeed * 0.5, 0.5)
        }
      }
    }

    geometry.attributes.position.needsUpdate = true
  })

  return <points ref={particlesRef} geometry={geometry} material={material} />
} 