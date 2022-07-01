import { useRef } from "react";
import vad from "voice-activity-detection";

export const useVad = () => {
  const audioContextRef = useRef(null);
  const start = ({
    audioContext,
    stream,
    onVoiceStart,
    onVoiceStop,
    onUpdate
  }) => {
    audioContextRef.current = audioContext || new AudioContext();
    vad(audioContextRef.current, stream, {
      onVoiceStart,
      onVoiceStop,
      onUpdate
    });
  };

  const suspend = () => {
    if (audioContextRef.current.state === "running") {
      audioContextRef.current.suspend();
    }
  };

  const stop = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  return { start, stop, suspend };
};
