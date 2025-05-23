import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Radio } from 'lucide-react';
import { AudioLevelIndicator } from './AudioLevelIndicator';

interface VoiceControlsProps {
  onRecordingComplete: (blob: Blob) => void;
  isProcessing: boolean;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  onRecordingComplete,
  isProcessing
}: VoiceControlsProps) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isSilent, setIsSilent] = useState<boolean>(false);
  const [isAutoRecording, setIsAutoRecording] = useState<boolean>(false);
  const [noiseFloor, setNoiseFloor] = useState<number>(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const autoRecordTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const SILENCE_THRESHOLD = 0.1;
  const SILENCE_DURATION = 1500;
  const MIN_RECORDING_DURATION = 1000;
  const VOICE_FREQUENCY_RANGE = {
    min: 85,  // Hz - typical human voice range
    max: 255  // Hz - typical human voice range
  };
  const VOICE_PEAK_THRESHOLD = 0.4;
  const NOISE_FLOOR_SAMPLES = 10;

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

  const calibrateNoiseFloor = async () => {
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
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const samples: number[] = [];
      
      const sampleNoise = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        let count = 0;
        
        for (let i = 0; i < dataArray.length; i++) {
          const frequency = i * audioContextRef.current!.sampleRate / analyserRef.current.fftSize;
          if (frequency >= VOICE_FREQUENCY_RANGE.min && frequency <= VOICE_FREQUENCY_RANGE.max) {
            sum += dataArray[i];
            count++;
          }
        }
        
        const average = count > 0 ? sum / count : 0;
        samples.push(average / 255);
        
        if (samples.length < NOISE_FLOOR_SAMPLES) {
          animationFrameIdRef.current = requestAnimationFrame(sampleNoise);
        } else {
          const noiseFloor = samples.reduce((a, b) => a + b, 0) / samples.length;
          setNoiseFloor(noiseFloor);
          
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
          if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
          }
        }
      };
      
      sampleNoise();
      
    } catch (error) {
      console.error('Error calibrating noise floor:', error);
    }
  };

  const handleAudioStop = async (audioBlob: Blob) => {
    try {
      // Create FormData and append the audio blob with a filename
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      // Add configuration
      const config = {
        encoding: 'WEBM_OPUS',
        languageCode: 'da-DK',
        enableAutomaticPunctuation: true,
        model: 'default',
        useEnhanced: true,
        alternativeLanguageCodes: ['en-US'],
        enableWordTimeOffsets: true,
        enableSpokenPunctuation: true,
        maxAlternatives: 3,
        sampleRateHertz: 48000
      };
      console.log('Sending config:', config);
      
      // Convert config to string and append
      const configStr = JSON.stringify(config);
      formData.append('config', configStr);

      // Log FormData contents before sending
      const formDataEntries = Array.from(formData.entries()).map(([key, value]) => ({
        key,
        value: value instanceof Blob ? `Blob(${value.size} bytes)` : value,
        valueType: value instanceof Blob ? 'Blob' : typeof value
      }));
      console.log('FormData entries before sending:', formDataEntries);

      // Verify config is in FormData
      const configInFormData = formData.get('config');
      console.log('Config in FormData:', configInFormData);

      // Send audio to speech-to-text API
      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Speech-to-text error:', errorData);
        throw new Error(errorData.error || 'Failed to transcribe audio');
      }

      const responseData = await response.json();
      console.log('Speech-to-text response:', responseData);

      if (!responseData.text) {
        throw new Error('No transcription text in response');
      }

      // Call onRecordingComplete with the audio blob
      onRecordingComplete(audioBlob);
    } catch (error) {
      console.error('Error processing audio:', error);
      throw error;
    } finally {
      // Clean up audio context and stream
      if (audioContextRef.current) {
        await audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
    }
  };

  const startRecording = async () => {
    try {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (autoRecordTimeoutRef.current) {
        clearTimeout(autoRecordTimeoutRef.current);
        autoRecordTimeoutRef.current = null;
      }

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
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      
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
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm;codecs=opus' });
        
        await handleAudioStop(audioBlob);
        
        if (isAutoRecording && !isProcessing) {
          autoRecordTimeoutRef.current = setTimeout(() => {
            startRecording();
          }, 1000);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const recordingStartTime = Date.now();
      let lastPeakTime = Date.now();
      let hasDetectedVoice = false;
      
      const updateLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        let count = 0;
        let peak = 0;
        
        for (let i = 0; i < dataArray.length; i++) {
          const frequency = i * audioContextRef.current!.sampleRate / analyserRef.current.fftSize;
          if (frequency >= VOICE_FREQUENCY_RANGE.min && frequency <= VOICE_FREQUENCY_RANGE.max) {
            const value = dataArray[i] / 255;
            sum += value;
            count++;
            peak = Math.max(peak, value);
          }
        }
        
        const average = count > 0 ? sum / count : 0;
        const normalizedLevel = Math.max(0, average - noiseFloor);
        
        setAudioLevel(normalizedLevel);
        
        if (Date.now() - recordingStartTime > MIN_RECORDING_DURATION) {
          if (peak > VOICE_PEAK_THRESHOLD) {
            lastPeakTime = Date.now();
            hasDetectedVoice = true;
          }
          
          const timeSinceLastPeak = Date.now() - lastPeakTime;
          if (hasDetectedVoice && timeSinceLastPeak > SILENCE_DURATION && normalizedLevel < SILENCE_THRESHOLD) {
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
        }
        
        animationFrameIdRef.current = requestAnimationFrame(updateLevel);
      };
      
      updateLevel();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      setAudioLevel(0);
      setIsSilent(false);
    }
  };

  const stopRecording = (): void => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      setIsSilent(false);
      
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }
  };

  const toggleAutoRecord = () => {
    setIsAutoRecording(prev => {
      const newState = !prev;
      if (newState && !isRecording) {
        calibrateNoiseFloor().then(() => {
          setTimeout(() => {
            startRecording();
          }, 500);
        });
      } else if (!newState && isRecording) {
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
