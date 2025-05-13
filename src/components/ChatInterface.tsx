'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import debugLog from '../utils/debug'
import { GoogleSpeechService } from '../utils/googleSpeechService';
import { Message, ProcessingState, SpeechConfig } from '../types';
import { AudioLevelIndicator } from './AudioLevelIndicator';
import { Mic, MicOff, Radio } from 'lucide-react';

// Constants for voice activity detection
const SILENCE_THRESHOLD = 0.1; // Adjust this value based on testing
const SILENCE_DURATION = 1000; // 1 second of silence to stop recording
const AUTO_RECORD_ENABLED = true; // Enable automatic recording

export default function ChatInterface({ topic }: { topic: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    transcribing: false,
    thinking: false,
    speaking: false
  });
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isSilent, setIsSilent] = useState(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [speechService] = useState<GoogleSpeechService>(() => new GoogleSpeechService());
  const [isAutoRecording, setIsAutoRecording] = useState<boolean>(AUTO_RECORD_ENABLED);
  const autoRecordTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { startRecording, stopRecording } = useReactMediaRecorder({
    audio: {
      sampleRate: 48000,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    },
    onStop: (_blobUrl: string, blob: Blob) => handleAudioStop(blob),
    mediaRecorderOptions: {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 128000
    }
  });

  const startVoiceRecording = useCallback(async () => {
    try {
      // Ensure we're not already recording
      if (isRecording) {
        console.log('Already recording, skipping start');
        return;
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
      
      // Set up audio analysis with better error handling
      try {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new AudioContext();
        }
        
        const analyser = audioContextRef.current.createAnalyser();
        analyserRef.current = analyser;
        analyser.fftSize = 256;
        
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyser);
      } catch (audioError) {
        console.error('Error setting up audio analysis:', audioError);
        // Clean up stream if audio context setup fails
        stream.getTracks().forEach(track => track.stop());
        throw audioError;
      }
      
      // Start recording
      startRecording();
      setIsRecording(true);
      
      // Start audio level monitoring
      const dataArray = new Uint8Array(analyserRef.current!.frequencyBinCount);
      let animationFrameId: number;
      
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
                setIsRecording(false);
                // If auto-record is enabled, start a new recording after processing
                if (isAutoRecording) {
                  // Clear any existing timeout
                  if (autoRecordTimeoutRef.current) {
                    clearTimeout(autoRecordTimeoutRef.current);
                  }
                  autoRecordTimeoutRef.current = setTimeout(() => {
                    if (!isRecording && !processingState.transcribing && !processingState.thinking && !processingState.speaking) {
                      startVoiceRecording();
                    }
                  }, 1000);
                }
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
        
        animationFrameId = requestAnimationFrame(updateLevel);
      };
      
      updateLevel();

      // Return cleanup function
      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
      };
    } catch (error) {
      console.error('Error starting voice recording:', error);
      setIsRecording(false);
      // Clean up any existing timeouts
      if (autoRecordTimeoutRef.current) {
        clearTimeout(autoRecordTimeoutRef.current);
      }
      // Return empty cleanup function for error case
      return () => {};
    }
  }, [isAutoRecording, isRecording, processingState, startRecording, stopRecording]);

  const handleAudioStop = async (audioBlob: Blob): Promise<void> => {
    if (!audioBlob) {
      debugLog.error('No audio blob received', 'Audio Processing Error');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Beklager, ingen lyd blev optaget. Prøv venligst igen.',
        translation: 'Sorry, no audio was recorded. Please try again.',
        error: true
      }]);
      return;
    }

    // Validate audio blob
    if (audioBlob.size < 1000) {
      debugLog.error('Audio recording too short', 'Audio Processing Error');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Beklager, optagelsen var for kort. Prøv venligst igen.',
        translation: 'Sorry, the recording was too short. Please try again.',
        error: true
      }]);
      return;
    }
    
    setProcessingState((prev: ProcessingState) => ({ ...prev, transcribing: true }));
    
    try {
      // Log detailed audio information
      console.log('Audio Recording Details:', {
        size: audioBlob.size,
        type: audioBlob.type,
        lastModified: new Date().toISOString()
      });

      debugLog.transcription('Audio blob details:', { 
        blobSize: audioBlob.size,
        blobType: audioBlob.type,
        firstBytes: await audioBlob.slice(0, 4).text(),
        lastBytes: await audioBlob.slice(-4).text()
      });

      const arrayBuffer = await audioBlob.arrayBuffer();
      console.log('Array Buffer Details:', {
        byteLength: arrayBuffer.byteLength,
        isArrayBuffer: arrayBuffer instanceof ArrayBuffer
      });

      debugLog.transcription('Audio converted to array buffer', { 
        bufferSize: arrayBuffer.byteLength 
      });

      const config: SpeechConfig = {
        encoding: 'WEBM_OPUS',
        languageCode: 'da-DK',
        enableAutomaticPunctuation: true,
        model: 'default',
        useEnhanced: true,
        alternativeLanguageCodes: ['en-US']
      };

      console.log('Sending to transcription with config:', config);
      debugLog.transcription('Sending audio to transcription service');
      
      // Add user message immediately to show recording was received
      setMessages(prev => [...prev, { 
        role: 'user', 
        content: '🎤 [Recording received, transcribing...]',
        isProcessing: true
      }]);

      const text = await speechService.transcribeSpeech(Buffer.from(arrayBuffer), config);
      
      console.log('Transcription result:', text);
      if (!text || text.trim().length === 0) {
        debugLog.error('No transcription text received', 'Transcription Error');
        // Remove the temporary message and add error message
        setMessages(prev => [...prev.slice(0, -1), {
          role: 'assistant',
          content: 'Beklager, jeg kunne ikke forstå optagelsen. Prøv venligst igen.',
          translation: 'Sorry, I could not understand the recording. Please try again.',
          error: true
        }]);
        return;
      }

      // Additional validation to ensure text is a non-empty string
      const trimmedText = text.trim();
      if (trimmedText.length === 0) {
        debugLog.error('Transcription result is empty after trimming', 'Transcription Error');
        setMessages(prev => [...prev.slice(0, -1), {
          role: 'assistant',
          content: 'Beklager, jeg kunne ikke forstå optagelsen. Prøv venligst igen.',
          translation: 'Sorry, I could not understand the recording. Please try again.',
          error: true
        }]);
        return;
      }

      debugLog.transcription('Transcription received', { text: trimmedText });
      
      // Remove the temporary message
      setMessages(prev => prev.slice(0, -1));
      
      // Add the transcribed text as a user message
      setMessages(prev => [...prev, { role: 'user', content: trimmedText }]);
      
      // Send the transcribed text to the chat
      setProcessingState((prev: ProcessingState) => ({ ...prev, thinking: true }));
      
      debugLog.chat('Making API request', { 
        endpoint: '/api/chat',
        method: 'POST',
        body: { message: trimmedText, topic }
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmedText, topic }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Chat API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Add the assistant's response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.danishResponse,
        translation: data.englishTranslation
      }]);

      // Speak the response
      await speakDanish(data.danishResponse);
    } catch (error) {
      console.error('Transcription error details:', error);
      debugLog.error(error, 'Transcription Failed');
      
      // Remove the temporary message if it exists
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.content === '🎤 [Recording received, transcribing...]') {
          return prev.slice(0, -1);
        }
        return prev;
      });
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Beklager, der opstod en fejl under transskriptionen. Prøv venligst igen.',
        translation: 'Sorry, an error occurred during transcription. Please try again.',
        error: true
      }]);
    } finally {
      setProcessingState((prev: ProcessingState) => ({ 
        ...prev, 
        transcribing: false,
        thinking: false 
      }));
    }
  };

  const speakDanish = async (text: string): Promise<void> => {
    try {
      setProcessingState((prev: ProcessingState) => ({ ...prev, speaking: true }));
      
      const audioContent = await speechService.synthesizeSpeech(text);
      await playAudio(audioContent);
    } catch (error) {
      console.error('Speech failed:', error);
      debugLog.error(error, 'Speech synthesis failed');
    } finally {
      setProcessingState((prev: ProcessingState) => ({ ...prev, speaking: false }));
    }
  };

  const playAudio = async (audioContent: ArrayBuffer): Promise<void> => {
    const blob = new Blob([audioContent], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    try {
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = () => reject();
        audio.play();
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const handleRecordingToggle = useCallback(() => {
    if (isRecording) {
      stopRecording();
      setIsRecording(false);
    } else {
      startVoiceRecording();
    }
  }, [isRecording, startVoiceRecording, stopRecording]);

  const toggleAutoRecord = useCallback(() => {
    setIsAutoRecording(prev => {
      const newState = !prev;
      if (newState && !isRecording) {
        // If enabling auto-record and not currently recording, start recording
        setTimeout(() => {
          startVoiceRecording();
        }, 500);
      } else if (!newState && isRecording) {
        // If disabling auto-record and currently recording, stop recording
        stopRecording();
        setIsRecording(false);
      }
      return newState;
    });
  }, [isRecording, startVoiceRecording, stopRecording]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add auto-record effect
  useEffect(() => {
    if (isAutoRecording && !isRecording && !processingState.transcribing && !processingState.thinking && !processingState.speaking) {
      // Clear any existing timeout
      if (autoRecordTimeoutRef.current) {
        clearTimeout(autoRecordTimeoutRef.current);
      }
      
      // Start recording after a brief delay
      autoRecordTimeoutRef.current = setTimeout(() => {
        if (!isRecording) {  // Double check we're still not recording
          startVoiceRecording();
        }
      }, 1000);  // Increased delay to ensure previous processing is complete
    }

    return () => {
      if (autoRecordTimeoutRef.current) {
        clearTimeout(autoRecordTimeoutRef.current);
      }
    };
  }, [isAutoRecording, isRecording, processingState, startVoiceRecording]);

  // Update cleanup effect
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (error) {
          console.error('Error closing AudioContext:', error);
        }
      }
      if (autoRecordTimeoutRef.current) {
        clearTimeout(autoRecordTimeoutRef.current);
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.translation && (
                <p className="mt-2 text-sm opacity-75">{message.translation}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRecordingToggle}
              className={`p-2 rounded-full ${
                isRecording ? 'bg-red-500' : 'bg-blue-500'
              } text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              disabled={processingState.transcribing || processingState.thinking || processingState.speaking}
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
              disabled={processingState.transcribing || processingState.thinking || processingState.speaking}
            >
              <Radio className={`h-6 w-6 ${isAutoRecording ? 'animate-pulse' : ''}`} aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {isRecording && (
              <div className="w-32">
                <AudioLevelIndicator level={audioLevel} isSilent={isSilent} />
              </div>
            )}
            
            {(processingState.transcribing || processingState.thinking || processingState.speaking) && (
              <span className="text-sm text-gray-500">
                {processingState.transcribing ? 'Transcribing...' :
                 processingState.thinking ? 'Thinking...' :
                 'Speaking...'}
              </span>
            )}
            
            {isAutoRecording && !isRecording && !processingState.transcribing && !processingState.thinking && !processingState.speaking && (
              <span className="text-sm text-green-500 font-medium">
                Auto-record enabled
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}