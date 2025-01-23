import { useEffect } from 'react'
import * as THREE from 'three'

export const useKeyboard = (gl: THREE.WebGLRenderer) => {
  useEffect(() => {
    gl.userData = gl.userData || {}

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          gl.userData.forward = true
          break
        case 'ArrowDown':
        case 'KeyS':
          gl.userData.backward = true
          break
        case 'KeyA':
          gl.userData.addWagon = true
          break
        case 'KeyR':
          gl.userData.removeWagon = true
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          gl.userData.forward = false
          break
        case 'ArrowDown':
        case 'KeyS':
          gl.userData.backward = false
          break
        case 'KeyA':
          gl.userData.addWagon = false
          break
        case 'KeyR':
          gl.userData.removeWagon = false
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)
    }
  }, [gl])
}