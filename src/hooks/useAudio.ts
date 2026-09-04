// src/hooks/useAudio.ts

import { useEffect, useCallback } from 'react';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';

// Audio asset map
const AUDIO_ASSETS = {
  meow: require('../../assets/audio/meow.mp3'),
  purr: require('../../assets/audio/purr.mp3'),
  click: require('../../assets/audio/click.mp3'),
} as const;

export type SoundEffect = keyof typeof AUDIO_ASSETS;

export const useAudio = () => {
  // Initialize dedicated players for each sound asset using expo-audio hook
  const meowPlayer = useAudioPlayer(AUDIO_ASSETS.meow);
  const purrPlayer = useAudioPlayer(AUDIO_ASSETS.purr);
  const clickPlayer = useAudioPlayer(AUDIO_ASSETS.click);

  const playersMap = {
    meow: meowPlayer,
    purr: purrPlayer,
    click: clickPlayer,
  };

  // Configure global audio mode once on mount
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
        });
      } catch (error) {
        console.warn('Failed to configure audio mode:', error);
      }
    };

    setupAudio();
  }, []);

  // Play a sound effect by resetting playback time and triggering play
  const playSound = useCallback((effect: SoundEffect) => {
    try {
      const player = playersMap[effect];
      if (player) {
        player.seekTo(0);
        player.play();
      }
    } catch (error) {
      console.warn(`Failed to play sound '${effect}':`, error);
    }
  }, [meowPlayer, purrPlayer, clickPlayer]);

  return { playSound };
};

export default useAudio;