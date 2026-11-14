import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useFonts, Exo2_500Medium, Exo2_600SemiBold, Exo2_700Bold, Exo2_800ExtraBold, Exo2_800ExtraBold_Italic, Exo2_900Black_Italic } from '@expo-google-fonts/exo-2';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { GameProvider } from '@/store/GameStore';
import { C } from '@/constants/theme';

if (typeof document !== 'undefined' && !document.getElementById('genvibe-inspector')) {
  const inspector = document.createElement('script');
  inspector.id = 'genvibe-inspector';
  inspector.src = 'https://genvibe.pro/inspector-script.js?v=e2b-reload1';
  document.head.appendChild(inspector);
}

if (typeof document !== 'undefined' && String(console.error).indexOf('gvSvgOrigin') < 0) {
  const originalConsoleError = console.error;
  console.error = function gvSvgOrigin(...args: unknown[]) {
    const message = args.join(' ');
    if (message.includes('Invalid DOM property') && message.includes('transform-origin')) return;
    return originalConsoleError.apply(console, args);
  };
}

export default function RootLayout() {
  useFrameworkReady();
  const [loaded] = useFonts({ Exo2_500Medium, Exo2_600SemiBold, Exo2_700Bold, Exo2_800ExtraBold, Exo2_800ExtraBold_Italic, Exo2_900Black_Italic });

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
  }, []);

  if (!loaded) return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.bg }}>
      <GameProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: C.bg } }}>
          <Stack.Screen name="+not-found" />
        </Stack>
      </GameProvider>
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}
