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

    const handleMouseDown = () => {
      gl.userData.isDragging = true
    }

    const handleMouseUp = () => {
      gl.userData.isDragging = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [gl])
}