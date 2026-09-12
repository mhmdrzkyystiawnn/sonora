/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type AudioContextValue = {
  playingKey: string | null;
  toggle: (key: string, src: string) => void;
};

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);

  const toggle = useCallback(
    (key: string, src: string) => {
      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;

      if (playingKey === key) {
        audio.pause();
        setPlayingKey(null);
        return;
      }

      if (audio.src !== src) {
        audio.src = src;
        audio.preload = "auto";
      }

      void audio.play().catch(() => setPlayingKey(null));
      setPlayingKey(key);
    },
    [playingKey],
  );

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const handleEnded = () => setPlayingKey(null);
    audio.addEventListener("ended", handleEnded);

    return () => audio.removeEventListener("ended", handleEnded);
  }, []);

  return (
    <AudioContext.Provider value={{ playingKey, toggle }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudioPlayer() {
  const ctx = useContext(AudioContext);

  if (!ctx) {
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  }

  return ctx;
}