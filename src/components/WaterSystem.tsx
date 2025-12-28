import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createNoise2D } from 'simplex-noise'

interface WaterSystemProps {
  waterBodies: {
    type: 'river' | 'lake'
    position: THREE.Vector3
    width: number
    length: number
    depth: number
    flowDirection?: THREE.Vector2 // Pour les rivières
  }[]
}

// Shaders personnalisés pour l'eau
const waterVertexShader = `
  uniform float time;
  uniform vec2 flowDirection;
  uniform float flowSpeed;
  uniform sampler2D noiseTexture;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normal;
    
    // Animation des vagues avec amplification par bruit
    float waveHeight = 0.1;
    vec2 noiseUV = uv * 5.0 + flowDirection * time * flowSpeed;
    vec4 noiseSample = texture2D(noiseTexture, noiseUV);
    
    // Vagues multiples de différentes fréquences
    float wave1 = sin(position.x * 0.3 + time * 0.7) * 0.03;
    float wave2 = sin(position.z * 0.2 + time * 0.4) * 0.02;
    float wave3 = cos(position.x * 0.1 + time * 0.3) * 0.04;
    float wave4 = cos(position.z * 0.4 + time * 0.5) * 0.01;
    
    // Position avec vagues
    vec3 newPosition = position;
    newPosition.y += (wave1 + wave2 + wave3 + wave4) * waveHeight * (noiseSample.r * 0.5 + 0.5);
    
    // Mise à jour de la position finale
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const waterFragmentShader = `
  uniform float time;
  uniform vec3 waterColor;
  uniform sampler2D noiseTexture;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  void main() {
    // Coordonnées UV animées
    vec2 uv = vUv;
    uv.x += time * 0.05;
    uv.y += time * 0.03;
    
    // Échantillonnage de la texture de bruit pour la couleur de l'eau
    vec4 noise1 = texture2D(noiseTexture, uv * 3.0);
    vec4 noise2 = texture2D(noiseTexture, uv * 5.0 + vec2(time * 0.02, time * 0.01));
    
    // Calcul du coefficient de Fresnel amélioré
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float fresnel = dot(viewDirection, vNormal);
    fresnel = pow(1.0 - fresnel, 4.0);
    
    // Couleur de base de l'eau
    vec3 baseColor = waterColor;
    
    // Mélange avec de la réflexion de ciel (effet Fresnel)
    vec3 skyColor = vec3(0.5, 0.8, 1.0);
    vec3 deepColor = vec3(0.0, 0.2, 0.3);
    
    // Mélange entre couleur profonde et couleur de surface
    vec3 waterSurfaceColor = mix(deepColor, baseColor, noise1.r * 0.5 + 0.5);
    
    // Ajout de la réflexion du ciel
    vec3 finalColor = mix(waterSurfaceColor, skyColor, fresnel * 0.8);
    
    // Ajouter des variations de couleur basées sur les textures de bruit
    finalColor = mix(finalColor, finalColor * 1.2, noise2.r * 0.3);
    
    // Bord d'écume plus clair
    float foam = smoothstep(0.4, 0.6, noise1.r * noise2.g);
    finalColor = mix(finalColor, vec3(1.0), foam * 0.05);
    
    // Sortie
    gl_FragColor = vec4(finalColor, 0.92);
  }
