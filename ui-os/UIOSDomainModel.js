const UI_OS_DOMAIN_ENTITIES = [
  'UiTokenSet',
  'ThemeSnapshot',
  'TypographySnapshot',
  'LayoutSnapshot',
  'NavigationSnapshot',
  'CommandCenterSnapshot',
  'CopilotUiSnapshot',
  'ModalSnapshot',
  'DrawerSnapshot',
  'TableSnapshot',
  'FormSnapshot',
  'CardSnapshot',
  'TimelineSnapshot',
  'StateSnapshot',
  'FeedbackSnapshot',
  'AccessibilitySnapshot',
  'BrandingSnapshot',
  'UiTelemetrySnapshot',
  'UiObservabilitySnapshot',
];

export function listUiOsDomainEntities() {
  return [...UI_OS_DOMAIN_ENTITIES];
}

export default UI_OS_DOMAIN_ENTITIES;
