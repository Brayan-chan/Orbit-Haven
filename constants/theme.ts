export const C = {
  bg: '#050816',
  bg2: '#0A1030',
  panel: 'rgba(9,16,48,0.78)',
  panelSolid: '#0B1238',
  line: 'rgba(61,123,255,0.6)',
  lineSoft: 'rgba(61,123,255,0.28)',
  cyan: '#35E0FF',
  blue: '#3D7BFF',
  violet: '#9B5CFF',
  purple: '#6D2BFF',
  magenta: '#FF4FD8',
  orange: '#FF8A2A',
  red: '#FF3B5C',
  green: '#3CFFA0',
  gold: '#FFC83D',
  text: '#EAF2FF',
  dim: '#8FA3D6',
  faint: '#566494',
};

export const F = {
  regular: 'Exo2_500Medium',
  semi: 'Exo2_600SemiBold',
  bold: 'Exo2_700Bold',
  black: 'Exo2_800ExtraBold',
  italic: 'Exo2_800ExtraBold_Italic',
  logo: 'Exo2_900Black_Italic',
};

export const glow = (color: string, radius = 14, opacity = 0.7) => ({
  shadowColor: color,
  shadowOpacity: opacity,
  shadowRadius: radius,
  shadowOffset: { width: 0, height: 0 },
  elevation: 6,
});
