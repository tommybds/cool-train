import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

export function useKeyboard() {
  const { gl } = useThree()

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
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gl])
}