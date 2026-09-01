// src/hooks/useAudio.ts

import { useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';

// Audio asset map
const AUDIO_ASSETS = {
  meow: require('../../assets/audio/meow.mp3'),
  purr: require('../../assets/audio/purr.mp3'),
  click: require('../../assets/audio/click.mp3'),
};

export type SoundEffect = keyof typeof AUDIO_ASSETS;

export const useAudio = () => {
  const soundsRef = useRef<Map<SoundEffect, Audio.Sound>>(new Map());

  // Configure global audio mode once on mount
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.warn('Failed to configure audio mode:', error);
      }
    };

    setupAudio();

    // Clean up sound objects on unmount
    return () => {
      soundsRef.current.forEach(async (sound) => {
        try {
          await sound.unloadAsync();
        } catch {
          // Object already unloaded
        }
      });
      soundsRef.current.clear();
    };
  }, []);

  // Play a sound effect with automatic instance caching
  const playSound = useCallback(async (effect: SoundEffect) => {
    try {
      let soundObj = soundsRef.current.get(effect);

      if (soundObj) {
        await soundObj.replayAsync();
      } else {
        const { sound } = await Audio.Sound.createAsync(AUDIO_ASSETS[effect]);
        soundsRef.current.set(effect, sound);
        await sound.playAsync();
      }
    } catch (error) {
      console.warn(`Failed to play sound '${effect}':`, error);
    }
  }, []);

  return { playSound };
};

export default useAudio;