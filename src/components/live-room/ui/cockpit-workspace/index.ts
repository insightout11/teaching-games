/**
 * CC-08A cockpit composition. Controlled components only: no state, no
 * fetching, no runtime assumptions. See CC-08A-review.md for the exact runtime
 * dependencies CC-08B has to satisfy.
 */
export { CockpitWorkspace } from './cockpit-workspace';
export type { CockpitWorkspaceProps } from './cockpit-workspace';
export { CockpitDock, CockpitFrame, CockpitTopBar, DockButton } from './cockpit-chrome';
export { MaterialStrip, MaterialTray } from './material-tray';
export {
  IdleStage,
  MaterialStage,
  ModuleStage,
  PublicStage,
  ScoreStrip,
  StageFrame,
} from './teaching-stage';
export {
  CatalogueDrawer,
  CockpitOverlay,
  JoinPanel,
  ScoreboardPanel,
  SessionMenuPanel,
  TaskDrawer,
  WidgetWindow,
} from './cockpit-panels';
export { cockpitReducer, isShown, publicSummary, selectedItem } from './cockpit-state';
export type { CockpitAction } from './cockpit-state';
export * from './types';
