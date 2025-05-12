'use client';

import React, { useState, useEffect, useRef } from 'react';
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

  const startVoiceRecording = async () => {
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
      
      // Set up audio analysis
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Start recording
      startRecording();
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
                setIsRecording(false);
                // If auto-record is enabled, start a new recording after processing
                if (isAutoRecording) {
                  autoRecordTimeoutRef.current = setTimeout(() => {
                    startVoiceRecording();
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
        
        requestAnimationFrame(updateLevel);
      };
      
      updateLevel();
    } catch (error) {
      console.error('Error starting voice recording:', error);
      setIsRecording(false);
    }
  };

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
        setMessages(prev => prev.slice(0, -1).concat([{
          role: 'assistant',
          content: 'Beklager, jeg kunne ikke forstå optagelsen. Prøv venligst igen.',
          translation: 'Sorry, I could not understand the recording. Please try again.',
          error: true
        }]));
        return;
      }

      // Additional validation to ensure text is a non-empty string
      const trimmedText = text.trim();
      if (trimmedText.length === 0) {
        debugLog.error('Transcription result is empty after trimming', 'Transcription Error');
        setMessages(prev => prev.slice(0, -1).concat([{
          role: 'assistant',
          content: 'Beklager, jeg kunne ikke forstå optagelsen. Prøv venligst igen.',
          translation: 'Sorry, I could not understand the recording. Please try again.',
          error: true
        }]));
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

  const handleRecordingToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startVoiceRecording();
    }
  };

  const toggleAutoRecord = () => {
    setIsAutoRecording(!isAutoRecording);
    if (!isAutoRecording && !isRecording) {
      startVoiceRecording();
    } else if (isAutoRecording && isRecording) {
      stopRecording();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add auto-record effect
  useEffect(() => {
    if (isAutoRecording && !isRecording && !processingState.transcribing && !processingState.thinking && !processingState.speaking) {
      // Start recording after a brief delay
      autoRecordTimeoutRef.current = setTimeout(() => {
        startVoiceRecording();
      }, 500);
    }

    return () => {
      if (autoRecordTimeoutRef.current) {
        clearTimeout(autoRecordTimeoutRef.current);
      }
    };
  }, [isAutoRecording, isRecording, processingState]);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
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

      <div className="border-t p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRecordingToggle}
            className={`p-2 rounded-full ${
              isRecording ? 'bg-red-500' : 'bg-blue-500'
            } text-white`}
          >
            {isRecording ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </button>
          
          <button
            onClick={toggleAutoRecord}
            className={`p-2 rounded-full ${
              isAutoRecording ? 'bg-green-500' : 'bg-gray-500'
            } text-white`}
            title={isAutoRecording ? 'Disable auto-record' : 'Enable auto-record'}
          >
            <Radio className="h-6 w-6" />
          </button>

          {isRecording && (
            <div className="flex-1">
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
        </div>
      </div>
    </div>
  );
}