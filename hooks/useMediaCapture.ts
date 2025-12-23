import { useState, useCallback, useRef, useEffect } from 'react';

export type MediaSourceType = 'camera' | 'screen' | 'youtube' | 'stream';

interface UseMediaCaptureProps {
  audioDeviceId?: string;
  videoDeviceId?: string;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
}

interface MediaCaptureState {
  stream: MediaStream | null;
  screenStream: MediaStream | null;
  sourceType: MediaSourceType;
  error: string | null;
}

export function useMediaCapture({
  audioDeviceId,
  videoDeviceId,
  audioEnabled = true,
  videoEnabled = true
}: UseMediaCaptureProps = {}) {
  const [state, setState] = useState<MediaCaptureState>({
    stream: null,
    screenStream: null,
    sourceType: 'camera',
    error: null
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get camera/mic stream
  const startCameraCapture = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
        video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Apply initial enabled states
      stream.getAudioTracks().forEach(track => track.enabled = audioEnabled);
      stream.getVideoTracks().forEach(track => track.enabled = videoEnabled);

      setState(prev => ({
        ...prev,
        stream,
        sourceType: 'camera',
        error: null
      }));

      return stream;
    } catch (err: any) {
      const errorMessage = err.name === 'NotAllowedError' 
        ? 'Camera/microphone permission denied'
        : err.message || 'Failed to access media devices';
      
      setState(prev => ({ ...prev, error: errorMessage }));
      return null;
    }
  }, [audioDeviceId, videoDeviceId, audioEnabled, videoEnabled]);

  // Start screen share
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as any,
        audio: true
      });

      // Handle when user stops sharing via browser UI
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      setState(prev => ({
        ...prev,
        screenStream,
        sourceType: 'screen',
        error: null
      }));

      return screenStream;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setState(prev => ({ 
          ...prev, 
          error: err.message || 'Failed to start screen share' 
        }));
      }
      return null;
    }
  }, []);

  // Stop screen share
  const stopScreenShare = useCallback(() => {
    if (state.screenStream) {
      state.screenStream.getTracks().forEach(track => track.stop());
    }
    setState(prev => ({
      ...prev,
      screenStream: null,
      sourceType: 'camera'
    }));
  }, [state.screenStream]);

  // Start external audio source (YouTube/Stream)
  const startExternalAudio = useCallback(async (url: string, type: 'youtube' | 'stream') => {
    try {
      // For external sources, we create an audio element and capture its stream
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = url;
      audioRef.current.crossOrigin = 'anonymous';
      
      // For YouTube, we'd need an iframe approach or YouTube API
      // For streams (RTMP/HLS), we can use the audio element directly
      if (type === 'stream') {
        await audioRef.current.play();
        
        // Create a MediaStream from the audio element
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(audioRef.current);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioContext.destination); // Also play locally

        setState(prev => ({
          ...prev,
          sourceType: type,
          error: null
        }));

        return destination.stream;
      }

      // YouTube would need special handling via iframe
      setState(prev => ({ ...prev, sourceType: type }));
      return null;
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        error: err.message || 'Failed to start external audio' 
      }));
      return null;
    }
  }, []);

  // Stop external audio
  const stopExternalAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setState(prev => ({
      ...prev,
      sourceType: 'camera'
    }));
  }, []);

  // Toggle audio track
  const toggleAudio = useCallback((enabled: boolean) => {
    if (state.stream) {
      state.stream.getAudioTracks().forEach(track => track.enabled = enabled);
    }
  }, [state.stream]);

  // Toggle video track
  const toggleVideo = useCallback((enabled: boolean) => {
    if (state.stream) {
      state.stream.getVideoTracks().forEach(track => track.enabled = enabled);
    }
  }, [state.stream]);

  // Stop all streams
  const stopAllStreams = useCallback(() => {
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
    }
    if (state.screenStream) {
      state.screenStream.getTracks().forEach(track => track.stop());
    }
    stopExternalAudio();
    setState({
      stream: null,
      screenStream: null,
      sourceType: 'camera',
      error: null
    });
  }, [state.stream, state.screenStream, stopExternalAudio]);

  // Get the current active stream (screen or camera)
  const getActiveStream = useCallback(() => {
    return state.screenStream || state.stream;
  }, [state.screenStream, state.stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllStreams();
    };
  }, []);

  return {
    stream: state.stream,
    screenStream: state.screenStream,
    sourceType: state.sourceType,
    error: state.error,
    isScreenSharing: state.sourceType === 'screen',
    startCameraCapture,
    startScreenShare,
    stopScreenShare,
    startExternalAudio,
    stopExternalAudio,
    toggleAudio,
    toggleVideo,
    stopAllStreams,
    getActiveStream
  };
}
