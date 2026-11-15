// The one place for Cloutlet's look.
// Change a value here and every screen updates.

export const colors = {
  background: '#FAF9F6', // warm off-white page
  surface: '#FFFFFF', // cards, inputs
  text: '#1F1E1C', // main text
  textSecondary: '#6B6862', // captions, labels
  divider: '#E9E6DF', // lines and borders
  buttonFill: '#E9E6DF', // primary button (soft warm fill, not navy)
  buttonFillPressed: '#DEDAD1',
  placeholder: '#E4E0D8', // shown while a photo loads or if it fails
  overlay: 'rgba(31, 30, 28, 0.6)', // small pills on top of photos
} as const;

// Font names match what we load in src/app/_layout.tsx
export const fonts = {
  heading: 'Newsreader_500Medium',
  headingRegular: 'Newsreader_400Regular',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
} as const;

// Spacing scale, in points
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  screen: 20, // left/right padding on every screen
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

// Text styles. Use like: <Text style={type.h1}>
export const type = {
  display: { fontFamily: fonts.heading, fontSize: 34, lineHeight: 40, color: colors.text },
  h1: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 34, color: colors.text },
  h2: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 28, color: colors.text },
  h3: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 24, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
  bodyStrong: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 22, color: colors.text },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
} as const;

export const theme = { colors, fonts, spacing, radius, type };
export default theme;
