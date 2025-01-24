import { useEffect } from 'react'
import ReactDOM from 'react-dom'

interface DistanceCounterProps {
  distance: number
  metersPerUnit?: number
}

export function DistanceCounter({ distance, metersPerUnit = 5 }: DistanceCounterProps) {
  const distanceInMeters = distance * metersPerUnit
  const kilometers = Math.floor(distanceInMeters / 1000)
  const meters = Math.floor(distanceInMeters % 1000)

  useEffect(() => {
    // Créer ou récupérer le conteneur pour le compteur
    let container = document.getElementById('distance-counter')
    if (!container) {
      container = document.createElement('div')
      container.id = 'distance-counter'
      document.body.appendChild(container)
    }

    // Appliquer les styles au conteneur
    Object.assign(container.style, {
      position: 'fixed',
      top: '20px',
      right: '220px',
      background: 'rgba(0, 0, 0, 0.7)',
      padding: '10px 15px',
      borderRadius: '5px',
      color: 'white',
      fontFamily: 'monospace',
      fontSize: '16px',
      userSelect: 'none',
      zIndex: '1000'
    })

    return () => {
      // Nettoyage lors du démontage
      container?.remove()
    }
  }, [])

  return ReactDOM.createPortal(
    <div>
      <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>{kilometers}</span>
      <span style={{ color: '#90A4AE' }}>km </span>
      <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>{meters.toString().padStart(3, '0')}</span>
      <span style={{ color: '#90A4AE' }}>m</span>
    </div>,
    document.getElementById('distance-counter') || document.body
  )
} 