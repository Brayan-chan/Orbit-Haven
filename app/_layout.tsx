if (typeof document !== 'undefined' && !document.getElementById('genvibe-inspector')) {
  var __gvInspector = document.createElement('script');
  __gvInspector.id = 'genvibe-inspector';
  __gvInspector.src = 'https://genvibe.pro/inspector-script.js?v=e2b-reload1';
  document.head.appendChild(__gvInspector);
}

if (typeof document !== 'undefined' && String(console.error).indexOf('gvSvgOrigin') < 0) {
  var __gvConsoleError = console.error;
  console.error = function gvSvgOrigin() {
    var __gvMsg = Array.prototype.join.call(arguments, ' ');
    if (__gvMsg.indexOf('Invalid DOM property') >= 0 && __gvMsg.indexOf('transform-origin') >= 0) return;
    return __gvConsoleError.apply(console, Array.prototype.slice.call(arguments));
  };
}

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