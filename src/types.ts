import { OrbitControls } from '@react-three/drei'

export type SceneType = 'plain' | 'mountain' | 'seaside'
export type Weather = 'sunny' | 'cloudy' | 'rainy'
export type TimeOfDay = 'morning' | 'noon' | 'evening' | 'night'
export type ViewMode = 'thirdPerson' | 'cockpit' | 'pedestrian'
export type SunPosition = [number, number, number]

declare module 'three' {
  interface WebGLRenderer {
    userData: {
      forward?: boolean
      backward?: boolean
    }
  }
}

export type OrbitControlsImpl = typeof OrbitControls

export interface WebGLRendererParameters {
  userData?: {
    forward?: boolean
    backward?: boolean
  }
}

export type OrbitControlsType = typeof OrbitControls