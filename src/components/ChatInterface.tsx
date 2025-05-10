'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import debugLog from '../utils/debug'
import { GoogleSpeechService } from '../utils/googleSpeechService';
import { Message, ProcessingState, SpeechConfig } from '../types';
import AudioLevelIndicator from './AudioLevelIndicator';

export default function ChatInterface({ topic }: { topic: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    transcribing: false,
    thinking: false,
    speaking: false
  });
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [speechService] = useState<GoogleSpeechService>(() => new GoogleSpeechService());

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

  const setupAudioAnalyser = (stream: MediaStream): void => {
    if (!audioContext) {
      const newAudioContext = new AudioContext();
      setAudioContext(newAudioContext);
      const analyser = newAudioContext.createAnalyser();
      const source = newAudioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      audioAnalyserRef.current = analyser;
      updateAudioLevel();
    }
  };

  const updateAudioLevel = (): void => {
    if (audioAnalyserRef.current && isRecording) {
      const dataArray = new Uint8Array(audioAnalyserRef.current.frequencyBinCount);
      audioAnalyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const normalizedLevel = Math.min(average / 128, 1);
      setAudioLevel(normalizedLevel);
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  };

  const handleRecordingToggle = (): void => {
    if (!isRecording) {
      setIsRecording(true);
      navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
        .then(stream => {
          setupAudioAnalyser(stream);
          startRecording();
        })
        .catch(error => {
          debugLog.error(error, 'Failed to get audio stream');
          setIsRecording(false);
        });
    } else {
      setTimeout(() => {
        setIsRecording(false);
        stopRecording();
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        setAudioLevel(0);
      }, 500);
    }
  };

  const handleAudioStop = async (audioBlob: Blob): Promise<void> => {
    if (!audioBlob) {
      debugLog.error('No audio blob received', 'Audio Processing Error');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Beklager, ingen lyd blev optaget. Prøv venligst igen.',
        translation: 'Sorry, no audio was recorded. Please try again.'
      }]);
      return;
    }

    // Validate audio blob
    if (audioBlob.size < 1000) {
      debugLog.error('Audio recording too short', 'Audio Processing Error');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Beklager, optagelsen var for kort. Prøv venligst igen.',
        translation: 'Sorry, the recording was too short. Please try again.'
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
        content: '🎤 [Recording received, transcribing...]' 
      }]);

      const text = await speechService.transcribeSpeech(Buffer.from(arrayBuffer), config);
      
      console.log('Transcription result:', text);
      if (!text || text.trim().length === 0) {
        debugLog.error('No transcription text received', 'Transcription Error');
        // Remove the temporary message and add error message
        setMessages(prev => prev.slice(0, -1).concat([{
          role: 'assistant',
          content: 'Beklager, jeg kunne ikke forstå optagelsen. Prøv venligst igen.',
          translation: 'Sorry, I could not understand the recording. Please try again.'
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
          translation: 'Sorry, I could not understand the recording. Please try again.'
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
        debugLog.error(`HTTP error! status: ${response.status}`, 'Chat API Error');
        debugLog.error(errorData, 'Chat API Error Response');
        
        // Handle validation errors specifically
        if (response.status === 400 && errorData.code === 'VALIDATION_ERROR') {
          setMessages(prev => prev.slice(0, -1).concat([{
            role: 'assistant',
            content: 'Beklager, der var et problem med beskeden. Prøv venligst igen.',
            translation: 'Sorry, there was a problem with the message. Please try again.'
          }]));
          return;
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      debugLog.chat('Received API response', { data });
      
      if (!data.danishResponse || !data.englishTranslation) {
        debugLog.error('Invalid response format', 'Chat API Error');
        throw new Error('Invalid response format from chat API');
      }
      
      // Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.danishResponse,
        translation: data.englishTranslation
      }]);
      
      // Only speak the Danish response
      if (data.danishResponse) {
        await speakDanish(data.danishResponse);
      }
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
        translation: 'Sorry, an error occurred during transcription. Please try again.'
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
              className={`max-w-[70%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <p>{message.content}</p>
              {message.translation && (
                <p className="text-sm mt-2 opacity-80">{message.translation}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRecordingToggle}
            className={`p-2 rounded-full ${
              isRecording
                ? 'bg-red-500 text-white'
                : 'bg-blue-500 text-white'
            }`}
            disabled={processingState.transcribing || processingState.thinking}
          >
            {isRecording ? '⏹️' : '🎤'}
          </button>
          {isRecording && <AudioLevelIndicator level={audioLevel} />}
          {(processingState.transcribing || processingState.thinking) && (
            <span className="text-gray-500">Processing...</span>
          )}
        </div>
      </div>
    </div>
  );
}