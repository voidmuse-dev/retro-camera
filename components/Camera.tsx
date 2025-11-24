import React, { useRef, useEffect, useState } from 'react';
import { CameraConfig } from '../types';
import { ASSETS } from '../constants';
import { Camera as CameraIcon, RefreshCw } from 'lucide-react';

interface CameraProps {
  onTakePhoto: (imageData: string) => void;
  disabled?: boolean;
}

export const Camera: React.FC<CameraProps> = ({ onTakePhoto, disabled }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [error, setError] = useState<string>("");

  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure play is called
        await videoRef.current.play();
        setHasPermission(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Camera access denied or unavailable.");
      setHasPermission(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      // Cleanup stream tracks if component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (disabled) return;
    
    // If no permission, try to start camera again (user interaction might be needed)
    if (!hasPermission) {
      startCamera();
      return;
    }

    if (!videoRef.current || !canvasRef.current) return;

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      const size = Math.min(video.videoWidth, video.videoHeight);
      // If video is not ready (0x0), we can't capture
      if (size === 0) return;

      const startX = (video.videoWidth - size) / 2;
      const startY = (video.videoHeight - size) / 2;

      canvas.width = 600;
      canvas.height = 600;

      // Mirror for selfie
      context.translate(canvas.width, 0);
      context.scale(-1, 1);

      context.drawImage(
        video,
        startX, startY, size, size,
        0, 0, canvas.width, canvas.height
      );

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onTakePhoto(dataUrl);
    }
  };

  return (
    <div className={`relative w-[350px] h-[300px] select-none ${disabled ? 'opacity-90 grayscale-[0.2]' : ''}`}>
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Body - z-20 */}
      <img 
        src={ASSETS.CAMERA_BG} 
        alt="Retro Camera" 
        className="w-full h-full object-contain drop-shadow-2xl relative z-20 pointer-events-none"
      />

      {/* Lens / Viewfinder */}
      <div 
        className="absolute z-30 overflow-hidden rounded-full bg-gray-900 border-4 border-gray-800/80 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] pointer-events-auto"
        style={{
            width: '142px',
            height: '142px',
            top: '94px',
            left: '140px',
            transform: 'rotate(-2deg)'
        }}
        onClick={!hasPermission ? startCamera : undefined}
      >
        <video 
          ref={videoRef}
          muted
          autoPlay
          playsInline
          className={`w-full h-full object-cover transform scale-x-[-1] ${hasPermission ? 'block' : 'hidden'}`}
        />
        
        {!hasPermission && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-white/50 cursor-pointer hover:text-white/80 transition-colors p-4 text-center">
             {error ? <RefreshCw size={32} /> : <CameraIcon size={48} />}
             {error && <span className="text-[10px] mt-1 leading-tight">Retry Camera</span>}
          </div>
        )}
        
        {/* Glass Reflection */}
        <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-tr from-white/20 via-transparent to-black/20 z-40" />

        {/* Flash Effect */}
        <div className={`absolute inset-0 bg-white pointer-events-none z-50 transition-opacity duration-75 ${isFlashing ? 'opacity-90' : 'opacity-0'}`} />
      </div>

      {/* Shutter Button - Interaction Zone */}
      <button
        onClick={handleCapture}
        disabled={disabled}
        className={`absolute z-40 rounded-full bg-transparent transition-all pointer-events-auto outline-none ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-white/10 active:bg-black/10'}`}
        style={{
          width: '50px',
          height: '50px',
          top: '140px',
          left: '70px',
        }}
        aria-label="Take Photo"
      />
    </div>
  );
};