import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import * as THREE from 'three'

interface TrainState {
  // Position et rotation
  position: THREE.Vector3
  rotation: THREE.Euler
  
  // État du train
  speed: number
  wagonCount: number
  fuelLevel: number
  pressure: number
  distanceTraveled: number
  
  // Vue et contrôles
  viewMode: 'external' | 'cockpit'
  isBraking: boolean
  
  // Actions
  setPosition: (pos: THREE.Vector3) => void
  setRotation: (rot: THREE.Euler) => void
  setSpeed: (speed: number) => void
  setFuelLevel: (level: number) => void
  setPressure: (pressure: number) => void
  setDistanceTraveled: (distance: number) => void
  addWagon: () => void
  removeWagon: () => void
  setViewMode: (mode: 'external' | 'cockpit') => void
  setIsBraking: (braking: boolean) => void
}

export const useTrainStore = create<TrainState>()(
  subscribeWithSelector((set) => ({
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
    speed: 0.91,
    wagonCount: 3,
    fuelLevel: 100,
    pressure: 5,
    distanceTraveled: 0,
    viewMode: 'external',
    isBraking: false,
    
    setPosition: (pos) => set({ position: pos }),
    setRotation: (rot) => set({ rotation: rot }),
    setSpeed: (speed) => set({ speed }),
    setFuelLevel: (level) => set({ fuelLevel: Math.max(0, Math.min(100, level)) }),
    setPressure: (pressure) => set({ pressure: Math.max(0, Math.min(10, pressure)) }),
    setDistanceTraveled: (distance) => set({ distanceTraveled: distance }),
    addWagon: () => set((state) => ({ 
      wagonCount: Math.min(state.wagonCount + 1, 10) 
    })),
    removeWagon: () => set((state) => ({ 
      wagonCount: Math.max(state.wagonCount - 1, 1) 
    })),
    setViewMode: (mode) => set({ viewMode: mode }),
    setIsBraking: (braking) => set({ isBraking: braking }),
  }))
)

