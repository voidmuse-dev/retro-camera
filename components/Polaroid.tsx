import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { PhotoData } from '../types';
import { clsx } from 'clsx';

interface PolaroidProps {
  data: PhotoData;
  onUpdate: (id: string, updates: Partial<PhotoData>) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDragStart: (id: string) => void;
  isNew: boolean;
}

export const Polaroid: React.FC<PolaroidProps> = ({ 
  data, 
  onUpdate, 
  onDragEnd, 
  onDragStart,
  isNew 
}) => {
  const [isHeld, setIsHeld] = useState(false);
  
  // Refs for content editable to sync back to state
  const titleRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  const handleDragStart = () => {
    setIsHeld(true);
    onDragStart(data.id);
  };

  const handleDragEnd = (_: any, info: any) => {
    const newX = data.x + info.offset.x;
    const newY = data.y + info.offset.y;
    onDragEnd(data.id, newX, newY);
    setIsHeld(false);
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      // Animation Logic:
      // The card is 300px tall.
      // We want to show 1/2 height (150px) at the end state (data.y).
      // To start completely hidden behind the camera, we need to be at least 150px lower than data.y.
      // We use +160px to be safe.
      initial={isNew ? { x: data.x, y: data.y + 160 } : { x: data.x, y: data.y }}
      animate={{ x: data.x, y: data.y }}
      transition={isNew ? { duration: 2, ease: "easeOut" } : { duration: 0 }}
      onAnimationComplete={() => {
        if (isNew) {
          onUpdate(data.id, { isDeveloping: false });
        }
      }}
      style={{ 
        zIndex: data.zIndex,
        rotate: data.rotation,
      }}
      className={clsx(
        "absolute w-[240px] h-[300px] bg-white shadow-2xl p-3 pb-10 flex flex-col items-center cursor-grab active:cursor-grabbing transform-gpu",
        "hover:scale-105 transition-transform duration-200",
        "before:content-[''] before:absolute before:inset-0 before:bg-stone-50 before:opacity-50 before:pointer-events-none"
      )}
    >
      {/* Photo Area */}
      <div className="w-full h-[200px] bg-black overflow-hidden relative border border-gray-100 shadow-inner">
        <img 
          src={data.imageUrl} 
          alt="Polaroid" 
          className="w-full h-full object-cover block"
          draggable={false}
        />
        {/* Grain Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
      </div>

      {/* Caption Area */}
      <div className="mt-4 text-center w-full font-handwriting leading-tight z-10 relative">
        <div 
          ref={titleRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onUpdate(data.id, { captionTitle: e.currentTarget.textContent || "" })}
          className="text-2xl text-gray-800 outline-none border-b border-transparent hover:border-gray-200 focus:border-blue-300 transition-colors"
        >
          {data.captionTitle}
        </div>
        <div 
          ref={dateRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onUpdate(data.id, { captionDate: e.currentTarget.textContent || "" })}
          className="text-base text-gray-500 outline-none border-b border-transparent hover:border-gray-200 focus:border-blue-300 transition-colors"
        >
          {data.captionDate}
        </div>
      </div>
    </motion.div>
  );
};