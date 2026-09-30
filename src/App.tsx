import { Routes, Route, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { MinimalNavbar } from './components/MinimalNavbar';
import { GoogleMapsCampusExplorer } from './components/GoogleMapsCampusExplorer';
import { EditorialAssistant } from './components/EditorialAssistant';
import { EditorialRecommender } from './components/EditorialRecommender';
import { EditorialFaculty } from './components/EditorialFaculty';
import { EditorialIssues } from './components/EditorialIssues';
import { EditorialLostFound } from './components/EditorialLostFound';
import { EditorialOthers } from './components/EditorialOthers';
import { EditorialFooter } from './components/EditorialFooter';
import { HomePage } from './pages/HomePage';

import { ThemeProvider } from './context/ThemeContext';
import { TimeProvider } from './context/TimeContext';
import { TimeSimulationBar } from './components/TimeSimulationBar';
import { FloatingScrollArrow } from './components/FloatingScrollArrow';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { ScrollToTop } from './components/ScrollToTop';

/**
 * Route wrapper for /map that reads optional search parameters:
 * e.g., /map?building=ise_hod_office
 */
function MapRouteWrapper() {
  const [searchParams] = useSearchParams();
  const buildingId = searchParams.get('building') || searchParams.get('nodeId') || 'ise-lab-2';

  return (
    <ErrorBoundary
      fallbackTitle="Google Maps Explorer Unavailable"
      fallbackMessage="The interactive Google Maps explorer could not be initialized. All other campus telemetry features and building schedules remain active."
    >
      <GoogleMapsCampusExplorer initialNodeId={buildingId} />
    </ErrorBoundary>
  );
}

/**
 * 404 Not Found Route Component
 */
function NotFoundRoute() {
  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center text-center p-8 font-mono space-y-6">
      <div className="text-6xl font-syne font-black text-[#DC2626]">404</div>
      <h1 className="text-2xl sm:text-4xl font-syne font-extrabold uppercase text-[#111111] dark:text-[#F3F3EE] tracking-tight">
        PAGE NOT FOUND
      </h1>
      <p className="text-xs sm:text-sm text-[#666660] dark:text-[#9CA3AF] max-w-md leading-relaxed">
        The route you are trying to access does not exist or has moved. Return to the home dashboard to continue exploring Campus Pulse.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-[#111111] dark:bg-white text-white dark:text-[#111111] font-bold text-xs uppercase tracking-widest hover:bg-[#DC2626] dark:hover:bg-[#DC2626] dark:hover:text-white transition-colors shadow-xs"
      >
        GO TO HOME DASHBOARD →
      </Link>
    </div>
  );
}

export function App() {
  const navigate = useNavigate();

  const handleSelectBuildingForMap = (id: string) => {
    navigate(`/map?building=${id}`);
  };

  return (
    <ThemeProvider>
      <TimeProvider>
        <div className="min-h-screen bg-[#F5F4EF] dark:bg-[#0E0F12] text-[#111111] dark:text-[#F3F3EE] font-sans selection-red relative transition-colors duration-200">
          {/* ScrollToTop component scrolls window to top on every route change */}
          <ScrollToTop />

          {/* PWA Mobile/Tablet Install Prompt */}
          <PwaInstallPrompt />

          {/* Floating Time Simulation Widget */}
          <TimeSimulationBar />

          {/* Floating Scroll Arrow */}
          <FloatingScrollArrow />

          {/* Route-Aware Minimal Navbar */}
          <MinimalNavbar />

          {/* Main Application Routes Container */}
          <main className="w-full pt-20 sm:pt-24">
            <Routes>
              {/* / -> Home Dashboard */}
              <Route path="/" element={<HomePage />} />

              {/* /map -> Geographic Campus Map Explorer */}
              <Route path="/map" element={<MapRouteWrapper />} />

              {/* /faculty -> Faculty Directory & Dynamic Status */}
              <Route
                path="/faculty"
                element={
                  <EditorialFaculty
                    onSelectFacultyForMap={handleSelectBuildingForMap}
                  />
                }
              />

              {/* /libraries -> Campus Libraries & Study Spaces */}
              <Route
                path="/libraries"
                element={
                  <EditorialRecommender
                    onSelectBuildingForMap={handleSelectBuildingForMap}
                  />
                }
              />

              {/* /ask-ai -> Ask Campus AI Chat Engine */}
              <Route
                path="/ask-ai"
                element={
                  <EditorialAssistant
                    onSelectBuildingForMap={handleSelectBuildingForMap}
                  />
                }
              />

              {/* /issues -> Anonymous Issue Dispatch Queue */}
              <Route path="/issues" element={<EditorialIssues />} />

              {/* /others -> Announcements, Events, Clubs, Emergency Contacts & Lost & Found */}
              <Route
                path="/others"
                element={
                  <div className="space-y-12">
                    <EditorialOthers
                      onNavigateSection={(sectionId) => {
                        const routeMap: Record<string, string> = {
                          'sec-faculty': '/faculty',
                          'sec-find': '/libraries',
                          'sec-map': '/map',
                          'sec-report': '/issues',
                          'sec-ask': '/ask-ai',
                          'sec-others': '/others',
                          'sec-hero': '/'
                        };
                        navigate(routeMap[sectionId] || '/others');
                      }}
                    />
                    <EditorialLostFound />
                  </div>
                }
              />

              {/* 404 Fallback */}
              <Route path="*" element={<NotFoundRoute />} />
            </Routes>
          </main>

          {/* Persistent Footer on Every Route */}
          <EditorialFooter />

        </div>
      </TimeProvider>
    </ThemeProvider>
  );
}

export default App;
