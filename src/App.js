// ====================================================================
// FILE: src/App.js
// Complete Call Bridge Score Keeper - Latest Version
// ====================================================================

import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, History, Trophy } from 'lucide-react';

const PLAYER_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
const PLAYER_AVATARS = ['🐯', '🦁', '🐘', '🐫', '🐴', '🐼', '🦓', '🦅'];
const PRESET_NAMES = ['Ashraf', 'Rikon', 'Amin', 'Riad', 'Sabuj', 'Wahid', 'Mamun', 'Jafar'];
const ALL_PLAYERS = PRESET_NAMES.map((name, idx) => ({
  id: idx, name: name, color: PLAYER_COLORS[idx], avatar: PLAYER_AVATARS[idx]
}));

export default function App() {
  // State management
  const [gameState, setGameState] = useState('setup');
  const [totalLeads, setTotalLeads] = useState(13);
  const [winningScore, setWinningScore] = useState(15);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([0, 1, 2, 3]);
  const [players, setPlayers] = useState([]);
  const [currentRound, setCurrentRound] = useState([]);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [callError, setCallError] = useState('');
  const [scoredError, setScoredError] = useState('');
  const [callsLocked, setCallsLocked] = useState(false);

  // Update players when selection changes
  useEffect(() => {
    const selectedPlayers = selectedPlayerIds.map(id => ALL_PLAYERS.find(p => p.id === id)).filter(p => p).map(p => ({ ...p, totalScore: 0 }));
    setPlayers(selectedPlayers);
    const maxLeads = Math.floor(52 / selectedPlayers.length);
    if (totalLeads > maxLeads && maxLeads > 0) setTotalLeads(maxLeads);
  }, [selectedPlayerIds, totalLeads]);

  // Player selection toggle
  const togglePlayerSelection = (playerId) => {
    setSelectedPlayerIds(prev => {
      if (prev.includes(playerId)) {
        if (prev.length <= 3) { alert('You need at least 3 players'); return prev; }
        return prev.filter(id => id !== playerId);
      } else {
        if (prev.length >= 8) { alert('Maximum 8 players allowed'); return prev; }
        return [...prev, playerId].sort((a, b) => a - b);
      }
    });
  };

  // Handle player name change (max 6 chars, alphanumeric only)
  const handlePlayerNameChange = (id, name) => {
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '');
    const limitedName = cleanName.slice(0, 6);
    setPlayers(players.map(p => p.id === id ? { ...p, name: limitedName } : p));
  };

  // Start game validation
  const startGame = () => {
    if (players.some(p => !p.name.trim())) { alert('Please enter all player names'); return; }
    const uniqueNames = new Set(players.map(p => p.name.trim().toLowerCase()));
    if (uniqueNames.size !== players.length) { alert('Player names must be unique'); return; }
    setGameState('playing');
    initializeRound();
  };

  // Initialize new round
  const initializeRound = () => {
    setCurrentRound(players.map(p => ({ playerId: p.id, call: 0, scored: 0 })));
    setCallError(''); setScoredError(''); setCallsLocked(false);
  };

  // Adjust call/scored values with +/- buttons
  const adjustValue = (playerId, field, delta) => {
    setCurrentRound(prev => {
      let maxScored = totalLeads;
      if (field === 'scored') {
        const currentTotalScored = prev.reduce((sum, r) => r.playerId === playerId ? sum : sum + (typeof r.scored === 'number' ? r.scored : 0), 0);
        maxScored = totalLeads - currentTotalScored;
      }
      const updatedRound = prev.map(r => {
        if (r.playerId === playerId) {
          const currentVal = typeof r[field] === 'number' ? r[field] : 0;
          let newVal = Math.max(0, Math.min(field === 'scored' ? maxScored : totalLeads, currentVal + delta));
          return { ...r, [field]: newVal };
        }
        return r;
      });
      if (field === 'call') setCallError('');
      if (field === 'scored') setScoredError('');
      return updatedRound;
    });
  };

  // Handle direct input in number fields
  const handleDirectInput = (playerId, field, value) => {
    let numValue = value === '' ? 0 : Math.max(0, Math.min(totalLeads, parseInt(value) || 0));
    setCurrentRound(prev => {
      if (field === 'scored' && numValue !== 0) {
        const currentTotalScored = prev.reduce((sum, r) => r.playerId === playerId ? sum : sum + (typeof r.scored === 'number' ? r.scored : 0), 0);
        numValue = Math.min(numValue, totalLeads - currentTotalScored);
      }
      const updatedRound = prev.map(r => r.playerId === playerId ? { ...r, [field]: numValue } : r);
      if (field === 'call') setCallError('');
      if (field === 'scored') setScoredError('');
      return updatedRound;
    });
  };

  // Calculate round score based on call and scored
  const calculateRoundScore = (call, scored) => {
    const callNum = typeof call === 'number' ? call : parseInt(call);
    const scoredNum = typeof scored === 'number' ? scored : parseInt(scored);
    if (callNum === 0 && scoredNum > 0) return -scoredNum;
    const halfOrMore = callNum >= totalLeads / 2;
    if (scoredNum > callNum) return halfOrMore ? -(callNum + 2) : -callNum;
    else if (scoredNum === callNum) return halfOrMore ? callNum + 2 : callNum;
    else return halfOrMore ? -(callNum + 2) : -callNum;
  };

  // Lock calls validation
  const lockCalls = () => {
    const totalCalls = currentRound.reduce((sum, r) => sum + (typeof r.call === 'number' ? r.call : 0), 0);
    const minCalls = totalLeads - 2; 
    const maxCalls = totalLeads + 4;
    if (totalCalls < minCalls || totalCalls > maxCalls) { 
      setCallError(`Total calls must be between ${minCalls} and ${maxCalls}`);
      alert(`Total calls must be between ${minCalls} and ${maxCalls}`); 
      return; 
    }
    setCallError('');
    setCallsLocked(true);
  };

  // Submit round and calculate scores
  const submitRound = () => {
    if (!callsLocked) { alert('Please lock calls before submitting the round'); return; }
    const totalScored = currentRound.reduce((sum, r) => sum + (typeof r.scored === 'number' ? r.scored : 0), 0);
    if (totalScored !== totalLeads) { alert(`Total scored must equal ${totalLeads} leads`); return; }
    const roundResults = currentRound.map(r => ({ 
      ...r, 
      call: typeof r.call === 'number' ? r.call : parseInt(r.call), 
      scored: typeof r.scored === 'number' ? r.scored : parseInt(r.scored), 
      roundScore: calculateRoundScore(r.call, r.scored) 
    }));
    const updatedPlayers = players.map(p => {
      const result = roundResults.find(r => r.playerId === p.id);
      return { ...p, totalScore: p.totalScore + result.roundScore };
    });
    setPlayers(updatedPlayers);
    setScoreHistory([...scoreHistory, roundResults]);
    const winner = updatedPlayers.find(p => p.totalScore >= winningScore);
    if (winner) setGameState('finished'); else initializeRound();
  };

  // Reset game handler
  const handleResetGame = () => {
    setGameState('setup');
    setPlayers(players.map(p => ({ ...p, totalScore: 0 })));
    setScoreHistory([]);
    setCurrentRound([]);
    setShowHistory(false);
    setSelectedPlayerId(null);
    setShowResetConfirm(false);
  };

  // Share victory handler
  const handleShareVictory = async () => {
    const winner = players.reduce((max, p) => p.totalScore > max.totalScore ? p : max, players[0]);
    const sortedPlayers = [...players].sort((a, b) => b.totalScore - a.totalScore);
    const shareText = `🏆 Call Bridge Victory!\n\nWinner: ${winner.name} ${winner.avatar}\nScore: ${winner.totalScore} points\n\n📊 Final Rankings:\n${sortedPlayers.map((p, i) => `#${i+1} ${p.avatar} ${p.name}: ${p.totalScore} pts`).join('\n')}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Call Bridge Victory!',
          text: shareText
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        alert('Victory results copied to clipboard! You can now paste and share.');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          alert('Victory results copied to clipboard! You can now paste and share.');
        } catch (err) {
          alert('Unable to copy. Please screenshot the results to share.');
        }
        document.body.removeChild(textArea);
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      alert('Unable to share. Please screenshot the results to share.');
    }
  };

  // RENDER: Setup Screen
  if (gameState === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-6 mb-4">
            {/* Header with Info Button */}
            <div className="text-center mb-5">
              <button 
                onClick={() => setShowRules(true)}
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full mb-2 hover:from-emerald-500 hover:to-cyan-500 transition-all active:scale-95 shadow-md relative"
                title="Game Rules">
                <Trophy className="text-white" size={32} />
                <span className="absolute bottom-0 right-0 w-5 h-5 bg-white rounded-full flex items-center justify-center text-emerald-600 font-black text-xs shadow-md" style={{ fontStyle: 'italic' }}>
                  i
                </span>
              </button>
              <h1 className="text-2xl font-black text-gray-800">Call Bridge</h1>
              <p className="text-gray-500 text-xs">Score Keeper</p>
            </div>

            <div className="space-y-4">
              {/* Player Selection */}
              <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-2xl p-4">
                <label className="block text-sm font-bold text-gray-700 mb-3">Select Players</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_PLAYERS.map((player) => {
                    const isSelected = selectedPlayerIds.includes(player.id);
                    const selectedPlayer = players.find(p => p.id === player.id);
                    return (
                      <div key={player.id}
                        className={`p-3 rounded-xl transition-all ${isSelected ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                        <div className="flex items-center gap-2">
                          <button onClick={() => togglePlayerSelection(player.id)} className="flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full shadow flex items-center justify-center text-xl ${isSelected ? 'opacity-100' : 'opacity-60'}`}
                              style={{ backgroundColor: isSelected ? 'white' : player.color }}>{player.avatar}</div>
                          </button>
                          {isSelected && selectedPlayer ? (
                            <input
                              type="text"
                              value={selectedPlayer.name}
                              onChange={(e) => handlePlayerNameChange(player.id, e.target.value)}
                              maxLength={6}
                              className="flex-1 px-2 py-0 bg-white bg-opacity-90 text-gray-800 border-0 rounded font-bold text-sm focus:ring-1 focus:ring-white min-w-0"
                              style={{ height: '24px', lineHeight: '24px' }}
                              placeholder="Name"
                            />
                          ) : (
                            <button onClick={() => togglePlayerSelection(player.id)} className="flex-1 text-left min-w-0">
                              <span className="font-bold text-sm truncate block">{player.name}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Leads per Round */}
              <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-2xl p-4">
                <label className="block text-sm font-bold text-gray-700 mb-3">Leads per Round</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setTotalLeads(Math.max(1, totalLeads - 1))}
                    className="w-12 h-12 bg-white rounded-xl font-bold text-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-transform shadow">−</button>
                  <div className="flex-1 bg-white rounded-xl h-12 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-800">{totalLeads}</span>
                  </div>
                  <button onClick={() => setTotalLeads(Math.min(Math.floor(52 / players.length), totalLeads + 1))} disabled={players.length === 0}
                    className="w-12 h-12 bg-white rounded-xl font-bold text-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-transform shadow disabled:opacity-50">+</button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Total Players: {players.length} | Total Cards: {players.length > 0 ? players.length * totalLeads : 0}
                </p>
              </div>

              {/* Winning Score */}
              <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-2xl p-4">
                <label className="block text-sm font-bold text-gray-700 mb-3">Winning Score (10-20)</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setWinningScore(Math.max(10, winningScore - 5))}
                    className="w-12 h-12 bg-white rounded-xl font-bold text-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-transform shadow">−</button>
                  <div className="flex-1 bg-white rounded-xl h-12 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-800">{winningScore}</span>
                  </div>
                  <button onClick={() => setWinningScore(Math.min(20, winningScore + 5))}
                    className="w-12 h-12 bg-white rounded-xl font-bold text-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-transform shadow">+</button>
                </div>
              </div>

              {/* Start Game Button */}
              <button onClick={startGame} disabled={players.length < 3}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed">
                <Play size={24} fill="white" />Start Game
              </button>
            </div>
          </div>
        </div>
        
        {/* Rules Modal */}
        {showRules && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowRules(false)}>
            <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-black text-gray-800">📖 Quick Rules</h2>
                <button onClick={() => setShowRules(false)} className="w-8 h-8 bg-gray-200 rounded-full font-bold text-lg hover:bg-gray-300 active:scale-95 transition-transform">×</button>
              </div>
              
              <div className="space-y-3 text-sm text-gray-700">
                <div className="bg-emerald-50 p-3 rounded-xl">
                  <p className="font-bold text-emerald-700 mb-1">🎯 Gameplay</p>
                  <p>1. Players predict leads (call)</p>
                  <p>2. Lock calls → Play round</p>
                  <p>3. Enter actual scored leads</p>
                  <p>4. Submit to calculate scores</p>
                </div>

                <div className="bg-cyan-50 p-3 rounded-xl">
                  <p className="font-bold text-cyan-700 mb-2">🏆 Scoring</p>
                  <div className="space-y-1 text-xs">
                    <p>✓ <strong>Match call (≥ half leads):</strong> +call +2 🎯</p>
                    <p>✗ <strong>Miss call (≥ half leads):</strong> -(call +2)</p>
                    <p>✓ <strong>Match call (&lt; half leads):</strong> +call</p>
                    <p>✗ <strong>Miss call (&lt; half leads):</strong> -call</p>
                  </div>
                </div>

                <div className="bg-amber-50 p-3 rounded-xl">
                  <p className="font-bold text-amber-700 mb-1">💡 Examples (10 leads)</p>
                  <div className="text-xs space-y-0.5">
                    <p>Call 5, Score 5 → <span className="text-green-600 font-bold">+7 pts</span> 🎯</p>
                    <p>Call 5, Score 4 → <span className="text-red-600 font-bold">-7 pts</span></p>
                    <p>Call 3, Score 3 → <span className="text-green-600 font-bold">+3 pts</span></p>
                    <p>Call 3, Score 4 → <span className="text-red-600 font-bold">-3 pts</span></p>
                    <p>Call 3, Score 2 → <span className="text-red-600 font-bold">-3 pts</span></p>
                    <p>Call 0, Score 1 → <span className="text-red-600 font-bold">-1 pt</span></p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setShowRules(false)}
                className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-2.5 rounded-xl font-bold text-sm hover:from-emerald-600 hover:to-cyan-600 transition-all active:scale-95">
                Got It!
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // CONTINUED IN NEXT PART...
  // Victory screen and Playing screen follow
  // Copy the rest from the main artifact

  return null;
}