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
  const [contextItem, setContextItem] = useState('')
  const [auditorMessage, setAuditorMessage] = useState('')

  const startTimeRef = useRef(null)
  const requestRef = useRef(null)
  const invoiceRef = useRef(null)

  // Opportunity Cost Items
  const contextItems = [
    { cost: 5, label: 'A Fancy Coffee' },
    { cost: 20, label: 'A Team Lunch' },
    { cost: 100, label: 'A Nice Dinner' },
    { cost: 300, label: 'A Round-Trip Flight' },
    { cost: 1000, label: 'A New MacBook Air' },
    { cost: 5000, label: 'A Used Honda Civic' },
    { cost: 10000, label: 'A Luxury Vacation' },
    { cost: 50000, label: 'A Junior Developer Salary' }
  ]

  // AI Auditor Messages
  const auditorMessages = [
    { threshold: 100, msg: "Efficiency nominal. Proceed." },
    { threshold: 500, msg: "Warning: ROI is plummeting." },
    { threshold: 1000, msg: "This meeting could have been an email." },
    { threshold: 2500, msg: "I am generating a resignation letter for you." },
    { threshold: 5000, msg: "CRITICAL FAILURE: BURN RATE EXCEEDED." }
  ]

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

    // Update Chart Data
    if (Math.floor(elapsedSeconds) > chartData.length - 1) {
      setChartData(prev => [...prev, { time: Math.floor(elapsedSeconds), cost: currentCost }])
    }

    // Update Heat Level
    if (currentCost > 1000) setHeat('critical')
    else if (currentCost > 500) setHeat('high')
    else if (currentCost > 100) setHeat('medium')
    else setHeat('low')

    // Update Context Item
    const item = contextItems.slice().reverse().find(i => currentCost >= i.cost)
    if (item) setContextItem(item.label)

    // Update Auditor Message
    const msg = auditorMessages.slice().reverse().find(m => currentCost >= m.threshold)
    if (msg) setAuditorMessage(msg.msg)

    requestRef.current = requestAnimationFrame(update)
  }

  const startTimer = () => {
    setIsActive(true)
    setShowInvoice(false)
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
    setContextItem('')
    setAuditorMessage('')
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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault() // Prevent scrolling
        if (isActive) stopTimer()
        else startTimer()
      } else if (e.code === 'Escape') {
        resetTimer()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, cost, attendees, rate])

  useEffect(() => {
    document.body.setAttribute('data-heat', heat)
    document.body.style.setProperty('--intensity',
      heat === 'low' ? 0 :
        heat === 'medium' ? 0.3 :
          heat === 'high' ? 0.6 : 0.9
    )
  }, [heat])

  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`

  return (
    <div className="app-container">
      <div className="overlay"></div>

      {/* AI Auditor */}
      {auditorMessage && (
        <div className="auditor-message">
          {auditorMessage}
        </div>
      )}

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

      {/* Opportunity Cost Context */}
      <div className="context-display">
        {contextItem && `(That's ${contextItem})`}
      </div>

      <div className="controls">
        <div className="input-group" data-tooltip="Number of people in the meeting">
          <label>Attendees</label>
          <input
            type="number"
            value={attendees}
            onChange={(e) => setAttendees(Number(e.target.value))}
            disabled={isActive}
          />
        </div>

        <div className="input-group" data-tooltip="Average hourly cost per person">
          <label>Avg Rate ($/hr)</label>
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
          <button onClick={startTimer}>Start Counting</button>
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
              <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="share-btn" style={{ width: 'auto', marginTop: 0 }}>
                Share on LinkedIn
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="footer">
        Why track meeting costs? Because time is money. | <a href={shareUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>Share on LinkedIn</a>
      </div>
    </div>
  )
}

export default App
