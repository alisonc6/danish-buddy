'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useReactMediaRecorder } from 'react-media-recorder';

interface VoiceControlsProps {
  onRecordingComplete: (blob: Blob) => void;
  isProcessing: boolean;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  onRecordingComplete,
  isProcessing,
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [_audioLevel, setAudioLevel] = useState(0);
  const [_isSilent, setIsSilent] = useState(true);

  const {
    status,
    startRecording,
    stopRecording,
  } = useReactMediaRecorder({
    audio: true,
    onStop: (_, blob) => {
      if (blob) {
        onRecordingComplete(blob);
      }
    },
  });

  const cleanupAudioContext = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      analyserRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupAudioContext();
    };
  }, [cleanupAudioContext]);

  useEffect(() => {
    if (status === 'recording') {
      // Initialize audio context and analyzer
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;

        // Get the audio stream from the MediaRecorder
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            source.connect(analyserRef.current!);
          })
          .catch(error => {
            console.error('Error accessing microphone:', error);
            cleanupAudioContext();
          });
      }
    } else {
      cleanupAudioContext();
    }
  }, [status, cleanupAudioContext]);

  useEffect(() => {
    let animationFrameId: number;
    const updateAudioLevel = () => {
      if (analyserRef.current && status === 'recording') {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume level
        const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
        const normalizedLevel = average / 255; // Normalize to 0-1 range
        
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

  const isRecording = status === 'recording';

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`p-2 rounded-full transition-colors ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-blue-500 hover:bg-blue-600'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isRecording ? (
          <MicOff className="w-5 h-5 text-white" />
        ) : (
          <Mic className="w-5 h-5 text-white" />
        )}
      </button>
      {isRecording && (
        <div className="text-sm text-gray-600">
          Recording...
        </div>
      )}
    </div>
  );
};
