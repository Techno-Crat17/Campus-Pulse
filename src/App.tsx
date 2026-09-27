import { useState } from 'react';
import { MinimalNavbar } from './components/MinimalNavbar';
import { EditorialHero } from './components/EditorialHero';
import { EditorialStatement } from './components/EditorialStatement';
import { EditorialAssistant } from './components/EditorialAssistant';
import { EditorialOccupancy } from './components/EditorialOccupancy';
import { GoogleMapsCampusExplorer } from './components/GoogleMapsCampusExplorer';
import { EditorialRecommender } from './components/EditorialRecommender';
import { EditorialFaculty } from './components/EditorialFaculty';
import { EditorialIssues } from './components/EditorialIssues';
import { EditorialLostFound } from './components/EditorialLostFound';
import { EditorialPredict } from './components/EditorialPredict';
import { EditorialFooter } from './components/EditorialFooter';

import { TimeProvider } from './context/TimeContext';
import { TimeSimulationBar } from './components/TimeSimulationBar';
import { FloatingScrollArrow } from './components/FloatingScrollArrow';
import { ErrorBoundary } from './components/ErrorBoundary';

export function App() {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('ise-lab-2');

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectBuildingForMap = (id: string) => {
    setSelectedBuildingId(id);
    scrollToSection('sec-map');
  };

  return (
    <TimeProvider>
      <div className="min-h-screen bg-[#F5F4EF] text-[#111111] font-sans selection-red relative">
        
        {/* Floating Time Simulation Widget */}
        <TimeSimulationBar />

        {/* Floating Scroll Arrow (Down when near top, Up when scrolling) */}
        <FloatingScrollArrow />

        {/* Minimal Navbar */}
      <MinimalNavbar onNavigateSection={scrollToSection} />

      {/* Main Long-Scrolling Editorial Trajectory */}
      <main className="w-full">
        
        {/* 01. Editorial Hero */}
        <EditorialHero
          onAskClick={() => scrollToSection('sec-ask')}
          onExploreClick={() => scrollToSection('sec-problem')}
        />

        {/* Section 01 — THE PROBLEM */}
        <EditorialStatement />

        {/* Section 02 — ASK (AI Assistant) */}
        <EditorialAssistant
          onSelectBuildingForMap={(id) => {
            setSelectedBuildingId(id);
            scrollToSection('sec-map');
          }}
        />

        {/* Section 03 — SEE (Live Occupancy Giant Numbers Flow) */}
        <EditorialOccupancy />

        {/* Section 04 — REAL GOOGLE MAPS GEOGRAPHIC CAMPUS EXPLORER */}
        <ErrorBoundary
          fallbackTitle="Google Maps Explorer Unavailable"
          fallbackMessage="The interactive Google Maps explorer could not be initialized. All other campus telemetry features and building schedules remain active."
        >
          <GoogleMapsCampusExplorer
            initialNodeId={selectedBuildingId}
          />
        </ErrorBoundary>

        {/* Section 05 — FIND YOUR SPACE (Recommendations) */}
        <EditorialRecommender
          onSelectBuildingForMap={(id) => {
            setSelectedBuildingId(id);
            scrollToSection('sec-map');
          }}
        />

        {/* Section 07 — FACULTY (WHO CAN I MEET?) */}
        <EditorialFaculty onSelectFacultyForMap={handleSelectBuildingForMap} />

        {/* Section 08 — REPORT (Issue Dispatch) */}
        <EditorialIssues />

        {/* Section 08B — LOST & FOUND (Community Recovery Telemetry) */}
        <EditorialLostFound />

        {/* Section 09 — PREDICT (THE CAMPUS LEARNS) */}
        <EditorialPredict />

        {/* Final Section & Footer */}
        <EditorialFooter
          onAskClick={() => scrollToSection('sec-ask')}
          onExploreClick={() => scrollToSection('sec-hero')}
        />

      </main>

    </div>
    </TimeProvider>
  );
}

export default App;
