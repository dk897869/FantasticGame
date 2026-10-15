import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [gameState30s, setGameState30s] = useState({
    gameType: 'wingo_30s',
    period: '---',
    timeLeft: 30,
    isFrozen: false
  });
  const [gameState1m, setGameState1m] = useState({
    gameType: 'wingo_1m',
    period: '---',
    timeLeft: 60,
    isFrozen: false
  });
  const [lastRoundResult, setLastRoundResult] = useState(null);

  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api', '') 
      : 'http://localhost:5000';

    const s = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    s.on('connect', () => {
      console.log('Connected to Game Socket');
    });

    s.on('timer_tick_wingo_30s', (data) => {
      setGameState30s(data);
    });

    s.on('timer_tick_wingo_1m', (data) => {
      setGameState1m(data);
    });

    // Fallback for general tick
    s.on('timer_tick', (data) => {
      if (data.gameType === 'wingo_30s') setGameState30s(data);
      else setGameState1m(data);
    });

    s.on('round_settled', (data) => {
      setLastRoundResult(data);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, gameState30s, gameState1m, lastRoundResult }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
