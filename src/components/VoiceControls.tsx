import { useState, useRef, useEffect } from 'react';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { SpeechClient } from '@google-cloud/speech';
import * as fs from 'fs';
import * as path from 'path';

interface VoiceControlsProps {
  onTranscription: (text: string) => void;
  danishText: string;
}

export default function VoiceControls({ onTranscription, danishText }: VoiceControlsProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Google Cloud clients
  const credentials = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'danish-buddy-tts-4bf73d2c32fa.json'), 'utf8')
  );

  const ttsClient = new TextToSpeechClient({ credentials });
  const sttClient = new SpeechClient({ credentials });

  // Handle microphone recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // Transcribe audio using Google Speech-to-Text
  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const audioBytes = await audioBlob.arrayBuffer();
      const audioContent = Buffer.from(audioBytes).toString('base64');

      const [response] = await sttClient.recognize({
        audio: {
          content: audioContent,
        },
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: 'da-DK',
          enableAutomaticPunctuation: true,
        },
      });

      const transcription = response.results
        ?.map(result => result.alternatives?.[0]?.transcript)
        .join('\n');

      if (transcription) {
        onTranscription(transcription);
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
    }
  };

  // Play Danish text using Google Text-to-Speech
  const playDanishText = async () => {
    try {
      const [response] = await ttsClient.synthesizeSpeech({
        input: { text: danishText },
        voice: { languageCode: 'da-DK', ssmlGender: 'NEUTRAL' },
        audioConfig: { audioEncoding: 'MP3' },
      });

      if (response.audioContent) {
        const audioBlob = new Blob([response.audioContent], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
          setIsPlaying(true);
          
          audioRef.current.onended = () => {
            setIsPlaying(false);
            URL.revokeObjectURL(audioUrl);
          };
        }
      }
    } catch (error) {
      console.error('Error synthesizing speech:', error);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Microphone button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`p-2 rounded-full ${
          isRecording ? 'bg-red-500' : 'bg-gray-200'
        } hover:bg-gray-300 transition-colors`}
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      </button>

      {/* Speaker button */}
      {danishText && (
        <button
          onClick={playDanishText}
          className={`p-2 rounded-full ${
            isPlaying ? 'bg-blue-500' : 'bg-gray-200'
          } hover:bg-gray-300 transition-colors`}
          title="Play Danish Text"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
          </svg>
        </button>
      )}

      {/* Hidden audio element */}
      <audio ref={audioRef} />
    </div>
  );
} 