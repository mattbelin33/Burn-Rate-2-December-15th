import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, Users, Clock, TrendingUp, Download, Share2, Moon, Sun, BarChart3, PieChart, History, Zap, Coffee } from 'lucide-react';

const MeetingCostTracker = () => {
  const [attendees, setAttendees] = useState(4);
  const [avgRate, setAvgRate] = useState(100);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [meetingName, setMeetingName] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [meetingHistory, setMeetingHistory] = useState([]);
  const [roles, setRoles] = useState({
    JR: 1,
    SR: 1,
    VP: 1,
    CEO: 1
  });

  const roleRates = {
    JR: 50,
    SR: 100,
    VP: 150,
    CEO: 250
  };

  const audioContextRef = useRef(null);
  const lastMilestone = useRef(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = JSON.parse(localStorage.getItem('meetingHistory') || '[]');
      setMeetingHistory(saved);
    }
  }, []);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    const cost = calculateCost();
    const milestones = [100, 500, 1000, 2500, 5000];

    milestones.forEach(milestone => {
      if (cost >= milestone && lastMilestone.current < milestone) {
        lastMilestone.current = milestone;
        if (soundEnabled) playSound(milestone);
      }
    });
  }, [elapsedSeconds, soundEnabled]);

  const playSound = (milestone) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = milestone > 1000 ? 800 : 600;
    gainNode.gain.value = 0.1;

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    oscillator.stop(ctx.currentTime + 0.3);
  };

  const calculateCost = () => {
    const totalRate = Object.entries(roles).reduce((sum, [role, count]) => {
      return sum + (roleRates[role] * count);
    }, 0);
    return (totalRate / 3600) * elapsedSeconds;
  };

  const calculateRoleBreakdown = () => {
    const cost = calculateCost();
    const totalRate = Object.entries(roles).reduce((sum, [role, count]) => {
      return sum + (roleRates[role] * count);
    }, 0);

    return Object.entries(roles).map(([role, count]) => ({
      role,
      count,
      rate: roleRates[role],
      cost: (roleRates[role] * count / totalRate) * cost,
      percentage: (roleRates[role] * count / totalRate) * 100
    })).filter(r => r.count > 0);
  };

  const startMeeting = () => {
    setIsRunning(true);
    lastMilestone.current = 0;
  };

  const pauseMeeting = () => {
    setIsRunning(false);
  };

  const saveMeeting = () => {
    const meeting = {
      id: Date.now(),
      name: meetingName || 'Unnamed Meeting',
      date: new Date().toISOString(),
      duration: elapsedSeconds,
      cost: calculateCost(),
      attendees: Object.values(roles).reduce((a, b) => a + b, 0),
      roles: { ...roles }
    };

    const updated = [meeting, ...meetingHistory].slice(0, 10);
    setMeetingHistory(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('meetingHistory', JSON.stringify(updated));
    }
  };

  const resetMeeting = () => {
    setIsRunning(false);
    if (elapsedSeconds > 0 && window.confirm('Save this meeting before resetting?')) {
      saveMeeting();
    }
    setElapsedSeconds(0);
    setMeetingName('');
    lastMilestone.current = 0;
  };

  const exportData = () => {
    const cost = calculateCost();
    const breakdown = calculateRoleBreakdown();
    const data = `
Meeting Cost Summary
===================
Meeting: ${meetingName || 'Unnamed'}
Date: ${new Date().toLocaleString()}
Duration: ${formatTime(elapsedSeconds)}
Total Cost: $${cost.toFixed(2)}

Breakdown by Role:
${breakdown.map(r => `${r.role}: ${r.count} × $${r.rate}/hr = $${r.cost.toFixed(2)}`).join('\n')}

Insights:
- Cost per minute: $${(cost / (elapsedSeconds / 60)).toFixed(2)}
- Equivalent Starbucks coffees: ${Math.floor(cost / 5)}
- Could have bought: ${Math.floor(cost / 15)} lunch meals
    `.trim();

    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-cost-${Date.now()}.txt`;
    a.click();
  };

  const shareToLinkedIn = () => {
    const cost = calculateCost();
    const text = `Just tracked a ${formatTime(elapsedSeconds)} meeting that cost $${cost.toFixed(2)}. Time is money! 💰⏰`;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${encodeURIComponent(text)}`, '_blank');
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getComparison = () => {
    const cost = calculateCost();
    if (cost < 50) return { icon: Coffee, text: `${Math.floor(cost / 5)} Starbucks coffees`, color: 'text-amber-600' };
    if (cost < 200) return { icon: Coffee, text: `${Math.floor(cost / 15)} lunch meals`, color: 'text-orange-600' };
    if (cost < 1000) return { icon: Zap, text: `${Math.floor(cost / 10)} hours of Azure compute`, color: 'text-blue-600' };
    return { icon: TrendingUp, text: 'Approaching monthly salary territory!', color: 'text-red-600' };
  };

  const getMilestoneMessage = () => {
    const cost = calculateCost();
    if (cost >= 5000) return { text: '🚨 CRITICAL BURN RATE', color: 'text-red-600', animate: true };
    if (cost >= 2500) return { text: '⚠️ Expensive Territory', color: 'text-orange-600', animate: true };
    if (cost >= 1000) return { text: '💰 $1K Milestone Hit!', color: 'text-yellow-600', animate: true };
    if (cost >= 500) return { text: '📈 Half a Grand...', color: 'text-blue-600', animate: false };
    return null;
  };

  const getSuggestion = () => {
    const minutes = elapsedSeconds / 60;
    const cost = calculateCost();
    if (minutes > 60) return `Could save $${(cost * 0.3).toFixed(2)} by wrapping up in 45min`;
    if (minutes > 30) return `On track. Consider async updates for routine items`;
    return `Keep it focused - you're doing well!`;
  };

  const cost = calculateCost();
  const breakdown = calculateRoleBreakdown();
  const comparison = getComparison();
  const milestone = getMilestoneMessage();
  const ComparisonIcon = comparison.icon;

  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100';
  const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
  const inputClass = darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300';

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300 p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl md:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Meeting Cost Tracker V4
            </h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              Because time is money, and meetings are expensive
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-lg ${cardClass} shadow-lg hover:scale-105 transition-transform`}
            >
              <History size={20} />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${cardClass} shadow-lg hover:scale-105 transition-transform`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        {/* Main Cost Display */}
        <div className={`${cardClass} rounded-2xl shadow-2xl p-8 mb-6 text-center relative overflow-hidden`}>
          {milestone && (
            <div className={`absolute top-4 right-4 ${milestone.color} font-bold text-sm ${milestone.animate ? 'animate-pulse' : ''}`}>
              {milestone.text}
            </div>
          )}

          <div className="mb-2 text-sm font-medium tracking-wider opacity-60">
            CURRENT MEETING COST
          </div>

          <div className="relative">
            <div className={`text-7xl md:text-9xl font-bold ${isRunning ? 'animate-pulse' : ''}`}
              style={{
                color: cost > 1000 ? '#dc2626' : cost > 500 ? '#ea580c' : '#7c2d12',
                transition: 'color 0.5s ease'
              }}>
              ${cost.toFixed(2)}
            </div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs opacity-50">
              ${(cost / 60).toFixed(2)}/minute
            </div>
          </div>

          <div className="mt-6 flex justify-center items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span className="font-mono text-xl">{formatTime(elapsedSeconds)}</span>
            </div>
            <div className={`flex items-center gap-2 ${comparison.color}`}>
              <ComparisonIcon size={16} />
              <span>{comparison.text}</span>
            </div>
          </div>
        </div>

        {/* Meeting Name */}
        <div className={`${cardClass} rounded-xl shadow-lg p-4 mb-6`}>
          <input
            type="text"
            value={meetingName}
            onChange={(e) => setMeetingName(e.target.value)}
            placeholder="Meeting name (e.g., Q4 Planning Review)"
            className={`w-full px-4 py-2 rounded-lg border ${inputClass} focus:outline-none focus:ring-2 focus:ring-rose-500`}
            disabled={isRunning}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Role Configuration */}
          <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Users size={20} />
              Team Composition
            </h3>
            <div className="space-y-4">
              {Object.entries(roleRates).map(([role, rate]) => (
                <div key={role} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono px-2 py-1 bg-gray-700 text-white rounded">
                      {role}
                    </span>
                    <span className="text-sm opacity-60">${rate}/hr</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRoles({ ...roles, [role]: Math.max(0, roles[role] - 1) })}
                      disabled={isRunning}
                      className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold">{roles[role]}</span>
                    <button
                      onClick={() => setRoles({ ...roles, [role]: roles[role] + 1 })}
                      disabled={isRunning}
                      className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between font-bold">
                <span>Total Attendees:</span>
                <span>{Object.values(roles).reduce((a, b) => a + b, 0)}</span>
              </div>
            </div>
          </div>

          {/* Cost Breakdown Chart */}
          <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <PieChart size={20} />
              Cost Breakdown
            </h3>
            <div className="space-y-3">
              {breakdown.map(item => (
                <div key={item.role} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{item.count}× {item.role} (${item.rate}/hr)</span>
                    <span className="font-bold">${item.cost.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-rose-500 to-pink-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {elapsedSeconds > 0 && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                <div className="font-semibold mb-1">💡 Suggestion:</div>
                <div className="opacity-80">{getSuggestion()}</div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className={`${cardClass} rounded-xl shadow-lg p-6 mb-6`}>
          <div className="flex flex-wrap gap-3 justify-center">
            {!isRunning ? (
              <button
                onClick={startMeeting}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-lg"
              >
                START COUNTING
              </button>
            ) : (
              <button
                onClick={pauseMeeting}
                className="px-8 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-lg"
              >
                PAUSE
              </button>
            )}

            <button
              onClick={resetMeeting}
              className="px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-lg"
            >
              RESET
            </button>

            {elapsedSeconds > 0 && (
              <>
                <button
                  onClick={exportData}
                  className="px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:scale-105 transition-transform shadow-lg flex items-center gap-2"
                >
                  <Download size={20} />
                  EXPORT
                </button>
                <button
                  onClick={shareToLinkedIn}
                  className="px-6 py-4 bg-blue-700 text-white rounded-xl font-bold hover:scale-105 transition-transform shadow-lg flex items-center gap-2"
                >
                  <Share2 size={20} />
                  SHARE
                </button>
              </>
            )}

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-6 py-4 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg ${soundEnabled ? 'bg-purple-600 text-white' : 'bg-gray-300 dark:bg-gray-700'
                }`}
            >
              🔊 {soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Meeting History */}
        {showHistory && meetingHistory.length > 0 && (
          <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <History size={20} />
              Recent Meetings
            </h3>
            <div className="space-y-3">
              {meetingHistory.map(meeting => (
                <div key={meeting.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold">{meeting.name}</div>
                      <div className="text-sm opacity-60">
                        {new Date(meeting.date).toLocaleString()} • {formatTime(meeting.duration)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-rose-600">
                        ${meeting.cost.toFixed(2)}
                      </div>
                      <div className="text-xs opacity-60">
                        {meeting.attendees} attendees
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm opacity-60">
          <p>Track meeting costs in real-time. Built with React & Tailwind CSS.</p>
          <p className="mt-1">🔗 Share on LinkedIn • ⭐ Star on GitHub</p>
        </div>
      </div>
    </div>
  );
};

export default MeetingCostTracker;
