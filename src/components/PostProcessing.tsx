import { EffectComposer, Bloom, Vignette, ChromaticAberration, DepthOfField } from '@react-three/postprocessing'
import { useWeatherStore } from '../stores/weatherStore'

export function PostProcessing() {
  const weatherType = useWeatherStore((state) => state.type)
  const weatherIntensity = useWeatherStore((state) => state.intensity)
  
  return (
    <EffectComposer>
      <Bloom 
        intensity={weatherType === 'stormy' ? 1.5 : weatherType === 'rainy' ? 0.8 : 0.5} 
        luminanceThreshold={0.9}
        luminanceSmoothing={0.9}
      />
      <Vignette eskil={false} offset={0.1} darkness={0.5} />
      <ChromaticAberration offset={[0.001, 0.001]} />
      {weatherType === 'foggy' && (
        <DepthOfField 
          focusDistance={0.1} 
          focalLength={0.02} 
          bokehScale={2} 
          height={480} 
        />
      )}
    </EffectComposer>
  )
}

