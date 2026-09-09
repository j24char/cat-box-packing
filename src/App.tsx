import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import { analytics } from './services/analytics';
import { 
  useFonts, 
  Fredoka_400Regular, 
  Fredoka_700Bold 
} from '@expo-google-fonts/fredoka';

const SESSION_TOUCH_INTERVAL_MS = 15_000;
const SYNC_INTERVAL_MS = 60_000;

export default function App() {
  const [fontsLoaded] = useFonts({
    'Fredoka-Regular': Fredoka_400Regular,
    'Fredoka-Bold': Fredoka_700Bold,
  });

  // --- Anonymous analytics lifecycle (PRD §7) ---
  useEffect(() => {
    // Start a session, finalizing any stale one from a previous launch.
    analytics.startSession().finally(() => undefined);

    // Heartbeat + periodic best-effort Firebase sync.
    const touchTimer = setInterval(() => {
      analytics.touch().finally(() => undefined);
    }, SESSION_TOUCH_INTERVAL_MS);

    const syncTimer = setInterval(() => {
      analytics.flush().finally(() => undefined);
    }, SYNC_INTERVAL_MS);

    // Flush once shortly after boot so fresh sessions land.
    const bootFlushTimer = setTimeout(() => {
      analytics.flush().finally(() => undefined);
    }, 8_000);

    return () => {
      clearInterval(touchTimer);
      clearInterval(syncTimer);
      clearTimeout(bootFlushTimer);
      analytics.endSession().finally(() => undefined);
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}