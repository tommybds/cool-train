import { useState, useEffect } from 'react'

export function Stats() {
  const [fps, setFps] = useState(0)
  const [memory, setMemory] = useState(0)
  const frames = new Array(60).fill(0)
  let frameIndex = 0
  let lastTime = performance.now()

  useEffect(() => {
    let animationFrameId: number

    const updateStats = () => {
      const currentTime = performance.now()
      const delta = (currentTime - lastTime) / 1000
      lastTime = currentTime

      frames[frameIndex] = 1 / delta
      frameIndex = (frameIndex + 1) % frames.length
      const averageFps = Math.round(frames.reduce((a, b) => a + b) / frames.length)
      setFps(averageFps)

      if ((performance as any).memory) {
        setMemory(Math.round((performance as any).memory.usedJSHeapSize / 1048576))
      }

      animationFrameId = requestAnimationFrame(updateStats)
    }

    animationFrameId = requestAnimationFrame(updateStats)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: '#fff',
      padding: '10px',
      borderRadius: '5px',
      fontFamily: 'monospace',
      zIndex: 1000
    }}>
      <div>FPS: {fps}</div>
      {memory > 0 && <div>Memory: {memory} MB</div>}
    </div>
  )
} 