import { useState, useEffect, useRef } from 'react'
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts'
import html2canvas from 'html2canvas'
import './index.css'

function App() {
  const [attendees, setAttendees] = useState(4)
  const [rate, setRate] = useState(100)
  const [isActive, setIsActive] = useState(false)
  const [cost, setCost] = useState(0)
  const [heat, setHeat] = useState('low')
  const [chartData, setChartData] = useState([{ time: 0, cost: 0 }])
  const [showInvoice, setShowInvoice] = useState(false)

  const startTimeRef = useRef(null)
  const requestRef = useRef(null)
  const invoiceRef = useRef(null)

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

    // Update Chart Data (throttle to every ~1s for performance)
    if (Math.floor(elapsedSeconds) > chartData.length - 1) {
      setChartData(prev => [...prev, { time: Math.floor(elapsedSeconds), cost: currentCost }])
    }

    // Update Heat Level
    if (currentCost > 1000) setHeat('critical')
    else if (currentCost > 500) setHeat('high')
    else if (currentCost > 100) setHeat('medium')
    else setHeat('low')

    requestRef.current = requestAnimationFrame(update)
  }

  const startTimer = () => {
    setIsActive(true)
    setShowInvoice(false)
    // Resume logic
    const elapsedSoFar = cost / ((attendees * rate) / 3600)
    startTimeRef.current = Date.now() - (elapsedSoFar * 1000)
    requestRef.current = requestAnimationFrame(update)
  }

  const stopTimer = () => {
    setIsActive(false)
    if (requestRef.current) cancelAnimationFrame(requestRef.current)
    setShowInvoice(true)
  }

  const resetTimer = () => {
    stopTimer()
    setCost(0)
    setHeat('low')
    setChartData([{ time: 0, cost: 0 }])
    setShowInvoice(false)
    startTimeRef.current = null
  }

  const downloadInvoice = async () => {
    if (invoiceRef.current) {
      const canvas = await html2canvas(invoiceRef.current)
      const link = document.createElement('a')
      link.download = `burn-rate-invoice-${Date.now()}.png`
      link.href = canvas.toDataURL()
      link.click()
    }
  }

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

      {/* Live Chart */}
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <YAxis hide domain={[0, 'auto']} />
            <Area
              type="monotone"
              dataKey="cost"
              stroke={heat === 'critical' ? '#ff0000' : '#334e68'}
              fill={heat === 'critical' ? '#4a0000' : '#334e68'}
              fillOpacity={0.3}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

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
          <label>Average Hourly Rate per Person</label>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            disabled={isActive}
          />
          {/* Role Presets */}
          {!isActive && (
            <div className="presets">
              <button className="preset-btn" onClick={() => setRate(50)}>Jr</button>
              <button className="preset-btn" onClick={() => setRate(120)}>Sr</button>
              <button className="preset-btn" onClick={() => setRate(300)}>VP</button>
              <button className="preset-btn" onClick={() => setRate(1000)}>CEO</button>
            </div>
          )}
        </div>

        {!isActive ? (
          <button onClick={startTimer}>Start Burn</button>
        ) : (
          <button className="stop-btn" onClick={stopTimer}>Stop</button>
        )}

        <button onClick={resetTimer}>Reset</button>
      </div>

      {/* Invoice Modal */}
      {showInvoice && (
        <div className="invoice-modal">
          <div className="invoice-content" ref={invoiceRef}>
            <div className="invoice-header">
              <span>INVOICE #001</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <h2>MEETING WASTE RECEIPT</h2>
            <p>Attendees: {attendees}</p>
            <p>Avg Rate: ${rate}/hr</p>
            <p>Duration: {Math.floor(chartData[chartData.length - 1]?.time / 60)}m {chartData[chartData.length - 1]?.time % 60}s</p>
            <div className="invoice-total">
              ${cost.toFixed(2)}
            </div>
            <p style={{ fontStyle: 'italic', fontSize: '0.8rem' }}>Generated by Burn Rate App</p>

            <div className="invoice-actions" data-html2canvas-ignore>
              <button className="download-btn" onClick={downloadInvoice}>Download</button>
              <button className="close-btn" onClick={() => setShowInvoice(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
