export function Ground() {
  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -0.5, 0]} 
      receiveShadow
    >
      <planeGeometry args={[1000, 1000]} />
      <meshStandardMaterial 
        color="#4a5568"
        roughness={1}
        metalness={0}
      />
    </mesh>
  )
} 