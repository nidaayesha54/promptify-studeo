import { useState, useRef, useEffect, useCallback } from 'react';

// Decoder functions (must be outside component/hook scope)
const decode = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

export const useAudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  // Ensure AudioContext is available
  useEffect(() => {
    if (!audioContextRef.current) {
        // FIX: Cast window to `any` to access vendor-prefixed `webkitAudioContext` for older browser compatibility.
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if(AudioContext) {
            audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        } else {
            console.error("Web Audio API is not supported in this browser.");
        }
    }
    
    return () => {
      // Cleanup on unmount
      if (sourceRef.current) {
        sourceRef.current.stop();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playAudio = useCallback(async (base64Audio: string) => {
    if (!audioContextRef.current) {
        console.error("AudioContext not initialized.");
        return;
    }

    if (sourceRef.current) {
        sourceRef.current.stop();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    setIsPlaying(true);
    try {
      const audioBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
        setIsPlaying(false);
        sourceRef.current = null;
      };
      source.start();
      sourceRef.current = source;
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlaying(false);
    }
  }, []);
  
  return { playAudio, isPlaying };
};
