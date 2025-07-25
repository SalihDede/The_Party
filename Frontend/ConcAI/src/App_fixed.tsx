import { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Stats } from '@react-three/drei';
import StepNavigator from './components/StepNavigator';
import UrlInput from './components/UrlInput';

import Scene from './components/Scene';
import { CinemaUI } from './components/CinemaUI';
import CinemaSeatSelector from './components/CinemaSeatSelector';
import './App.css';

interface Step {
  id: number;
  title: string;
  isCompleted: boolean;
  isActive: boolean;
}

interface CinemaSeat {
  id: number;
  row: number;
  seatNumber: number;
  position: { x: number; y: number; z: number };
  rotation: number;
  isSelected: boolean;
}

// Helper function to create amphitheater seating
const createAmphitheaterSeating = (): CinemaSeat[] => {
  const seats: CinemaSeat[] = []
  const centerPoint = { x: 0, y: 0, z: -12 }
  const seatsPerRow = [6, 9, 12, 15, 18]
  const baseRadius = 8
  const radiusIncrement = 2.5
  
  let seatIdCounter = 1
  
  seatsPerRow.forEach((seatCount, rowIndex) => {
    const radius = baseRadius + (rowIndex * radiusIncrement)
    const angleRange = Math.PI * 0.85
    const angleStart = -angleRange / 2
    const angleStep = angleRange / (seatCount - 1)
    
    for (let i = 0; i < seatCount; i++) {
      const angle = angleStart + (i * angleStep)
      const x = centerPoint.x + Math.sin(angle) * radius
      const z = centerPoint.z + Math.cos(angle) * radius
      const y = 0.1 + (rowIndex * 0.32)
      
      seats.push({
        id: seatIdCounter++,
        row: rowIndex + 1,
        seatNumber: i + 1,
        position: { x, y, z },
        rotation: -angle,
        isSelected: false
      })
    }
  })
  
  return seats
}

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [showCinemaSeatSelector, setShowCinemaSeatSelector] = useState(false);
  
  // Amphitheater seats
  const cinemaSeats = createAmphitheaterSeating();
  const [currentViewerSeat, setCurrentViewerSeat] = useState(() => {
    // 3rd row (12-seat row), middle seat (6th or 7th seat) - default
    return cinemaSeats.find(seat => seat.row === 3 && seat.seatNumber === 6) || cinemaSeats[17]
  });

  const steps: Step[] = [
    {
      id: 1,
      title: 'Video URL',
      isCompleted: currentStep > 1,
      isActive: currentStep === 1
    },
    {
      id: 2,
      title: 'Seat Selection',
      isCompleted: currentStep > 2,
      isActive: currentStep === 2
    },
    {
      id: 3,
      title: 'Reservation',
      isCompleted: currentStep > 3,
      isActive: currentStep === 3
    },
    {
      id: 4,
      title: 'Cinema',
      isCompleted: false,
      isActive: currentStep === 4
    }
  ];

  const handleUrlSubmit = (url: string) => {
    // Send URL to backend and start download process
    // Get local video URL after download completion
    setVideoUrl(url);
    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfirmReservation = () => {
    setCurrentStep(4);
  };

  // 3D Cinema seat selection function
  const handleCinemaSeatSelect = (selectedSeat: CinemaSeat) => {
    setCurrentViewerSeat(selectedSeat);
    setShowCinemaSeatSelector(false);
  };

  // S key to open selection screen and Q/Escape to return to main menu
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'KeyS' && currentStep === 4 && !showCinemaSeatSelector) {
        setShowCinemaSeatSelector(true);
      }
      if ((event.code === 'KeyQ' || event.code === 'Escape') && currentStep === 4) {
        setCurrentStep(1);
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [showCinemaSeatSelector, currentStep]);

  // If on step 4, show 3D Cinema hall
  if (currentStep === 4) {
    return (
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        {/* Sandalye Seçim Ekranı - Canvas dışında render et */}
        {showCinemaSeatSelector && (
          <CinemaSeatSelector 
            seats={cinemaSeats}
            onSeatSelect={handleCinemaSeatSelect}
            onClose={() => setShowCinemaSeatSelector(false)}
          />
        )}

        <Canvas
          camera={{
            position: [0, 3, 18],
            fov: 75,
            near: 0.1,
            far: 1000
          }}
          style={{ background: '#87CEEB' }}
          shadows
        >
          <Suspense fallback={null}>
            <Scene 
              seats={cinemaSeats}
              currentViewerSeat={currentViewerSeat}
              videoUrl={videoUrl}
              videoTitle={videoTitle}
            />
            <Sky sunPosition={[100, 20, 100]} />
            <Stats />
          </Suspense>
        </Canvas>
        <CinemaUI />
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1>The Party - Cinema Experience</h1>
        <StepNavigator steps={steps} currentStep={currentStep} />
      </div>

      <div className="app-content">
        {currentStep === 1 && (
          <UrlInput onUrlSubmit={handleUrlSubmit} initialUrl={videoUrl} />
        )}

        {currentStep === 2 && (
          <CinemaSeatSelector
            seats={cinemaSeats}
            onSeatSelect={(seat) => {
              setCurrentViewerSeat(seat);
              setCurrentStep(3);
            }}
            onClose={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <div className="confirmation-container">
            <h2>Reservation Confirmation</h2>
            <div className="booking-summary">
              <h3>Selected Seat</h3>
              <div className="selected-seats">
                <span className="seat-tag">
                  {currentViewerSeat.row}-{currentViewerSeat.seatNumber}
                </span>
              </div>
              <p><strong>Video:</strong> {videoTitle || videoUrl}</p>
            </div>
          </div>
        )}
      </div>

      <div className="app-footer">
        <div className="navigation-buttons">
          {currentStep > 1 && (
            <button onClick={handlePrevStep} className="nav-button prev">
              Back
            </button>
          )}

          {currentStep === 3 && (
            <button onClick={handleConfirmReservation} className="nav-button confirm">
              Confirm Reservation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
