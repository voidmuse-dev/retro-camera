import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, RotateCcw } from 'lucide-react';
import { Camera } from './components/Camera';
import { Polaroid } from './components/Polaroid';
import { PhotoData } from './types';
import { ASSETS, Z_INDEX } from './constants';
import { generateCompositeImage } from './utils/canvasUtils';

const formatDate = () => {
  const now = new Date();
  return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
};

export default function App() {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasTakenFirstPhoto, setHasTakenFirstPhoto] = useState(false);
  
  // Audio
  const shutterAudioRef = useRef<HTMLAudioElement>(new Audio(ASSETS.SHUTTER_SOUND));

  // Check if camera is busy (animating/ejecting)
  const isDeveloping = photos.some(p => p.isDeveloping);

  // Initialize Demo Photos
  useEffect(() => {
    // Calculate center-ish positions for demo
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    const demos: PhotoData[] = ASSETS.DEMO_CATS.map((url, idx) => ({
      id: `demo-${idx}`,
      imageUrl: url,
      captionTitle: "May I meet you",
      captionDate: formatDate(),
      timestamp: Date.now(),
      x: centerX - 100 + (idx * 40),
      y: centerY - 100 + (idx * 20),
      rotation: -5 + (idx * 5),
      isDeveloping: false,
      isDemo: true,
      zIndex: Z_INDEX.BASE + idx
    }));

    setPhotos(demos);
  }, []);

  const playSound = () => {
    shutterAudioRef.current.currentTime = 0;
    shutterAudioRef.current.play().catch(e => console.log("Audio play failed", e));
  };

  const handleTakePhoto = useCallback((imageData: string) => {
    // Prevent taking photo if one is already animating
    if (isDeveloping) return;

    // Clear demo photos on first real shot
    if (isDemoMode) {
      setPhotos([]);
      setIsDemoMode(false);
    }

    playSound();

    // Calculate Spawn Position
    // Camera is fixed at bottom left.
    // Camera Body visual top is approx window.innerHeight - 280px.
    // Photo height is 300px.
    // We want 1/2 height (150px) visible.
    // So Target Top = (window.innerHeight - 280) - 150 = window.innerHeight - 430.
    
    const spawnX = 55; 
    const targetY = window.innerHeight - 430; 

    const newPhoto: PhotoData = {
      id: `photo-${Date.now()}`,
      imageUrl: imageData,
      captionTitle: "New Memory",
      captionDate: formatDate(),
      timestamp: Date.now(),
      x: spawnX,
      y: targetY,
      rotation: (Math.random() * 2) - 1, 
      isDeveloping: true, // Used to trigger the rise animation
      isDemo: false,
      zIndex: Z_INDEX.DEVELOPING_PHOTO // 40 (Behind Camera which is 50)
    };

    setPhotos(prev => [...prev, newPhoto]);

    // Tooltip logic - Show after the ejection animation (approx 2.2s)
    if (!hasTakenFirstPhoto) {
      setHasTakenFirstPhoto(true);
      setTimeout(() => {
        setShowTooltip(true);
        // Hide tooltip after 8 seconds
        setTimeout(() => setShowTooltip(false), 8000);
      }, 2200);
    }
  }, [isDemoMode, hasTakenFirstPhoto, isDeveloping]);

  const updatePhoto = (id: string, updates: Partial<PhotoData>) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleDragStart = (id: string) => {
    // Bring to front
    setPhotos(prev => {
      const maxZ = Math.max(...prev.map(p => p.zIndex), Z_INDEX.DRAGGING);
      return prev.map(p => p.id === id ? { ...p, zIndex: maxZ + 1 } : p);
    });
    
    // Hide tooltip if user interacts
    setShowTooltip(false);
  };

  const handleDragEnd = (id: string, x: number, y: number) => {
    updatePhoto(id, { x, y });
  };

  const handleReset = () => {
    if (window.confirm("Clear all memories?")) {
      setPhotos([]);
      setIsDemoMode(false);
    }
  };

  const handleDownload = async () => {
    try {
      const dataUrl = await generateCompositeImage(photos);
      const link = document.createElement('a');
      link.download = `retro-memories-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Download failed", e);
      alert("Could not generate image.");
    }
  };

  return (
    <div className="relative w-full h-screen bg-stone-100 overflow-hidden">
      
      {/* Toolbar */}
      <div className="fixed top-4 right-4 z-[60] flex gap-3">
        <button 
          onClick={handleReset}
          className="p-3 bg-white rounded-full shadow-lg text-gray-600 hover:text-red-500 hover:bg-red-50 transition-all"
          title="Reset"
        >
          <RotateCcw size={20} />
        </button>
        <button 
          onClick={handleDownload}
          className="p-3 bg-gray-900 rounded-full shadow-lg text-white hover:bg-black transition-all"
          title="Download All"
        >
          <Download size={20} />
        </button>
      </div>

      {/* Photos Layer */}
      <div className="absolute inset-0 pointer-events-none">
         {photos.map((photo) => {
             // Only apply the "New" animation if it is marked developing AND is behind the camera
             const isFresh = photo.isDeveloping && photo.zIndex === Z_INDEX.DEVELOPING_PHOTO;
             
             return (
              <div 
                key={photo.id} 
                className="absolute top-0 left-0 pointer-events-auto"
              >
                 <Polaroid 
                    data={photo} 
                    onUpdate={updatePhoto}
                    onDragEnd={handleDragEnd}
                    onDragStart={handleDragStart}
                    isNew={isFresh}
                 />
              </div>
            );
         })}
      </div>

      {/* Camera Setup (Fixed Bottom Left) */}
      <div className="fixed bottom-[-20px] left-[-20px] sm:bottom-4 sm:left-4 z-50 transition-transform duration-300">
        <Camera onTakePhoto={handleTakePhoto} disabled={isDeveloping} />
        
        {/* Tooltip Layer */}
        {showTooltip && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none animate-in fade-in duration-500">
             <div className="absolute top-[-90px] left-[80px] bg-white text-gray-800 px-4 py-2 rounded-xl text-sm font-bold shadow-xl border border-gray-100 z-50 whitespace-nowrap flex flex-col items-center after:content-[''] after:absolute after:bottom-[-6px] after:left-6 after:w-3 after:h-3 after:bg-white after:rotate-45 after:border-b after:border-r after:border-gray-100">
                <span>Drag photo to gallery ↗</span>
                <span className="text-[10px] font-normal text-gray-400">Save your memory</span>
             </div>
          </div>
        )}
      </div>

      {/* Drop Zone Indicator */}
      <div className="absolute top-0 right-0 w-1/2 h-full flex items-center justify-center pointer-events-none z-[-1]">
         <div className="border-4 border-dashed border-gray-200 rounded-3xl w-[80%] h-[80%] flex items-center justify-center">
            <p className="text-gray-300 font-handwriting text-4xl -rotate-6 opacity-60">
                Gallery Wall
            </p>
         </div>
      </div>

    </div>
  );
}