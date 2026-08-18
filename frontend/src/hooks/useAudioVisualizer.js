import { useState, useRef, useCallback, useEffect } from 'react';

const isDev = import.meta.env?.DEV ?? false;

function devLog(category, ...args) {
  if (isDev) {
    console.log(`[${category}]`, ...args);
  }
}

export function useAudioVisualizer({ onAudioActivity }) {
  const [candidateAudioLevel, setCandidateAudioLevel] = useState(0);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isMeterActiveRef = useRef(false);

  const stopAudioMeter = useCallback(() => {
    devLog('AUDIO', 'stopAudioMeter called');
    isMeterActiveRef.current = false;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Disconnect source node
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch (e) { /* ignore */ }
      sourceNodeRef.current = null;
    }

    analyserRef.current = null;

    // Release microphone tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        devLog('AUDIO', 'media track stopped:', track.kind);
      });
      mediaStreamRef.current = null;
    }

    // Close AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setCandidateAudioLevel(0);
  }, []);

  const startAudioMeter = useCallback(async (isSpeakingRef) => {
    devLog('AUDIO', 'startAudioMeter called');
    try {
      // Always get a fresh stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      // Always create fresh AudioContext to avoid stale state
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      audioContextRef.current = new AudioContext();

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      source.connect(analyser);
      sourceNodeRef.current = source;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      isMeterActiveRef.current = true;

      const checkVolume = () => {
        // Use ref-based check — avoids stale closure
        if (!isMeterActiveRef.current) {
          setCandidateAudioLevel(0);
          return;
        }

        // Also check the speaking ref passed from the hook
        if (isSpeakingRef && !isSpeakingRef.current) {
          setCandidateAudioLevel(0);
          return;
        }

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setCandidateAudioLevel(normalized);

        // If audio energy is detected above threshold (> 8), trigger activity callback
        if (normalized > 8 && onAudioActivity) {
          onAudioActivity();
        }

        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      animationFrameRef.current = requestAnimationFrame(checkVolume);
    } catch (err) {
      console.warn('[AUDIO] meter initialization warning:', err?.message);
    }
  }, [onAudioActivity]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudioMeter();
    };
  }, [stopAudioMeter]);

  return {
    candidateAudioLevel,
    startAudioMeter,
    stopAudioMeter
  };
}
