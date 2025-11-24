import { PhotoData } from '../types';

/**
 * Merges all photos into a single downloadable image.
 * This recreates the DOM visual on a canvas.
 */
export const generateCompositeImage = async (photos: PhotoData[], bgColor: string = '#f3f4f6'): Promise<string> => {
  const canvas = document.createElement('canvas');
  // Set canvas to window size to capture the arrangement
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  // Fill background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Sort by Z-index to draw in correct order
  const sortedPhotos = [...photos].sort((a, b) => a.zIndex - b.zIndex);

  for (const photo of sortedPhotos) {
    await drawPolaroidOnCanvas(ctx, photo);
  }

  return canvas.toDataURL('image/png');
};

const drawPolaroidOnCanvas = async (ctx: CanvasRenderingContext2D, photo: PhotoData) => {
  const { x, y, rotation, imageUrl, captionTitle, captionDate } = photo;
  
  // Dimensions (must match CSS approximate values)
  const cardW = 240; 
  const cardH = 300;
  const imgPadding = 12;
  const imgH = 200;

  ctx.save();
  
  // Move to position and rotate
  ctx.translate(x + cardW / 2, y + cardH / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-(x + cardW / 2), -(y + cardH / 2));

  // Draw Card Shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 5;

  // Draw Card Body
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, cardW, cardH);
  
  // Reset shadow for content
  ctx.shadowColor = 'transparent';

  // Draw Image
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = imageUrl;
  
  await new Promise<void>((resolve, reject) => {
    if (img.complete) resolve();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // Skip image if fail, draw blank
  });

  // Draw the photo area
  try {
      ctx.drawImage(img, x + imgPadding, y + imgPadding, cardW - (imgPadding * 2), imgH);
      
      // NOTE: Removed vintage gradient overlay to match UI changes
      
  } catch (e) {
    console.error("Failed to draw image", e);
  }

  // Draw Text
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  
  // Font 1
  ctx.font = '24px "Caveat", cursive'; // Note: Canvas needs font loaded, might fallback
  ctx.fillText(captionTitle, x + cardW / 2, y + imgH + 45);

  // Font 2
  ctx.font = '16px "Caveat", cursive';
  ctx.fillStyle = '#666';
  ctx.fillText(captionDate, x + cardW / 2, y + imgH + 70);

  ctx.restore();
};