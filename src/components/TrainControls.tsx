import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { useTrainStore } from '../stores/trainStore'
import { useEffect, useRef } from 'react'

export function TrainControls() {
  const [, get] = useKeyboardControls()
  const setSpeed = useTrainStore((state) => state.setSpeed)
  const speed = useTrainStore((state) => state.speed)
  const addWagon = useTrainStore((state) => state.addWagon)
  const removeWagon = useTrainStore((state) => state.removeWagon)
  const lastKeyPress = useRef<number>(0)
  const KEY_COOLDOWN = 200
  const MAX_SPEED = 2.0
  const MIN_SPEED = 0
  const SPEED_INCREMENT = 0.5
  
  useFrame(() => {
    const { forward, backward, addWagon: addWagonKey, removeWagon: removeWagonKey } = get()
    
    if (forward && Date.now() - lastKeyPress.current > KEY_COOLDOWN) {
      setSpeed(Math.min(MAX_SPEED, speed + SPEED_INCREMENT))
      lastKeyPress.current = Date.now()
    }
    
    if (backward && Date.now() - lastKeyPress.current > KEY_COOLDOWN) {
      setSpeed(Math.max(MIN_SPEED, speed - SPEED_INCREMENT))
      lastKeyPress.current = Date.now()
    }
    
    if (addWagonKey && Date.now() - lastKeyPress.current > KEY_COOLDOWN) {
      addWagon()
      lastKeyPress.current = Date.now()
    }
    
    if (removeWagonKey && Date.now() - lastKeyPress.current > KEY_COOLDOWN) {
      removeWagon()
      lastKeyPress.current = Date.now()
    }
  })
  
  // Gestion du freinage
  useEffect(() => {
    const unsubscribe = useTrainStore.subscribe(
      (state) => state.speed,
      (currentSpeed, previousSpeed) => {
        if (currentSpeed < previousSpeed - 0.1) {
          useTrainStore.getState().setIsBraking(true)
          if (window.wagonSounds?.brake && !window.wagonSounds.brake.paused) {
            window.wagonSounds.brake.play()
          }
        } else {
          useTrainStore.getState().setIsBraking(false)
          if (window.wagonSounds?.brake) {
            window.wagonSounds.brake.pause()
          }
        }
      }
    )
    
    return unsubscribe
  }, [])
  
  return null
}

