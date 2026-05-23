# Storybook Coverage Matrix (App x Stories)

Updated: 2026-05-23

This matrix maps reusable UI blocks used by the app modules to Storybook stories under `components/stories`.

## Dashboard

| App primitive in use | Storybook story | Status |
|---|---|---|
| `status-card` | `App/Widgets/StatusCards` | Covered |
| `tracker` steps flow | `App/Widgets/ProgressTracker` | Covered |
| loading placeholder | `App/Widgets/LoadingState` | Covered |
| stat badges/cards (`ui-badge`, `ui-stat-card`) | `App/Ui Kit/BadgesAndStats` | Covered |

## Advogado

| App primitive in use | Storybook story | Status |
|---|---|---|
| form scaffolding (`ui-field`, `ui-label`, `ui-input`, `ui-select`, `ui-textarea`) | `App/Ui Kit/FieldScaffold` | Covered |
| status chips (`ui-badge`) | `App/Ui Kit/BadgesAndStats` | Covered |
| timeline feed (`ui-timeline`, `ui-timeline-item`, `ui-timeline-dot`) | `App/Ui Kit/TimelineDotVariant` | Covered |
| operational table (`ui-table`, responsive) | `App/Ui Kit/TableResponsive` | Covered |

## Cliente

| App primitive in use | Storybook story | Status |
|---|---|---|
| forms and profile updates (`ui-input`, `ui-select`, `ui-textarea`) | `App/Ui Kit/FormFields`, `App/Ui Kit/FieldScaffold` | Covered |
| document upload (`ui-upload`) | `App/Ui Kit/UploadAndToast` | Covered |
| milestones and history (`ui-steps`, `ui-timeline`) | `App/Ui Kit/StepsAndTimeline`, `App/Ui Kit/TimelineDotVariant` | Covered |
| list/filter/search (`ui-search`, `ui-pagination`) | `App/Ui Kit/SearchAndPagination` | Covered |

## Documentos

| App primitive in use | Storybook story | Status |
|---|---|---|
| modal and drawer interactions | `App/Ui Kit/Modal`, `App/Ui Kit/Drawer` | Covered |
| status + tags (`ui-badge`) | `App/Ui Kit/BadgesAndStats` | Covered |
| legal process table | `App/Ui Kit/TableResponsive` | Covered |
| calendar and board style workflows | `App/Ui Kit/CalendarAndKanban` | Covered |

## Cross-module app shell

| App primitive in use | Storybook story | Status |
|---|---|---|
| tab navigation (`ui-tabs`) | `App/Ui Kit/TabsAndDropdown` | Covered |
| dropdown actions (`ui-dropdown`) | `App/Ui Kit/TabsAndDropdown` | Covered |
| toasts (`ui-toast`) | `App/Ui Kit/UploadAndToast` | Covered |

## Notes

- This matrix is scoped to reusable UI primitives and shared widgets.
- Domain-specific React components in `apps/web/src/components/**` (for example, data-fetching containers and role-aware panels) are intentionally represented through primitive stories rather than 1:1 runtime mocks.
