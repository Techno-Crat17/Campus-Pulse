import React from 'react';
import { useTimeContext } from '../context/TimeContext';

/**
 * Runtime Clock / Time Simulation Component.
 * Visual rendering is hidden from the user per specification:
 * - Internal time calculation and dynamic state updates continue running.
 * - Library opening/closing logic, dynamic occupancy, and faculty status continue using current time.
 * - No empty space, overlay, or placeholder is rendered.
 */
export const TimeSimulationBar: React.FC = () => {
  // Keep hook active to preserve any context integration
  useTimeContext();

  return null;
};

// Component alias in case referenced as RuntimeClock
export const RuntimeClock: React.FC = TimeSimulationBar;
