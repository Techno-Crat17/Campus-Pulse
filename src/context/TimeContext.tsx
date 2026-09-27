import React, { createContext, useContext, useState, useEffect } from 'react';
import type { SimulatedTimeState } from '../data/statusEngine';

interface TimeContextType {
  currentTime: Date;
  simulatedTime: SimulatedTimeState;
  setSimulatedTime: React.Dispatch<React.SetStateAction<SimulatedTimeState>>;
  resetToLiveTime: () => void;
  formattedDisplayTime: string;
}

const TimeContext = createContext<TimeContextType | undefined>(undefined);

export const TimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [simulatedTime, setSimulatedTime] = useState<SimulatedTimeState>({
    enabled: false,
    hour: 10,
    minute: 15,
    dayOfWeek: 1 // Monday
  });

  // Auto-refresh live clock every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const resetToLiveTime = () => {
    setSimulatedTime({
      enabled: false,
      hour: 10,
      minute: 15,
      dayOfWeek: 1
    });
  };

  const getDisplayString = (): string => {
    if (simulatedTime.enabled) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = days[simulatedTime.dayOfWeek];
      const hh = String(simulatedTime.hour).padStart(2, '0');
      const mm = String(simulatedTime.minute).padStart(2, '0');
      return `${dayName} ${hh}:${mm} (SIMULATED)`;
    }

    const hh = String(currentTime.getHours()).padStart(2, '0');
    const mm = String(currentTime.getMinutes()).padStart(2, '0');
    return `${hh}:${mm} (LIVE)`;
  };

  return (
    <TimeContext.Provider
      value={{
        currentTime,
        simulatedTime,
        setSimulatedTime,
        resetToLiveTime,
        formattedDisplayTime: getDisplayString()
      }}
    >
      {children}
    </TimeContext.Provider>
  );
};

export const useTimeContext = (): TimeContextType => {
  const context = useContext(TimeContext);
  if (!context) {
    throw new Error('useTimeContext must be used within a TimeProvider');
  }
  return context;
};
