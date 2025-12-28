import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Sky } from '@react-three/drei'

interface DayNightCycleProps {
  time: number // 0 à 1 (0 = minuit, 0.25 = aube, 0.5 = midi, 0.75 = crépuscule)
  dayDuration?: number // Durée d'un cycle jour/nuit complet en secondes
  autoRotate?: boolean // Si true, le temps avance automatiquement
  sunPosition?: THREE.Vector3 // Position de base du soleil
  trainPosition: THREE.Vector3 // Pour suivre le joueur avec la lumière
  weatherType?: string // Type de météo
  weatherIntensity?: number // Intensité de la météo
}

export function DayNightCycle({ 
  time = 0.5, 
  dayDuration = 600, 
  autoRotate = true,
  sunPosition: initialSunPosition = new THREE.Vector3(0, 1, 0),
  trainPosition,
  weatherType = 'clear',
  weatherIntensity = 0.5
}: DayNightCycleProps) {
  const cycleTimeRef = useRef(time)
  const sunRef = useRef<THREE.DirectionalLight>(null)
  const moonRef = useRef<THREE.DirectionalLight>(null)
  const skyRef = useRef<THREE.Object3D>(null)
  const ambientRef = useRef<THREE.AmbientLight>(null)
  const starsRef = useRef<THREE.Points>(null)
  const hemisphereRef = useRef<THREE.HemisphereLight>(null)
  const nightLightRef = useRef<THREE.PointLight>(null)
  
  // Créer des étoiles 
  const starsGeometry = useRef<THREE.BufferGeometry>(
    (() => {
      const geometry = new THREE.BufferGeometry()
      const starCount = 2000
      const positions = new Float32Array(starCount * 3)
      const colors = new Float32Array(starCount * 3)
      const sizes = new Float32Array(starCount)
      
      for (let i = 0; i < starCount; i++) {
        const i3 = i * 3
        // Distribution sphérique des étoiles
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(Math.random() * 2 - 1)
        
        positions[i3] = Math.sin(phi) * Math.cos(theta) * 500
        positions[i3 + 1] = Math.sin(phi) * Math.sin(theta) * 500
        positions[i3 + 2] = Math.cos(phi) * 500
        
        // Couleur blanche légèrement aléatoire
        const brightness = 0.7 + Math.random() * 0.3
        colors[i3] = brightness
        colors[i3 + 1] = brightness
        colors[i3 + 2] = brightness + Math.random() * 0.1 // Légère teinte bleue
        
        // Taille aléatoire
        sizes[i] = Math.random() * 2
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
      
      return geometry
    })()
  ).current
  
  // Matériau pour les étoiles
  const starsMaterial = useRef<THREE.ShaderMaterial>(
    new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: new THREE.TextureLoader().load('/textures/star.png') }
      },
      vertexShader: `
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }`,
      fragmentShader: `
      uniform sampler2D pointTexture;
      varying vec3 vColor;
      void main() {
        gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
      }`,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      vertexColors: true
    })
  ).current
  
  // Ajuster les paramètres du cycle jour/nuit
  useFrame((state, delta) => {
    if (autoRotate) {
      // Avancer le temps
      cycleTimeRef.current = (cycleTimeRef.current + delta / dayDuration) % 1
    } else {
      cycleTimeRef.current = time
    }
    
    const t = cycleTimeRef.current
    
    // Position et intensité du soleil
    const sunAngle = (t * Math.PI * 2) - Math.PI/2
    const sunRadius = 500
    const sunHeight = Math.sin(sunAngle) * sunRadius
    const sunHorizPos = Math.cos(sunAngle) * sunRadius
    
    if (sunRef.current) {
      sunRef.current.position.set(
        trainPosition.x + sunHorizPos,
        sunHeight,
        trainPosition.z + initialSunPosition.z
      )
      
      // Intensité basée sur la hauteur du soleil (plus intense à midi)
      let sunIntensity = 0
      if (t > 0.25 && t < 0.75) { // Jour
        sunIntensity = 1 - Math.abs((t - 0.5) * 4) // Max à midi (t=0.5)
        
        // Réduire l'intensité selon le mauvais temps
        if (weatherType === 'cloudy') {
          sunIntensity *= (1 - weatherIntensity * 0.3)
        } else if (weatherType === 'rainy') {
          sunIntensity *= (1 - weatherIntensity * 0.5)
        } else if (weatherType === 'stormy') {
          sunIntensity *= (1 - weatherIntensity * 0.7)
        } else if (weatherType === 'snowy') {
          sunIntensity *= (1 - weatherIntensity * 0.4)
        } else if (weatherType === 'foggy') {
          sunIntensity *= (1 - weatherIntensity * 0.3)
        }
        
        sunRef.current.intensity = sunIntensity * 1.5
      } else {
        sunRef.current.intensity = 0 // Nuit
      }
      
      // Mettre à jour le ciel
      if (skyRef.current) {
        const sunPosition = new THREE.Vector3().copy(sunRef.current.position).sub(trainPosition)
        sunPosition.normalize()
        
        // @ts-expect-error - Propriétés du composant Sky
        skyRef.current.sunPosition = [sunPosition.x, sunPosition.y, sunPosition.z]
        
        // Ajuster les propriétés du ciel selon l'heure de la journée et la météo
        if (t > 0.21 && t < 0.28) { // Aube
          // @ts-expect-error - Propriétés du composant Sky
          skyRef.current.turbidity = 10
          // @ts-expect-error - Propriétés du composant Sky
          skyRef.current.rayleigh = 3 + (t - 0.21) * 20
          // @ts-expect-error - Propriétés du composant Sky
          skyRef.current.mieCoefficient = 0.005
          // @ts-expect-error - Propriétés du composant Sky
          skyRef.current.mieDirectionalG = 0.7
        } else if (t > 0.28 && t < 0.72) { // Jour
          // @ts-expect-error - Propriétés du composant Sky
          skyRef.current.turbidity = 10
          
          // Modifier le ciel en fonction de la météo
          if (weatherType === 'clear') {
            // @ts-expect-error - Propriétés du composant Sky
            skyRef.current.rayleigh = 0.5 // Valeur réduite pour un ciel plus bleu
            // @ts-expect-error - Propriétés du composant Sky
            skyRef.current.mieCoefficient = 0.005
            // @ts-expect-error - Propriétés du composant Sky
            skyRef.current.mieDirectionalG = 0.8
          } else if (weatherType === 'cloudy') {
            // @ts-expect-error - Propriétés du composant Sky
            skyRef.current.rayleigh = 1 + weatherIntensity * 2
            // @ts-expect-error - Propriétés du composant Sky
            skyRef.current.mieCoefficient = 0.005 + weatherIntensity * 0.01
            // @ts-expect-error - Propriétés du composant Sky
            skyRef.current.mieDirectionalG = 0.8 - weatherIntensity * 0.2
          } else if (weatherType === 'rainy' || weatherType === 'stormy') {
            // @ts-expect-error - Propriétés du composant Sky
            skyRef.current.rayleigh = 2 + weatherIntensity * 3
            // @ts-expect-error - Propriétés du composant Sky
            skyRef.current.mieCoefficient = 0.01 + weatherIntensity * 0.02
            // @ts-expect-error - Propriétés du composant Sky
            skyRef.current.mieDirectionalG = 0.6 - weatherIntensity * 0.1
          } else if (weatherType === 'snowy') {
            // @ts-expect-error - Propriétés du composant Sky
            skyRef.current.rayleigh = 1.5 + weatherIntensity * 1.5
            // @ts-expect-error - Propriétés du composant Sky
            skyRef.current.mieCoefficient = 0.015 + weatherIntensity * 0.015
            // @ts-expect-error - Propriétés du composant Sky
            skyRef.current.mieDirectionalG = 0.7 - weatherIntensity * 0.1
          } else if (weatherType === 'foggy') {
            // @ts-expect-error - Propriétés du composant Sky
            skyRef.current.rayleigh = 1 + weatherIntensity * 4
            // @ts-expect-error - Propriétés du composant Sky
            skyRef.current.mieCoefficient = 0.02 + weatherIntensity * 0.03
            // @ts-expect-error - Propriétés du composant Sky
            skyRef.current.mieDirectionalG = 0.5 - weatherIntensity * 0.1
          }
          
        } else if (t > 0.72 && t < 0.79) { // Crépuscule 
          // @ts-expect-error - Propriétés du composant Sky
          skyRef.current.turbidity = 10
          // @ts-expect-error - Propriétés du composant Sky
          skyRef.current.rayleigh = 3 + (0.79 - t) * 20
          // @ts-expect-error - Propriétés du composant Sky
          skyRef.current.mieCoefficient = 0.005
          // @ts-expect-error - Propriétés du composant Sky
          skyRef.current.mieDirectionalG = 0.7
        } else { // Nuit
          // Paramètres pour un ciel nocturne plus réaliste
          // @ts-expect-error - Propriétés du composant Sky
          skyRef.current.turbidity = 0.5
          // @ts-expect-error - Propriétés du composant Sky
          skyRef.current.rayleigh = 0.5
          // @ts-expect-error - Propriétés du composant Sky
          skyRef.current.mieCoefficient = 0.001
          // @ts-expect-error - Propriétés du composant Sky
          skyRef.current.mieDirectionalG = 0.8
        }
      }
      
      // Ajuster la lumière ambiante
      if (ambientRef.current) {
        if (t > 0.25 && t < 0.75) { // Jour
          // Lumière plus chaude au lever/coucher, plus neutre à midi
          const dayColor = new THREE.Color()
          if (t < 0.35) { // Lever
            dayColor.setHSL(0.1, 0.5, 0.5) // Orangé
          } else if (t > 0.65) { // Coucher
            dayColor.setHSL(0.07, 0.6, 0.5) // Rouge-orangé
          } else { // Milieu de journée
            dayColor.setHSL(0.17, 0.3, 0.7) // Jaune pâle
          }
          
          ambientRef.current.color = dayColor
          ambientRef.current.intensity = sunIntensity * 0.8
        } else { // Nuit
          ambientRef.current.color.setHSL(0.7, 0.3, 0.3) // Bleu nuit moins saturé
          ambientRef.current.intensity = 0.7  // Augmenté significativement pour la visibilité nocturne
        }
      }
      
      // Ajuster la lumière hémisphérique
      if (hemisphereRef.current) {
        if (t > 0.25 && t < 0.75) { // Jour
          hemisphereRef.current.intensity = 0.6
          hemisphereRef.current.color.set('#87CEEB') // Ciel
          hemisphereRef.current.groundColor.set('#382c1c') // Sol
        } else { // Nuit
          hemisphereRef.current.intensity = 0.6  // Augmenté pour plus de visibilité
          hemisphereRef.current.color.set('#103060') // Ciel nocturne
          hemisphereRef.current.groundColor.set('#101010') // Sol nocturne plus clair
        }
      }
      
      // Ajuster la lumière ponctuelle nocturne
      if (nightLightRef.current) {
        if (t < 0.25 || t > 0.75) { // Nuit
          nightLightRef.current.intensity = 1.0
          nightLightRef.current.position.copy(trainPosition)
          nightLightRef.current.position.y += 20
        } else {
          nightLightRef.current.intensity = 0
        }
      }
      
      // Ajuster la scène pour la nuit
      if (t < 0.25 || t > 0.75) { // Nuit
        // Définir une couleur de fond plus sombre pour la nuit mais pas trop
        state.scene.background = new THREE.Color('#071224')
        
        // Désactiver le composant Sky pendant la nuit
        if (skyRef.current) {
          skyRef.current.visible = false
        }
      } else {
        // Réactiver le composant Sky pendant le jour
        if (skyRef.current) {
          skyRef.current.visible = true
        }
      }
    }
    
    // Position et intensité de la lune (opposée au soleil)
    const moonAngle = (t * Math.PI * 2) + Math.PI/2
    const moonRadius = 500
    const moonHeight = Math.sin(moonAngle) * moonRadius
    const moonHorizPos = Math.cos(moonAngle) * moonRadius
    
    if (moonRef.current) {
      moonRef.current.position.set(
        trainPosition.x + moonHorizPos,
        moonHeight,
        trainPosition.z + initialSunPosition.z
      )
      
      // Intensité basée sur la hauteur de la lune (visible uniquement la nuit)
      if (t < 0.25 || t > 0.75) { // Nuit
        const moonPhase = t < 0.25 ? t + 0.75 : t - 0.25
        const moonIntensity = 1 - Math.abs((moonPhase - 0.5) * 4) // Max à minuit (t=0 ou t=1)
        moonRef.current.intensity = moonIntensity * 1.5  // Augmenté pour plus de visibilité
        moonRef.current.color.set('#d8e7ff')  // Couleur légèrement plus chaude
      } else {
        moonRef.current.intensity = 0 // Jour
      }
    }
    
    // Visibilité des étoiles
    if (starsRef.current) {
      if (t < 0.2 || t > 0.8) { // Pleine nuit
        starsRef.current.visible = true
        const opacity = t < 0.2 ? 
          1 - (t / 0.2) : // Fade-out à l'aube
          (t - 0.8) / 0.2   // Fade-in au crépuscule
        
        // Utiliser le cast pour accéder à la propriété opacity
        if (starsRef.current.material instanceof THREE.ShaderMaterial) {
          starsRef.current.material.opacity = opacity * 2.0  // Augmenté pour plus de visibilité
        }
      } else {
        starsRef.current.visible = false
      }
    }
  })
  
  // Suivre la position du train
  useEffect(() => {
    if (sunRef.current) {
      sunRef.current.target.position.copy(trainPosition)
      sunRef.current.target.updateMatrixWorld()
    }
    
    if (moonRef.current) {
      moonRef.current.target.position.copy(trainPosition)
      moonRef.current.target.updateMatrixWorld()
    }
  }, [trainPosition])
  
  return (
    <>
      {/* Soleil */}
      <directionalLight
        ref={sunRef}
        position={initialSunPosition}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      >
        <object3D position={[0, 0, 0]} />
      </directionalLight>
      
      {/* Lune */}
      <directionalLight
        ref={moonRef}
        position={initialSunPosition.clone().negate()}
        intensity={0.3}
        color="#b9d5ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      >
        <object3D position={[0, 0, 0]} />
      </directionalLight>
      
      {/* Lumière ambiante */}
      <ambientLight ref={ambientRef} intensity={0.5} color="#ffffff" />
      
      {/* Lumière hémisphérique pour un éclairage plus naturel */}
      <hemisphereLight 
        ref={hemisphereRef}
        intensity={0.6}
        color="#87CEEB"
        groundColor="#382c1c"
      />
      
      {/* Lumière ponctuelle pour la nuit */}
      <pointLight
        ref={nightLightRef}
        position={[0, 20, 0]}
        intensity={0}
        distance={200}
        decay={1.5}
        color="#b9d5ff"
      />
      
      {/* Ciel dynamique */}
      <Sky
        ref={skyRef}
        distance={450000}
        turbidity={10}
        rayleigh={0.5}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
        inclination={0}
        azimuth={0.25}
        sunPosition={[
          Math.cos(cycleTimeRef.current * Math.PI * 2) * 10,
          Math.max(0.1, Math.sin(cycleTimeRef.current * Math.PI * 2) * 10),
          0
        ]}
      />
      
      {/* Étoiles */}
      <points ref={starsRef} geometry={starsGeometry} material={starsMaterial} />
    </>
  )
} 