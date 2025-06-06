'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Radio } from 'lucide-react';
import { AudioLevelIndicator } from './AudioLevelIndicator';
import { useReactMediaRecorder } from 'react-media-recorder';

interface VoiceControlsProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  isProcessing: boolean;
}

export function VoiceControls({ onRecordingComplete, isProcessing }: VoiceControlsProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSilent, setIsSilent] = useState(true);

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl
  } = useReactMediaRecorder({
    audio: true,
    onStop: (blobUrl, blob) => {
      if (blob) {
        onRecordingComplete(blob);
      }
      cleanupAudioContext();
    }
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

  const handleRecording = useCallback(() => {
    if (status === 'recording') {
      stopRecording();
    } else {
      startRecording();
    }
  }, [status, startRecording, stopRecording]);

  const isRecording = status === 'recording';

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleRecording}
        disabled={isProcessing}
        className={`p-2 rounded-full transition-colors ${
          isRecording 
            ? 'bg-red-500 hover:bg-red-600 text-white' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
      >
        {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
      </button>
      {isRecording && (
        <div className="flex items-center gap-2">
          <Radio className="animate-pulse text-red-500" size={16} />
          <AudioLevelIndicator level={audioLevel} isSilent={isSilent} />
        </div>
      )}
    </div>
  );
}
