
import { useState, useEffect, useCallback } from 'react';

export function useDevices() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [selectedAudio, setSelectedAudio] = useState<string>('');

  const refreshDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      setDevices(allDevices);
      
      const video = allDevices.find(d => d.kind === 'videoinput');
      const audio = allDevices.find(d => d.kind === 'audioinput');
      
      if (video && !selectedVideo) setSelectedVideo(video.deviceId);
      if (audio && !selectedAudio) setSelectedAudio(audio.deviceId);
    } catch (err) {
      console.error('Error enumerating devices:', err);
    }
  }, [selectedVideo, selectedAudio]);

  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
  }, [refreshDevices]);

  return { 
    devices, 
    selectedVideo, 
    setSelectedVideo, 
    selectedAudio, 
    setSelectedAudio, 
    refreshDevices 
  };
}
