import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Radio } from 'lucide-react';
import { AudioLevelIndicator } from './AudioLevelIndicator';

interface VoiceControlsProps {
  onRecordingComplete: (blob: Blob) => void;
  onPlaybackComplete: () => void;
  isProcessing: boolean;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  onRecordingComplete,
  onPlaybackComplete,
  isProcessing
}: VoiceControlsProps) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isSilent, setIsSilent] = useState<boolean>(false);
  const [isAutoRecording, setIsAutoRecording] = useState<boolean>(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const autoRecordTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const SILENCE_THRESHOLD = 0.1;
  const SILENCE_DURATION = 1000;

  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (autoRecordTimeoutRef.current) {
        clearTimeout(autoRecordTimeoutRef.current);
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      });
      
      streamRef.current = stream;
      
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext();
      }
      
      const analyser = audioContextRef.current.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyser);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm;codecs=opus' });
        onRecordingComplete(audioBlob);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
        
        setIsRecording(false);
        
        // If auto-record is enabled, start a new recording after processing
        if (isAutoRecording && !isProcessing) {
          autoRecordTimeoutRef.current = setTimeout(() => {
            startRecording();
          }, 1000);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start audio level monitoring
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalizedLevel = average / 255;
        
        setAudioLevel(normalizedLevel);
        
        // Check for silence
        if (normalizedLevel < SILENCE_THRESHOLD) {
          setIsSilent(true);
          if (!silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              if (isRecording) {
                stopRecording();
              }
            }, SILENCE_DURATION);
          }
        } else {
          setIsSilent(false);
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        }
        
        animationFrameIdRef.current = requestAnimationFrame(updateLevel);
      };
      
      updateLevel();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = (): void => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
    }
  };

  const toggleAutoRecord = () => {
    setIsAutoRecording(prev => {
      const newState = !prev;
      if (newState && !isRecording) {
        // If enabling auto-record and not currently recording, start recording
        setTimeout(() => {
          startRecording();
        }, 500);
      } else if (!newState && isRecording) {
        // If disabling auto-record and currently recording, stop recording
        stopRecording();
      }
      return newState;
    });
  };

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`p-2 rounded-full ${
          isRecording ? 'bg-red-500' : 'bg-blue-500'
        } text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isRecording ? (
          <MicOff className="h-6 w-6" aria-hidden="true" />
        ) : (
          <Mic className="h-6 w-6" aria-hidden="true" />
        )}
      </button>
      
      <button
        onClick={toggleAutoRecord}
        className={`p-2 rounded-full ${
          isAutoRecording ? 'bg-green-500' : 'bg-gray-500'
        } text-white hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isAutoRecording ? 'Disable auto-record' : 'Enable auto-record'}
        aria-label={isAutoRecording ? 'Disable auto-record' : 'Enable auto-record'}
        aria-pressed={isAutoRecording}
        disabled={isProcessing}
      >
        <Radio className={`h-6 w-6 ${isAutoRecording ? 'animate-pulse' : ''}`} aria-hidden="true" />
      </button>

      {isRecording && (
        <div className="w-32">
          <AudioLevelIndicator level={audioLevel} isSilent={isSilent} />
        </div>
      )}
      
      {isAutoRecording && !isRecording && !isProcessing && (
        <span className="text-sm text-green-500 font-medium">
          Auto-record enabled
        </span>
      )}
    </div>
  );
};
