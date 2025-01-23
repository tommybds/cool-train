import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface PathProps {
  points: THREE.Vector3[]
}

export function Path({ points }: PathProps) {
  const lineRef = useRef<THREE.Line>(null)

  useFrame(() => {
    if (!lineRef.current) return
    const geometry = lineRef.current.geometry as THREE.BufferGeometry
    geometry.setFromPoints(points)
    geometry.attributes.position.needsUpdate = true
  })

  return (
    <primitive object={new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: 'white', linewidth: 2 })
    )} ref={lineRef} />
  )
} 