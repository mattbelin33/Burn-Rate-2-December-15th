import { useState, useEffect, useRef } from 'react'
import './index.css'

function App() {
  const [attendees, setAttendees] = useState(4)
  const [rate, setRate] = useState(100) // Hourly rate per person
  const [isActive, setIsActive] = useState(false)
  const [cost, setCost] = useState(0)
  const [heat, setHeat] = useState('low') // low, medium, high, critical

  const startTimeRef = useRef(null)
  const requestRef = useRef(null)

  const calculateCost = (elapsedSeconds) => {
    const costPerSecond = (attendees * rate) / 3600
    return costPerSecond * elapsedSeconds
  }

  const update = () => {
    if (!startTimeRef.current) return

    const now = Date.now()
    const elapsedSeconds = (now - startTimeRef.current) / 1000
    const currentCost = calculateCost(elapsedSeconds)

    setCost(currentCost)

    // Update Heat Level based on Cost
    if (currentCost > 1000) setHeat('critical')
    else if (currentCost > 500) setHeat('high')
    else if (currentCost > 100) setHeat('medium')
    else setHeat('low')

    requestRef.current = requestAnimationFrame(update)
  }

  const startTimer = () => {
    setIsActive(true)
    startTimeRef.current = Date.now() - (cost / ((attendees * rate) / 3600)) * 1000 // Resume from current cost
    requestRef.current = requestAnimationFrame(update)
  }

  const stopTimer = () => {
    setIsActive(false)
    if (requestRef.current) cancelAnimationFrame(requestRef.current)
  }

  const resetTimer = () => {
    stopTimer()
    setCost(0)
    setHeat('low')
    startTimeRef.current = null
  }

  // Sync heat to body attribute for CSS styling
  useEffect(() => {
    document.body.setAttribute('data-heat', heat)
    document.body.style.setProperty('--intensity',
      heat === 'low' ? 0 :
        heat === 'medium' ? 0.3 :
          heat === 'high' ? 0.6 : 0.9
    )
  }, [heat])

  return (
    <div className="app-container">
      <div className="overlay"></div>

      <div className="label">Current Meeting Cost</div>
      <div className="cost-display">
        ${cost.toFixed(2)}
      </div>

      <div className="controls">
        <div className="input-group">
          <label>Attendees</label>
          <input
            type="number"
            value={attendees}
            onChange={(e) => setAttendees(Number(e.target.value))}
            disabled={isActive}
          />
        </div>

        <div className="input-group">
          <label>Avg Rate ($/hr)</label>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            disabled={isActive}
          />
        </div>

        {!isActive ? (
          <button onClick={startTimer}>Start Burn</button>
        ) : (
          <button className="stop-btn" onClick={stopTimer}>Stop</button>
        )}

        <button onClick={resetTimer}>Reset</button>
      </div>
    </div>
  )
}

export default App
