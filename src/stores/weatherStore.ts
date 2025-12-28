import { create } from 'zustand'
import { WeatherType } from '../components/WeatherSystem'

interface WeatherState {
  type: WeatherType
  intensity: number
  dayTime: number
  autoRotateTime: boolean
  
  setType: (type: WeatherType) => void
  setIntensity: (intensity: number) => void
  setDayTime: (time: number) => void
  setAutoRotateTime: (auto: boolean) => void
}

export const useWeatherStore = create<WeatherState>()((set) => ({
  type: WeatherType.CLEAR,
  intensity: 0.5,
  dayTime: 0.5,
  autoRotateTime: true,
  
  setType: (type) => set({ type }),
  setIntensity: (intensity) => set({ intensity: Math.max(0, Math.min(1, intensity)) }),
  setDayTime: (time) => set({ dayTime: Math.max(0, Math.min(1, time)) }),
  setAutoRotateTime: (auto) => set({ autoRotateTime: auto }),
}))

