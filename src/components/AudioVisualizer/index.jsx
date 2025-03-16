import { useEffect, useRef } from 'react'
import useAudio from '../../hooks/useAudio'
import styles from './AudioVisualizer.module.scss'

export default function AudioVisualizer() {
  const { getAudioInstance } = useAudio()
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const analyzerRef = useRef(null)
  const audioContextRef = useRef(null)
  const sourceNodeRef = useRef(null)

  useEffect(() => {
    const audio = getAudioInstance()
    if (!canvasRef.current || !audio) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const setupAudioAnalysis = async () => {
      try {
        // Get the actual audio element from Howler
        const audioElement = audio._sounds[0]?._node
        if (!audioElement) return false

        // Create audio context if it doesn't exist
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
        }

        // Create analyzer if it doesn't exist
        if (!analyzerRef.current) {
          analyzerRef.current = audioContextRef.current.createAnalyser()
          analyzerRef.current.fftSize = 32 // Keep it small for stylized bars
        }

        // Create and connect source if it doesn't exist
        if (!sourceNodeRef.current) {
          sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioElement)
          sourceNodeRef.current.connect(analyzerRef.current)
          analyzerRef.current.connect(audioContextRef.current.destination)
        }

        return true
      } catch (error) {
        console.log('Using fallback visualizer:', error)
        return false
      }
    }

    const draw = () => {
      const WIDTH = canvas.width
      const HEIGHT = canvas.height

      // Clear with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.fillRect(0, 0, WIDTH, HEIGHT)

      let frequencyData
      
      if (analyzerRef.current) {
        // Production: Use real audio data
        const bufferLength = analyzerRef.current.frequencyBinCount
        frequencyData = new Uint8Array(bufferLength)
        analyzerRef.current.getByteFrequencyData(frequencyData)
      } else {
        // Development: Use simulated data
        const time = Date.now() / 1000
        frequencyData = Array(8).fill(0).map((_, i) => 
          (Math.sin(time * 4 + i) * 0.5 + 0.5) * 255
        )
      }

      // Draw bars
      const barWidth = (WIDTH / frequencyData.length) * 0.8
      const spacing = (WIDTH - frequencyData.length * barWidth) / (frequencyData.length + 1)
      
      frequencyData.forEach((value, i) => {
        const x = spacing + i * (barWidth + spacing)
        const height = (value / 255) * HEIGHT * 0.9
        
        // Draw bar with gradient
        const gradient = ctx.createLinearGradient(0, HEIGHT - height, 0, HEIGHT)
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.9)')
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0.4)')
        
        ctx.fillStyle = gradient
        ctx.fillRect(x, HEIGHT - height, barWidth, height)
        
        // Add highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.fillRect(x, HEIGHT - height, barWidth, 2)
      })
      
      animationRef.current = requestAnimationFrame(draw)
    }

    // Try to set up real audio analysis
    setupAudioAnalysis().then(() => {
      draw()
    })

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect()
      }
      if (analyzerRef.current) {
        analyzerRef.current.disconnect()
      }
    }
  }, [getAudioInstance])

  return (
    <canvas 
      ref={canvasRef} 
      className={styles.visualizer}
      width="150"
      height="30"
    />
  )
}
