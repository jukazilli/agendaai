export const colorPrimitives = {
  canvas: "#F3F8F7",
  surface: "#FBFEFD",
  ink: "#13252B",
  teal: "#0B7A75",
  ember: "#D86A43",
  mist: "#D9E7E3",
  success: "#2E9F61",
  warning: "#DE9A25",
  danger: "#D35B4A"
} as const;

export const colorSemantics = {
  bg: {
    default: colorPrimitives.canvas,
    surface: colorPrimitives.surface,
    mutedSurface: colorPrimitives.mist
  },
  text: {
    primary: colorPrimitives.ink,
    muted: "rgba(19, 37, 43, 0.72)",
    inverse: colorPrimitives.surface
  },
  border: {
    subtle: colorPrimitives.mist,
    strong: "rgba(19, 37, 43, 0.12)"
  },
  brand: {
    primary: colorPrimitives.teal,
    secondary: colorPrimitives.ember
  },
  status: {
    success: colorPrimitives.success,
    warning: colorPrimitives.warning,
    danger: colorPrimitives.danger,
    info: colorPrimitives.teal
  }
} as const;

export const fontFamilies = {
  display: "\"Bodoni Moda\", \"Times New Roman\", serif",
  sans: "\"Manrope\", Inter, system-ui, sans-serif",
  mono: "\"IBM Plex Mono\", \"SFMono-Regular\", monospace"
} as const;

export const typographyScale = {
  "display.l": {
    fontFamily: fontFamilies.display,
    fontSizePx: 64,
    lineHeightPx: 64,
    fontWeight: 500
  },
  "display.m": {
    fontFamily: fontFamilies.display,
    fontSizePx: 44,
    lineHeightPx: 48,
    fontWeight: 500
  },
  "title.l": {
    fontFamily: fontFamilies.sans,
    fontSizePx: 28,
    lineHeightPx: 36,
    fontWeight: 500
  },
  "title.m": {
    fontFamily: fontFamilies.sans,
    fontSizePx: 20,
    lineHeightPx: 28,
    fontWeight: 500
  },
  "body.l": {
    fontFamily: fontFamilies.sans,
    fontSizePx: 18,
    lineHeightPx: 30,
    fontWeight: 400
  },
  "body.m": {
    fontFamily: fontFamilies.sans,
    fontSizePx: 15,
    lineHeightPx: 24,
    fontWeight: 400
  },
  caption: {
    fontFamily: fontFamilies.sans,
    fontSizePx: 12,
    lineHeightPx: 18,
    fontWeight: 500
  },
  "mono.s": {
    fontFamily: fontFamilies.mono,
    fontSizePx: 12,
    lineHeightPx: 16,
    fontWeight: 500
  }
} as const;

export const spacingScale = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  7: 48,
  8: 64
} as const;

export const radiiScale = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 28
} as const;

export const elevationScale = {
  none: "none",
  low: "0 8px 24px rgba(19, 37, 43, 0.08)",
  mid: "0 16px 40px rgba(19, 37, 43, 0.12)",
  high: "0 24px 56px rgba(19, 37, 43, 0.16)"
} as const;

export const motionScale = {
  quick: "160ms",
  standard: "240ms",
  deliberate: "320ms"
} as const;

export const breakpoints = {
  xs: 480,
  sm: 768,
  md: 1024,
  lg: 1280,
  xl: 1536
} as const;

export const agendaUiTokens = {
  colorPrimitives,
  colorSemantics,
  fontFamilies,
  typographyScale,
  spacingScale,
  radiiScale,
  elevationScale,
  motionScale,
  breakpoints
} as const;