`;

// Composant personnalisé Water
interface CustomWaterProps {
  geometry: THREE.BufferGeometry
  position: THREE.Vector3
  rotation: THREE.Euler
  waterConfig: {
    waterNormals: THREE.Texture
    waterColor: number
    textureWidth: number
    textureHeight: number
    distortionScale: number
    fog: boolean
  }
  flowDirection?: THREE.Vector2
}

function CustomWater({ 
  geometry, 
  position, 
  rotation, 
  waterConfig, 
  flowDirection = new THREE.Vector2(0, 0) 
}: CustomWaterProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Uniforms pour les shaders
  const uniforms = useMemo(() => ({
    time: { value: 0 },
    waterColor: { value: new THREE.Color(waterConfig.waterColor) },
    noiseTexture: { value: waterConfig.waterNormals },
    flowDirection: { value: flowDirection },
    flowSpeed: { value: 0.5 }
  }), [waterConfig, flowDirection])
  
  // Material personnalisé pour l'eau
  const waterMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      transparent: true,
      side: THREE.DoubleSide
    })
  }, [uniforms])
  
  // Animation de l'eau
  useFrame((_, delta) => {
    if (meshRef.current && meshRef.current.material) {
      const material = meshRef.current.material as THREE.ShaderMaterial
      material.uniforms.time.value += delta * 0.5
    }
  })
  
  return (
    <mesh 
      ref={meshRef} 
      geometry={geometry} 
      material={waterMaterial} 
      position={position} 
      rotation={rotation}
    />
  )
}

export function WaterSystem({ waterBodies }: WaterSystemProps) {
  const waterRef = useRef<THREE.Group>(null)
  
  // Génération des géométries d'eau
  const waterGeometries = useMemo(() => {
    return waterBodies.map((body) => {
      if (body.type === 'river') {
        // Créer une courbe pour la rivière
        const riverPoints = []
        
        // Déterminer la direction de la rivière
        const direction = body.flowDirection || new THREE.Vector2(1, 0)
        const normalizedDir = direction.clone().normalize()
        
        // Créer des points le long de la direction pour former la rivière
        const halfLength = body.length / 2
        const step = body.length / 30 // Plus de segments = plus lisse
        
        for (let i = -halfLength; i <= halfLength; i += step) {
          // Ajouter une variation sinusoïdale pour des méandres naturels
          const sineOffset = Math.sin(i * 0.05) * body.width * 0.5
          const cosOffset = Math.cos(i * 0.08) * body.width * 0.3
          
          // Variations aléatoires supplémentaires
          const randomOffset = new THREE.Vector3(
            (Math.random() - 0.5) * step * 0.3,
            0,
            (Math.random() - 0.5) * step * 0.3
          )
          
          // Calculer le vecteur perpendiculaire à la direction pour le méandre
          const perpVector = new THREE.Vector2(-normalizedDir.y, normalizedDir.x)
          
          riverPoints.push(
            new THREE.Vector3(
              body.position.x + normalizedDir.x * i + perpVector.x * sineOffset + randomOffset.x,
              body.position.y,
              body.position.z + normalizedDir.y * i + perpVector.y * cosOffset + randomOffset.z
            )
          )
        }
        
        // Créer la courbe de la rivière
        const curve = new THREE.CatmullRomCurve3(riverPoints)
        curve.tension = 0.2 // Ajuster la tension pour des courbes plus douces
        
        // Créer un tube autour de la courbe avec plus de segments
        const tubeGeometry = new THREE.TubeGeometry(
          curve,
          Math.max(64, Math.ceil(body.length / 2)), // Plus de segments tubulaires
          body.width / 2,                           // Rayon
          16,                                       // Plus de segments radiaux
          false                                     // Non fermé
        )
        
        // Aplatir légèrement le tube pour ressembler à une rivière
        const positions = tubeGeometry.getAttribute('position').array as Float32Array
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] *= 0.2 // Aplatir davantage
        }
        tubeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        tubeGeometry.computeVertexNormals()
        
        return {
          geometry: tubeGeometry,
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Euler(0, 0, 0),
          flowDirection: direction
        }
      } else {
        // Pour un lac, utiliser un plan avec beaucoup de subdivisions
        const segments = Math.max(32, Math.min(64, Math.max(
          Math.ceil(body.width / 3),
          Math.ceil(body.length / 3)
        )))
        
        const planeGeometry = new THREE.PlaneGeometry(
          body.width,
          body.length,
          segments,
          segments
        )
        
        // Ajouter des variations de hauteur pour un effet plus naturel
        const positions = planeGeometry.getAttribute('position').array as Float32Array
        const noise2D = createNoise2D()
        
        // Perturber légèrement les bords pour un contour moins parfait
        for (let i = 0; i < positions.length; i += 3) {
          const x = positions[i]
          const z = positions[i + 2]
          
          // Normaliser la position pour obtenir la distance au centre (0-1)
          const nx = x / body.width
          const nz = z / body.length
          const distanceToCenter = Math.sqrt(nx * nx + nz * nz) * 2
          
          // Plus de perturbation aux bords qu'au centre
          const edgeFactor = Math.min(1, distanceToCenter * 1.5)
          
          // Calculer une hauteur de vague basée sur du bruit simplex
          const noise = noise2D(x * 0.05, z * 0.05) * 0.5 + 0.5
          positions[i + 1] = noise * 0.3 * edgeFactor
          
          // Ajouter une déformation légère sur le contour
          if (distanceToCenter > 0.8) {
            const borderNoise = noise2D(x * 0.1, z * 0.1) * 0.5 + 0.5
            positions[i] += (borderNoise - 0.5) * body.width * 0.05
            positions[i + 2] += (borderNoise - 0.5) * body.length * 0.05
          }
        }
        
        planeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        planeGeometry.computeVertexNormals()
        
        return {
          geometry: planeGeometry,
          position: body.position,
          rotation: new THREE.Euler(-Math.PI / 2, 0, 0), // Orienter horizontalement
          flowDirection: new THREE.Vector2(0, 0)
        }
      }
    })
  }, [waterBodies])
  
  // Texture de bruit pour la déformation de l'eau
  const noiseTexture = useMemo(() => {
    const noise2D = createNoise2D()
    const size = 128
    const data = new Uint8Array(size * size * 4)
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const noise = noise2D(x / 20, y / 20) * 0.5 + 0.5
        const i = (y * size + x) * 4
        data[i] = noise * 255
        data[i + 1] = noise * 255
        data[i + 2] = noise * 255
        data[i + 3] = 255
      }
    }
    
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.needsUpdate = true
    return texture
  }, [])
  
  // Paramètres du shader water
  const waterConfig = useMemo(() => ({
    textureWidth: 1024,
    textureHeight: 1024,
    waterNormals: noiseTexture,
    sunDirection: new THREE.Vector3(0.2, 0.7, 0.5),
    sunColor: 0xffffff,
    waterColor: 0x4499aa,
    distortionScale: 3.7,
    fog: true
  }), [noiseTexture])
  
  // Mettre à jour la position des plans d'eau pour suivre le joueur
  useFrame(() => {
    if (waterRef.current) {
      // Optionnel: déplacer l'eau avec le joueur pour donner l'illusion d'une eau infinie
      // Commenté car nous n'avons plus accès à trainPosition
      // waterRef.current.position.x = Math.floor(trainPosition.x / 1000) * 1000
      // waterRef.current.position.z = Math.floor(trainPosition.z / 1000) * 1000
    }
  })
  
  return (
    <group ref={waterRef}>
      {waterGeometries.map((waterGeo, index) => (
        <CustomWater
          key={`water-${index}`}
          geometry={waterGeo.geometry}
          position={waterGeo.position}
          rotation={waterGeo.rotation}
          waterConfig={waterConfig}
          flowDirection={waterGeo.flowDirection}
        />
      ))}
    </group>
  )
}

// Classe utilitaire pour créer une rivière qui suit un chemin donné
export class RiverGenerator {
  static createRiverAlongPath(
    pathPoints: THREE.Vector3[],
    width: number = 10,
    depth: number = 2
  ): WaterSystemProps['waterBodies'] {
    const riverSegments: WaterSystemProps['waterBodies'] = []
    
    if (pathPoints.length < 2) return riverSegments
    
    // Augmenter le nombre de points pour une rivière plus fluide
    const curvePoints = pathPoints.slice()
    const smoothedPoints: THREE.Vector3[] = []
    
    // Ajouter des points intermédiaires pour une courbe plus lisse
    for (let i = 0; i < curvePoints.length - 1; i++) {
      const start = curvePoints[i]
      const end = curvePoints[i + 1]
      
      smoothedPoints.push(start)
      
      // Ajouter 2 points intermédiaires
      for (let j = 1; j <= 2; j++) {
        const t = j / 3
        const pt = new THREE.Vector3().lerpVectors(start, end, t)
        
        // Ajouter une variation pour plus de naturel
        pt.x += (Math.random() - 0.5) * width * 0.3
        pt.z += (Math.random() - 0.5) * width * 0.3
        
        smoothedPoints.push(pt)
      }
    }
    
    // Ajouter le dernier point
    if (curvePoints.length > 0) {
      smoothedPoints.push(curvePoints[curvePoints.length - 1])
    }
    
    // Créer un seul segment de rivière avec une courbe lisse
    if (smoothedPoints.length > 2) {
      const curve = new THREE.CatmullRomCurve3(smoothedPoints)
      curve.tension = 0.1 // tension plus basse = courbe plus lisse
      
      // Calculer le centre approximatif de la rivière
      const center = new THREE.Vector3()
      for (const pt of smoothedPoints) {
        center.add(pt)
      }
      center.divideScalar(smoothedPoints.length)
      
      // Calculer la direction moyenne
      const start = smoothedPoints[0]
      const end = smoothedPoints[smoothedPoints.length - 1]
      const direction = new THREE.Vector3().subVectors(end, start).normalize()
      const flowDirection = new THREE.Vector2(direction.x, direction.z)
      
      // Calculer la longueur totale de la rivière
      const length = curve.getLength()
      
      riverSegments.push({
        type: 'river',
        position: center,
        width,
        length,
        depth,
        flowDirection
      })
    }
    
    return riverSegments
  }
  
  static createLake(
    position: THREE.Vector3,
    width: number = 50,
    length: number = 50,
    depth: number = 5
  ): WaterSystemProps['waterBodies'][0] {
    // Ajouter une légère variation aléatoire pour les dimensions
    const finalWidth = width * (0.9 + Math.random() * 0.2)
    const finalLength = length * (0.9 + Math.random() * 0.2)
    
    return {
      type: 'lake',
      position: new THREE.Vector3(position.x, position.y - depth / 2, position.z),
      width: finalWidth,
      length: finalLength,
      depth
    }
  }
} 