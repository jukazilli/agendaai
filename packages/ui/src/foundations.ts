import {
  agendaUiTokens,
  breakpoints,
  colorSemantics,
  motionScale,
  radiiScale,
  spacingScale,
  typographyScale
} from "./tokens";

export const foundationClassNames = {
  themeLight: "ag-theme-light",
  surfaceCard: "ag-surface-card",
  textDisplayL: "ag-text-display-l",
  textDisplayM: "ag-text-display-m",
  textTitleL: "ag-text-title-l",
  textTitleM: "ag-text-title-m",
  textBodyL: "ag-text-body-l",
  textBodyM: "ag-text-body-m",
  textCaption: "ag-text-caption",
  textMonoS: "ag-text-mono-s"
} as const;

export const foundationCssAssetPath = "@agendaai/ui/foundations.css";

export const agendaUiFoundations = {
  foundations: {
    gridBasePx: 8,
    spacingScale,
    radiiScale,
    elevationScale: agendaUiTokens.elevationScale,
    motionScale,
    breakpoints,
    typographyScale,
    colorSemantics
  },
  classNames: foundationClassNames,
  cssAssetPath: foundationCssAssetPath
} as const;

