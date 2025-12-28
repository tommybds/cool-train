import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface SmokeParticlesProps {
  position: THREE.Vector3
  speed: number
}

export function SmokeParticles({ position, speed }: SmokeParticlesProps) {
  const MAX_PARTICLES = 200
  const particlesRef = useRef<THREE.Points>(null)
  const particlePositions = useRef<Float32Array>()
  const particleData = useRef<Array<{ 
    life: number, 
    speed: number, 
    size: number,
    rotationSpeed: number,
    opacity: number,
    angle: number,
    radius: number,
    initialX: number,
    initialZ: number
  }>>([])
  const timeSinceLastSmoke = useRef(0)
  const BASE_INTERVAL = 0.5

  const smokeTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const context = canvas.getContext('2d')!
    
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(0.3, 'rgba(180, 180, 180, 0.8)')
    gradient.addColorStop(1, 'rgba(100, 100, 100, 0)')
    
    context.fillStyle = gradient
    context.fillRect(0, 0, 64, 64)

    const texture = new THREE.Texture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])

  const vertexShader = [
    'attribute float opacity;',
    'attribute float size;',
    'varying float vOpacity;',
    'void main() {',
    '  vOpacity = opacity;',
    '  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);',
    '  gl_PointSize = size * (300.0 / -mvPosition.z);',
    '  gl_Position = projectionMatrix * mvPosition;',
    '}'
  ].join('\n')

  const fragmentShader = [
    'uniform sampler2D smokeTex;',
    'varying float vOpacity;',
    'void main() {',
    '  vec4 texColor = texture2D(smokeTex, gl_PointCoord);',
    '  gl_FragColor = vec4(texColor.rgb, texColor.a * vOpacity);',
    '}'
  ].join('\n')

  const { geometry, material } = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(MAX_PARTICLES * 3)
    const opacities = new Float32Array(MAX_PARTICLES)
    const sizes = new Float32Array(MAX_PARTICLES)
    
    particlePositions.current = positions
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.ShaderMaterial({
      uniforms: {
        smokeTex: { value: smokeTexture }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })

    for (let i = 0; i < MAX_PARTICLES; i++) {
      particleData.current.push({
        life: 0,
        speed: 0,
        size: 0,
        rotationSpeed: 0,
        opacity: 0,
        angle: 0,
        radius: 0,
        initialX: 0,
        initialZ: 0
      })
    }

    return { geometry, material }
  }, [smokeTexture, vertexShader, fragmentShader])

  useFrame((_, delta) => {
    if (!particlesRef.current || !particlePositions.current) return

    const positions = particlePositions.current
    const sizes = geometry.attributes.size.array
    const opacities = geometry.attributes.opacity.array
    const actualSpeed = Math.abs(speed)
    
    timeSinceLastSmoke.current += delta
    const interval = BASE_INTERVAL / (1 + actualSpeed * 10)
    const shouldEmitSmoke = timeSinceLastSmoke.current >= interval

    if (shouldEmitSmoke) {
      timeSinceLastSmoke.current = 0
    }

    const particlesToEmit = shouldEmitSmoke ? Math.ceil(1 + actualSpeed * actualSpeed * 4) : 0

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const i3 = i * 3
      const particle = particleData.current[i]

      if (particle.life <= 0 && shouldEmitSmoke && i < particlesToEmit) {
        const spread = 0.2 + actualSpeed * 0.3
        particle.initialX = (Math.random() - 0.5) * spread
        particle.initialZ = (Math.random() - 0.5) * spread
        positions[i3] = position.x + particle.initialX
        positions[i3 + 1] = position.y + 1.4
        positions[i3 + 2] = position.z + particle.initialZ
        particle.life = 1
        
        const speedFactor = Math.min(actualSpeed * 3, 2)
        particle.speed = (2 + Math.random()) * (1 + actualSpeed * 0.5)
        particle.size = (2 + Math.random() * 2) * (1 + speedFactor * 0.6)
        particle.opacity = 0.8 - speedFactor * 0.1
        particle.rotationSpeed = (Math.random() - 0.5) * (2 + speedFactor * 3)
        particle.radius = 0.2 + speedFactor * 0.4
        particle.angle = Math.random() * Math.PI * 2

        sizes[i] = particle.size
        opacities[i] = particle.opacity
      }

      if (particle.life > 0) {
        const age = 1 - particle.life
        const speedFactor = Math.min(actualSpeed * 3, 2)
        
        const verticalSpeed = particle.speed * (0.8 + speedFactor * 0.1)
        positions[i3 + 1] += verticalSpeed * delta

        const horizontalSpeed = actualSpeed * (1 + speedFactor * 0.8)
        positions[i3] -= horizontalSpeed * delta
        
        particle.angle += particle.rotationSpeed * delta
        particle.radius += delta * (0.6 + speedFactor * 0.8)
        
        const radiusFactor = delta * (0.8 + speedFactor * 0.4)
        positions[i3] += Math.cos(particle.angle) * particle.radius * radiusFactor
        positions[i3 + 2] += Math.sin(particle.angle) * particle.radius * radiusFactor

        const growthRate = age < 0.3 ? 4 : 2
        particle.size += delta * (growthRate + speedFactor)
        sizes[i] = particle.size * (1.2 + age * 0.2)

        const fadeRate = age < 0.2 ? 0.15 : 0.3
        particle.opacity = Math.max(0, particle.opacity - delta * (fadeRate + speedFactor * 0.15))
        opacities[i] = particle.opacity * (1 - age * 0.25)

        particle.life -= delta * (0.3 + speedFactor * 0.25)
      }
    }

    geometry.attributes.position.needsUpdate = true
    geometry.attributes.size.needsUpdate = true
    geometry.attributes.opacity.needsUpdate = true
  })

  return <points ref={particlesRef} geometry={geometry} material={material} />
} 