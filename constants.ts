export const ASSETS = {
  CAMERA_BG: 'https://www.bubbbly.com/assets/retro-camera.webp',
  SHUTTER_SOUND: 'https://www.bubbbly.com/assets/retro-camera/polaroid-camera.mp3',
  DEMO_CATS: [
    'https://bubbbly.com/assets/retro-camera/cat-cute-3.webp',
    'https://bubbbly.com/assets/retro-camera/cat-cute-2.webp',
    'https://bubbbly.com/assets/retro-camera/cat-cute-1.webp'
  ]
};

export const PHOTO_DIMENSIONS = {
  width: 220, // Base width for the polaroid card
  height: 260, // Base height
  imageHeight: 200,
};

export const Z_INDEX = {
  BASE: 10,
  CAMERA_BODY: 50,
  DEVELOPING_PHOTO: 40, // Behind camera, above table
  DRAGGING: 100,
};