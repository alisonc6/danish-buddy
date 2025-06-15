'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

interface VoiceControlsProps {
  onRecordingComplete: (blob: Blob) => void;
  isProcessing: boolean;
}

const VoiceControls: React.FC<VoiceControlsProps> = ({
  onRecordingComplete,
  isProcessing,
}) => {
  const [status, setStatus] = useState<'idle' | 'recording' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSilent, setIsSilent] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Audio configuration optimized for Google Speech-to-Text
  const audioConfig = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 16000,
      channelCount: 1,
      sampleSize: 16,
      latency: 0,
      googEchoCancellation: true,
      googAutoGainControl: true,
      googNoiseSuppression: true,
      googHighpassFilter: true
    }
  };

  const cleanupResources = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      analyserRef.current = null;
    }
    chunksRef.current = [];
    setAudioLevel(0);
    setIsSilent(true);
  }, []);

  // Two-step microphone detection as per ADR 1
  const initializeMicrophone = useCallback(async () => {
    try {
      // Step 1: Try direct microphone access
      const stream = await navigator.mediaDevices.getUserMedia(audioConfig);
      streamRef.current = stream;
      return stream;
    } catch (error) {
      console.log('Direct microphone access failed, trying device enumeration...');
      
      // Step 2: Fall back to device enumeration
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = devices.filter(device => device.kind === 'audioinput');
        
        if (audioDevices.length === 0) {
          throw new Error('No audio input devices found');
        }

        const stream = await navigator.mediaDevices.getUserMedia(audioConfig);
        streamRef.current = stream;
        return stream;
      } catch (enumError) {
        throw new Error('Failed to access microphone. Please check your device settings and permissions.');
      }
    }
  }, [audioConfig]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await initializeMicrophone();
      
      // Initialize audio context and analyzer
      audioContextRef.current = new AudioContext({
        sampleRate: 16000, // Match the sample rate
      });
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Check for supported MIME types
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      // Initialize MediaRecorder with supported format
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 16000, // Match the sample rate
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        onRecordingComplete(blob);
        cleanupResources();
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
      setStatus('recording');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start recording');
      setStatus('error');
      cleanupResources();
    }
  }, [initializeMicrophone, onRecordingComplete, cleanupResources]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
      setStatus('idle');
    }
  }, [status]);

  // Handle visibility change as per ADR 5
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && status === 'recording') {
        stopRecording();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, [cleanupResources]);

  // Audio level monitoring
  useEffect(() => {
    let animationFrameId: number;
    
    const updateAudioLevel = () => {
      if (analyserRef.current && status === 'recording') {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
        const normalizedLevel = average / 255;
        
        setAudioLevel(normalizedLevel);
        setIsSilent(normalizedLevel < 0.1);
        
        animationFrameId = requestAnimationFrame(updateAudioLevel);
      }
    };

    if (status === 'recording') {
      updateAudioLevel();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [status]);

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={status === 'recording' ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`p-2 rounded-full ${
          status === 'recording' ? 'bg-red-500' : 'bg-blue-500'
        } text-white disabled:opacity-50 hover:opacity-90 transition-opacity`}
        aria-label={status === 'recording' ? 'Stop recording' : 'Start recording'}
      >
        {status === 'recording' ? <MicOff size={20} /> : <Mic size={20} />}
      </button>
      
      {status === 'recording' && (
        <div className="flex items-center space-x-2">
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${audioLevel * 100}%` }}
            />
          </div>
          <span className="text-sm text-gray-600">
            {isSilent ? 'Listening...' : 'Recording...'}
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-1 text-red-500">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
};

export { VoiceControls };
export default VoiceControls;
