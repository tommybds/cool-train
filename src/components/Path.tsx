import { useRef, useMemo } from 'react'
import * as THREE from 'three'

interface PathProps {
  points: THREE.Vector3[]
}

export function Path({ points }: PathProps) {
  const tieSpacing = 2

  const { ties, rails } = useMemo(() => {
    const tiesGeometry = new THREE.BoxGeometry(3, 0.2, 0.4)
    const tiesMaterial = new THREE.MeshStandardMaterial({ color: '#4a3728', roughness: 0.8 })
    const ties: THREE.Mesh[] = []

    for (let i = 1; i < points.length; i++) {
      const current = points[i]
      const prev = points[i - 1]
      
      const direction = new THREE.Vector3().subVectors(current, prev)
      const distance = direction.length()
      const numTies = Math.floor(distance / tieSpacing)
      
      for (let j = 0; j < numTies; j++) {
        const t = j / numTies
        const position = new THREE.Vector3().lerpVectors(prev, current, t)
        
        const up = new THREE.Vector3(0, 1, 0)
        const forward = direction.clone().normalize()
        const right = new THREE.Vector3().crossVectors(up, forward).normalize()
        const adjustedUp = new THREE.Vector3().crossVectors(forward, right)
        
        const tie = new THREE.Mesh(tiesGeometry, tiesMaterial)
        tie.position.copy(position)
        
        const matrix = new THREE.Matrix4().makeBasis(right, adjustedUp, forward)
        tie.quaternion.setFromRotationMatrix(matrix)
        
        ties.push(tie)
      }
    }

    const rails = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: '#555555', linewidth: 2 })
    )

    return { ties, rails }
  }, [points])

  return (
    <group>
      <primitive object={rails} />
      {ties.map((tie, index) => (
        <primitive key={index} object={tie} />
      ))}
    </group>
  )
} 