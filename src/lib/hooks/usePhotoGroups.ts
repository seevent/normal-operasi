import React, { useState } from 'react';
import { compressImageFile } from '../utils/canvasUtils';

export interface PhotoGroupPhoto {
  id: number;
  file: File;
  preview: string;
  zoom: number;
}

export interface PhotoGroup {
  id: number;
  photos: any[];
  isGenerating: boolean;
  autoCollageFile: File | null;
  collageAnnotation: string | undefined;
}

export const createEmptyPhotoGroup = (): PhotoGroup => ({
  id: Date.now(),
  photos: [] as any[],
  isGenerating: false,
  autoCollageFile: null,
  collageAnnotation: undefined,
});

/**
 * State & operasi grup foto (unggah + kompresi, hapus, zoom, reorder drag-drop,
 * tambah/hapus grup) yang dipakai bersama oleh tab-tab laporan operasional.
 *
 * Hook ini juga membebaskan object URL blob saat komponen dilepas agar preview
 * foto tidak membocorkan memori.
 */
export const usePhotoGroups = () => {
  const [photoGroups, setPhotoGroups] = useState<any[]>([createEmptyPhotoGroup()]);

  const photoGroupsRef = React.useRef(photoGroups);
  photoGroupsRef.current = photoGroups;

  React.useEffect(() => {
    return () => {
      photoGroupsRef.current.forEach((group) => {
        group.photos.forEach((p: any) => {
          if (p.preview && p.preview.startsWith('blob:')) {
            URL.revokeObjectURL(p.preview);
          }
        });
      });
    };
  }, []);

  const handlePhotoUpload = async (groupId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const compressedResults = await Promise.all(files.map((f) => compressImageFile(f)));
      const newPhotos = compressedResults.map((res) => ({
        id: Date.now() + Math.random(),
        file: res.file,
        preview: res.preview,
        zoom: 1,
      }));
      setPhotoGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, photos: [...g.photos, ...newPhotos] } : g)));
    }
  };

  const removePhoto = (groupId: number, photoIndex: number) => {
    setPhotoGroups((prev) =>
      prev.map((group) => {
        if (group.id === groupId) {
          const newPhotos = [...group.photos];
          URL.revokeObjectURL(newPhotos[photoIndex].preview);
          newPhotos.splice(photoIndex, 1);
          return { ...group, photos: newPhotos };
        }
        return group;
      })
    );
  };

  const updatePhotoZoom = (groupId: number, photoIndex: number, delta: number) => {
    setPhotoGroups((prev) =>
      prev.map((group) => {
        if (group.id === groupId) {
          const newPhotos = [...group.photos];
          const currentZoom = newPhotos[photoIndex].zoom || 1;
          newPhotos[photoIndex] = {
            ...newPhotos[photoIndex],
            zoom: Math.max(0.5, Math.min(3, currentZoom + delta)),
          };
          return { ...group, photos: newPhotos };
        }
        return group;
      })
    );
  };

  const handlePhotoDrop = (e: React.DragEvent | any, groupId: number, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer?.getData('text/plain');
    if (!sourceIndexStr) return;

    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (sourceIndex === targetIndex || isNaN(sourceIndex)) return;

    setPhotoGroups((prev) =>
      prev.map((group) => {
        if (group.id === groupId) {
          const newPhotos = [...group.photos];
          const [movedPhoto] = newPhotos.splice(sourceIndex, 1);
          newPhotos.splice(targetIndex, 0, movedPhoto);
          return { ...group, photos: newPhotos };
        }
        return group;
      })
    );
  };

  const addPhotoGroup = () => {
    setPhotoGroups((prev) => [...prev, createEmptyPhotoGroup()]);
  };

  const removePhotoGroup = (groupId: number) => {
    if (photoGroups.length <= 1) return;
    setPhotoGroups((prev) => {
      const groupToRemove = prev.find((g) => g.id === groupId);
      if (groupToRemove) {
        groupToRemove.photos.forEach((p: any) => URL.revokeObjectURL(p.preview));
      }
      return prev.filter((g) => g.id !== groupId);
    });
  };

  return {
    photoGroups,
    setPhotoGroups,
    photoGroupsRef,
    handlePhotoUpload,
    removePhoto,
    updatePhotoZoom,
    handlePhotoDrop,
    addPhotoGroup,
    removePhotoGroup,
  };
};
