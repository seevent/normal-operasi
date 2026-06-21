import { create } from 'zustand';

interface CameraState {
  photos: any[];
  setPhotos: (photos: any[] | ((prev: any[]) => any[])) => void;
  collageUrl: string | null;
  setCollageUrl: (url: string | null) => void;
  collageFile: File | null;
  setCollageFile: (file: File | null) => void;
  isGeneratingCollage: boolean;
  setIsGeneratingCollage: (val: boolean) => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  photos: [],
  setPhotos: (updater) => set((state) => ({ 
    photos: typeof updater === 'function' ? updater(state.photos) : updater 
  })),
  collageUrl: null,
  setCollageUrl: (url) => set({ collageUrl: url }),
  collageFile: null,
  setCollageFile: (file) => set({ collageFile: file }),
  isGeneratingCollage: false,
  setIsGeneratingCollage: (val) => set({ isGeneratingCollage: val }),
}));
