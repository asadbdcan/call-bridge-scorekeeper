import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, History, Trophy, Target } from 'lucide-react';
import './App.css';

const PLAYER_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
const PLAYER_AVATARS = ['🐯', '🦁', '🐘', '🐫', '🐴', '🐼', '🦓', '🦅'];
const PRESET_NAMES = ['Ashraf', 'Rikon', 'Amin', 'Riad', 'Sabuj', 'Wahid', 'Mamun', 'Jafar'];
const ALL_PLAYERS = PRESET_NAMES.map((name, idx) => ({
  id: idx, name: name, color: PLAYER_COLORS[idx], avatar: PLAYER_AVATARS[idx]
}));

export default function CallBridgeScoreKeeper() {
  const [gameState, setGameState] = useState('setup');
  const [totalLeads, setTotalLeads] = useState(13);
  const [winningScore, setWinningScore] = useState(15);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([0, 1, 2, 3]);
  const [players, setPlayers] = useState([]);
  const [currentRound, setCurrentRound] = useState([]);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [callError, setCallError] = useState('');
  const [scoredError, setScoredError] = useState('');
  const [callsLocked, setCallsLocked] = useState(false);

  useEffect(() => {
    const selectedPlayers = selectedPlayerIds.map(id => ALL_PLAYERS.find(p => p.id === id)).filter(p => p).map(p => ({ ...p, totalScore: 0 }));
    setPlayers(selectedPlayers);
    const maxLeads = Math.floor(52 / selectedPlayers.length);
    if (totalLeads > maxLeads && maxLeads > 0) setTotalLeads(maxLeads);
  }, [selectedPlayerIds, totalLeads]);

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

  const handlePlayerNameChange = (id, name) => setPlayers(players.map(p => p.id === id ? { ...p, name } : p));

  const startGame = () => {
    if (players.some(p => !p.name.trim())) { alert('Please enter all player names'); return; }
    const uniqueNames = new Set(players.map(p => p.name.trim().toLowerCase()));
    if (uniqueNames.size !== players.length) { alert('Player names must be unique'); return; }
    setGameState('playing');
    initializeRound();
  };

  const initializeRound = () => {
    setCurrentRound(players.map(p => ({ playerId: p.id, call: '', scored: '' })));
    setCallError(''); setScoredError(''); setCallsLocked(false);
  };

  const adjustValue = (playerId, field, delta) => {
    setCurrentRound(prev => {
      let maxScored = totalLeads;
      if (field === 'scored') {
        const totalCalls = prev.reduce((sum, r) => sum + (r.call === '' ? 0 : parseInt(r.call)), 0);
        const currentTotalScored = prev.reduce((sum, r) => r.playerId === playerId ? sum : sum + (r.scored === '' ? 0 : parseInt(r.scored)), 0);
        maxScored = Math.min(totalLeads, totalCalls - currentTotalScored);
      }
      const updatedRound = prev.map(r => {
        if (r.playerId === playerId) {
          const currentVal = r[field] === '' ? 0 : parseInt(r[field]);
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

  const handleDirectInput = (playerId, field, value) => {
    let numValue = value === '' ? '' : Math.max(0, Math.min(totalLeads, parseInt(value) || 0));
    setCurrentRound(prev => {
      if (field === 'scored' && numValue !== '') {
        const totalCalls = prev.reduce((sum, r) => sum + (r.call === '' ? 0 : parseInt(r.call)), 0);
        const currentTotalScored = prev.reduce((sum, r) => r.playerId === playerId ? sum : sum + (r.scored === '' ? 0 : parseInt(r.scored)), 0);
        numValue = Math.min(numValue, totalCalls - currentTotalScored);
      }
      const updatedRound = prev.map(r => r.playerId === playerId ? { ...r, [field]: numValue } : r);
      if (field === 'call') setCallError('');
      if (field === 'scored') setScoredError('');
      return updatedRound;
    });
  };

  const calculateRoundScore = (call, scored) => {
    const callNum = call === '' ? 0 : parseInt(call);
    const scoredNum = scored === '' ? 0 : parseInt(scored);
    if (callNum === 0 && scoredNum > 0) return -scoredNum;
    const halfOrMore = callNum >= totalLeads / 2;
    if (scoredNum > callNum) return halfOrMore ? -(callNum + 2) : -callNum;
    else if (scoredNum === callNum) return halfOrMore ? callNum + 2 : callNum;
    else return halfOrMore ? -(callNum + 2) : -callNum;
  };

  const lockCalls = () => {
    if (currentRound.some(r => r.call === '')) { alert('Please enter call values for all players'); return; }
    const totalCalls = currentRound.reduce((sum, r) => sum + parseInt(r.call), 0);
    const minCalls = totalLeads - 2; const maxCalls = totalLeads + 4;
    if (totalCalls < minCalls || totalCalls > maxCalls) { 
      setCallError(`Total calls must be between ${minCalls} and ${maxCalls}`);
      alert(`Total calls must be between ${minCalls} and ${maxCalls}`); 
      return; 
    }
    setCallError('');
    setCallsLocked(true);
  };

  const submitRound = () => {
    if (!callsLocked) { alert('Please lock calls before submitting the round'); return; }
    if (currentRound.some(r => r.scored === '')) { alert('Please enter scored values for all players'); return; }
    const totalScored = currentRound.reduce((sum, r) => sum + parseInt(r.scored), 0);
    const totalCalls = currentRound.reduce((sum, r) => sum + parseInt(r.call), 0);
    if (totalScored > totalCalls) { alert(`Total scored (${totalScored}) cannot exceed total calls (${totalCalls})`); return; }
    if (totalScored !== totalLeads) { alert(`Total scored must equal ${totalLeads} leads`); return; }
    const roundResults = currentRound.map(r => ({ ...r, call: parseInt(r.call), scored: parseInt(r.scored), roundScore: calculateRoundScore(r.call, r.scored) }));
    const updatedPlayers = players.map(p => {
      const result = roundResults.find(r => r.playerId === p.id);
      return { ...p, totalScore: p.totalScore + result.roundScore };
    });
    setPlayers(updatedPlayers);
    setScoreHistory([...scoreHistory, roundResults]);
    const winner = updatedPlayers.find(p => p.totalScore >= winningScore);
    if (winner) setGameState('finished'); else initializeRound();
  };

  const resetGame = () => {
    setGameState('setup');
    setPlayers(players.map(p => ({ ...p, totalScore: 0 })));
    setScoreHistory([]); setCurrentRound([]); setShowHistory(false);
  };

  if (gameState === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-6 mb-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full mb-3">
                <Trophy className="text-white" size={40} />
              </div>
              <h1 className="text-3xl font-black text-gray-800">Call Bridge</h1>
              <p className="text-gray-500 text-sm">Score Keeper</p>
            </div>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-2xl p-4">
                <label className="block text-sm font-bold text-gray-700 mb-3">Select Players ({players.length} selected)</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_PLAYERS.map((player) => {
                    const isSelected = selectedPlayerIds.includes(player.id);
                    return (
                      <button key={player.id} onClick={() => togglePlayerSelection(player.id)}
                        className={`p-3 rounded-xl transition-all ${isSelected ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg scale-105' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex-shrink-0 shadow flex items-center justify-center text-xl ${isSelected ? 'opacity-100' : 'opacity-60'}`}
                            style={{ backgroundColor: isSelected ? 'white' : player.color }}>{player.avatar}</div>
                          <span className="font-bold text-sm truncate">{player.name}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
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
                <p className="text-xs text-gray-500 mt-2 text-center">Max: {players.length > 0 ? Math.floor(52 / players.length) : 0} (52 ÷ {players.length} players)</p>
              </div>
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
              {players.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Edit Player Names (Optional)</label>
                  <div className="space-y-2">
                    {players.map((player) => (
                      <div key={player.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex-shrink-0 shadow-lg flex items-center justify-center text-2xl" style={{ backgroundColor: player.color }}>{player.avatar}</div>
                        <input type="text" value={player.name} onChange={(e) => handlePlayerNameChange(player.id, e.target.value)}
                          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-lg font-semibold" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={startGame} disabled={players.length < 3}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed">
                <Play size={24} fill="white" />Start Game
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    const winner = players.reduce((max, p) => p.totalScore > max.totalScore ? p : max, players[0]);
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-400 via-orange-400 to-pink-500 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4 animate-bounce">🏆</div>
              <h1 className="text-3xl font-black text-gray-800 mb-2">Victory!</h1>
              <div className="inline-block w-20 h-20 rounded-full mb-3 shadow-xl flex items-center justify-center text-4xl" style={{ backgroundColor: winner.color }}>{winner.avatar}</div>
              <h2 className="text-2xl font-bold text-gray-700 mb-1">{winner.name}</h2>
              <p className="text-4xl font-black bg-gradient-to-r from-amber-500 to-pink-500 bg-clip-text text-transparent">{winner.totalScore}</p>
            </div>
            <div className="space-y-2 mb-6">
              {[...players].sort((a, b) => b.totalScore - a.totalScore).map((player, idx) => (
                <div key={player.id} className="flex items-center gap-3 p-4 rounded-2xl shadow-lg" style={{ backgroundColor: `${player.color}30` }}>
                  <span className="text-2xl font-black text-gray-600 w-8">#{idx + 1}</span>
                  <div className="w-12 h-12 rounded-full shadow-md flex items-center justify-center text-2xl" style={{ backgroundColor: player.color }}>{player.avatar}</div>
                  <span className="font-bold text-lg flex-1">{player.name}</span>
                  <span className="text-2xl font-black text-gray-800">{player.totalScore}</span>
                </div>
              ))}
            </div>
            <button onClick={resetGame} className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
              <RotateCcw size={24} />New Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4 pb-24">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-black text-gray-800">Round {scoreHistory.length + 1}</h1>
            <div className="flex gap-2">
              <button onClick={() => setShowHistory(!showHistory)}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-xl font-bold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg active:scale-95">
                <History size={18} />
              </button>
              <button onClick={resetGame}
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-xl font-bold hover:from-red-600 hover:to-pink-600 transition-all shadow-lg active:scale-95">
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {players.map(player => (
              <div key={player.id} className="p-3 rounded-2xl shadow-lg" style={{ backgroundColor: `${player.color}30` }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full shadow flex items-center justify-center text-sm" style={{ backgroundColor: player.color }}>{player.avatar}</div>
                  <span className="font-bold text-sm truncate">{player.name}</span>
                </div>
                <div className="text-3xl font-black text-gray-800">{player.totalScore}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-3xl shadow-2xl p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-xs font-bold text-gray-500 mb-1">TOTAL CALLS</div>
              <div className="text-3xl font-black text-emerald-600">
                {currentRound.reduce((sum, r) => sum + (r.call === '' ? 0 : parseInt(r.call)), 0)}/{totalLeads}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs font-bold text-gray-500 mb-1">TOTAL SCORED</div>
              <div className={`text-3xl font-black ${currentRound.reduce((sum, r) => sum + (r.scored === '' ? 0 : parseInt(r.scored)), 0) > totalLeads ? 'text-red-600' : 'text-cyan-600'}`}>
                {currentRound.reduce((sum, r) => sum + (r.scored === '' ? 0 : parseInt(r.scored)), 0)}/{totalLeads}
              </div>
            </div>
          </div>
        </div>
        {callsLocked && callError && <div className="bg-red-500 text-white px-4 py-3 rounded-2xl mb-4 font-bold shadow-lg">{callError}</div>}
        
        {showHistory && scoreHistory.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowHistory(false)}>
            <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-4xl w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-800">Score History</h2>
                <button onClick={() => setShowHistory(false)} className="w-10 h-10 bg-gray-200 rounded-full font-bold text-xl hover:bg-gray-300 active:scale-95 transition-transform">×</button>
              </div>
              <div className="overflow-auto flex-1">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr>
                      <th className="text-left p-3 font-black text-gray-700 bg-gradient-to-r from-emerald-100 to-cyan-100 rounded-tl-xl">Round</th>
                      {players.map((player, idx) => (
                        <th key={player.id} className={`text-center p-3 bg-gradient-to-r from-emerald-100 to-cyan-100 ${idx === players.length - 1 ? 'rounded-tr-xl' : ''}`}>
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-10 h-10 rounded-full shadow-md flex items-center justify-center text-2xl" style={{ backgroundColor: player.color }}>{player.avatar}</div>
                            <span className="font-black text-xs text-gray-700">{player.name}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scoreHistory.map((round, roundIdx) => (
                      <tr key={roundIdx} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-bold text-gray-700">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-black text-sm">{roundIdx + 1}</div>
                          </div>
                        </td>
                        {players.map(player => {
                          const result = round.find(r => r.playerId === player.id);
                          const isBonus = result.call >= totalLeads / 2 && result.scored === result.call;
                          const isPenalty = result.roundScore < 0;
                          return (
                            <td key={player.id} className="p-3">
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <span className="font-semibold">Call:</span>
                                  <span className="font-black">{result.call}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <span className="font-semibold">Got:</span>
                                  <span className="font-black">{result.scored}</span>
                                </div>
                                <div className={`px-3 py-1 rounded-full font-black text-sm ${isPenalty ? 'bg-red-100 text-red-700' : isBonus ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                  {result.roundScore >= 0 ? '+' : ''}{result.roundScore}{isBonus && ' 🎯'}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    <tr className="bg-gradient-to-r from-emerald-100 to-cyan-100 font-black sticky bottom-0">
                      <td className="p-3 text-gray-800 rounded-bl-xl">TOTAL</td>
                      {players.map((player, idx) => (
                        <td key={player.id} className={`p-3 text-center ${idx === players.length - 1 ? 'rounded-br-xl' : ''}`}>
                          <div className="text-2xl font-black text-gray-800">{player.totalScore}</div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {currentRound.map(round => {
            const player = players.find(p => p.id === round.playerId);
            return (
              <div key={round.playerId} className="bg-white rounded-3xl shadow-2xl p-4" style={{ borderLeft: `6px solid ${player.color}` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-2xl" style={{ backgroundColor: player.color }}>{player.avatar}</div>
                  <span className="font-black text-lg">{player.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><Target size={14} />CALL</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => adjustValue(round.playerId, 'call', -1)} disabled={callsLocked}
                        className="w-10 h-10 bg-gray-100 rounded-xl font-bold text-lg text-gray-600 hover:bg-gray-200 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed">−</button>
                      <input type="number" min="0" max={totalLeads} value={round.call} onChange={(e) => handleDirectInput(round.playerId, 'call', e.target.value)} disabled={callsLocked}
                        className="flex-1 text-center text-2xl font-black py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" />
                      <button onClick={() => adjustValue(round.playerId, 'call', 1)} disabled={callsLocked}
                        className="w-10 h-10 bg-gray-100 rounded-xl font-bold text-lg text-gray-600 hover:bg-gray-200 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed">+</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><Trophy size={14} />SCORED</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => adjustValue(round.playerId, 'scored', -1)}
                        className="w-10 h-10 bg-gray-100 rounded-xl font-bold text-lg text-gray-600 hover:bg-gray-200 active:scale-95 transition-transform">−</button>
                      <input type="number" min="0" max={totalLeads} value={round.scored} onChange={(e) => handleDirectInput(round.playerId, 'scored', e.target.value)}
                        className="flex-1 text-center text-2xl font-black py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent" />
                      <button onClick={() => adjustValue(round.playerId, 'scored', 1)}
                        className="w-10 h-10 bg-gray-100 rounded-xl font-bold text-lg text-gray-600 hover:bg-gray-200 active:scale-95 transition-transform">+</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-900 to-transparent">
          <div className="max-w-md mx-auto">
            {!callsLocked ? (
              <button onClick={lockCalls}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-2xl font-black text-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-2">
                🔒 Lock Calls
              </button>
            ) : (
              <button onClick={submitRound}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-4 rounded-2xl font-black text-lg hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-2">
                <Play size={24} fill="white" />Submit Round
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}