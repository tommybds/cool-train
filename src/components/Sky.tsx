import { Sky as DreiSky } from '@react-three/drei'

export function Sky() {
  return (
    <DreiSky
      distance={450000}
      sunPosition={[0, 1, 0]}
      inclination={0.6}
      azimuth={0.1}
      mieCoefficient={0.005}
      mieDirectionalG={0.8}
      rayleigh={3}
      turbidity={8}
    />
  )
} 