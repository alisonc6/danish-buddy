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
    audio: true,
    onStop: (_blobUrl: string, blob: Blob) => handleAudioStop(blob),
    mediaRecorderOptions: {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 48000
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
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          setupAudioAnalyser(stream);
          startRecording();
        })
        .catch(error => {
          debugLog.error(error, 'Failed to get audio stream');
          setIsRecording(false);
        });
    } else {
      setIsRecording(false);
      stopRecording();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setAudioLevel(0);
    }
  };

  const handleAudioStop = async (audioBlob: Blob): Promise<void> => {
    if (!audioBlob) {
      debugLog.error('No audio blob received', 'Audio Processing Error');
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
      debugLog.transcription('Audio blob details:', { 
        blobSize: audioBlob.size,
        blobType: audioBlob.type,
        firstBytes: await audioBlob.slice(0, 4).text(),
        lastBytes: await audioBlob.slice(-4).text()
      });

      const arrayBuffer = await audioBlob.arrayBuffer();
      debugLog.transcription('Audio converted to array buffer', { 
        bufferSize: arrayBuffer.byteLength 
      });

      const config: SpeechConfig = {
        encoding: 'WEBM_OPUS',
        languageCode: 'da-DK',
        enableAutomaticPunctuation: true,
        model: 'latest_long',
        useEnhanced: true
      };

      debugLog.transcription('Sending audio to transcription service');
      const text = await speechService.transcribeSpeech(Buffer.from(arrayBuffer), config);
      
      if (text) {
        debugLog.transcription('Transcription received', { text });
        await sendMessage(text);
      } else {
        debugLog.error('No transcription text received', 'Transcription Error');
        throw new Error('No transcription text received');
      }
    } catch (error) {
      debugLog.error(error, 'Transcription Failed');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Beklager, der opstod en fejl under transskriptionen. Prøv venligst igen.',
        translation: 'Sorry, an error occurred during transcription. Please try again.'
      }]);
    } finally {
      setProcessingState((prev: ProcessingState) => ({ ...prev, transcribing: false }));
    }
  };

  const speakDanish = async (text: string, translation?: string): Promise<void> => {
    try {
      setProcessingState((prev: ProcessingState) => ({ ...prev, speaking: true }));
      
      const audioContent = await speechService.synthesizeSpeech(text);
      await playAudio(audioContent);

      if (translation) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const translationAudio = await speechService.synthesizeSpeech(
          translation,
          `en_${translation}`
        );
        await playAudio(translationAudio);
      }
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

  const sendMessage = async (content: string): Promise<void> => {
    debugLog.chat('Sending message', { content, topic });

    try {
      setProcessingState((prev: ProcessingState) => ({ ...prev, thinking: true }));
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content, topic }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const newMessages: Message[] = [
        { role: 'user', content },
        { role: 'assistant', content: data.content, translation: data.translation }
      ];
      
      setMessages((prev: Message[]) => [...prev, ...newMessages]);
      
      if (data.content) {
        await speakDanish(data.content);
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
      debugLog.error(error, 'Chat API call failed');
    } finally {
      setProcessingState((prev: ProcessingState) => ({ ...prev, thinking: false }));
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