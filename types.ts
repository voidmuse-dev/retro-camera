export interface PhotoData {
  id: string;
  imageUrl: string;
  captionTitle: string;
  captionDate: string;
  timestamp: number;
  x: number;
  y: number;
  rotation: number;
  isDeveloping: boolean;
  isDemo: boolean;
  zIndex: number;
}

export interface CameraConfig {
  width: number;
  height: number;
}