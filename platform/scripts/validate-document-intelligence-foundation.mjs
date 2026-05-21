import { existsSync } from 'node:fs';

const required = [
  'document-intelligence/README.md',
  'document-intelligence/DocumentIntelligenceFoundation.js',
  'document-intelligence/ShellKnowledgeVisibility.js',
  'document-intelligence/classification/DocumentClassificationEngine.js',
  'document-intelligence/metadata/MetadataEngine.js',
  'document-intelligence/taxonomy/DocumentTaxonomy.js',
  'document-intelligence/knowledge/KnowledgeBaseFoundation.js',
  'document-intelligence/knowledge/videos/VideoKnowledgeFoundation.js',
  'document-intelligence/knowledge/journeys/LearningJourneyEngine.js',
  'document-intelligence/ocr/OcrFoundation.js',
  'document-intelligence/parsers/ParserFoundation.js',
  'document-intelligence/extractors/ExtractionFoundation.js',
  'document-intelligence/indexing/IndexingFoundation.js',
  'document-intelligence/semantic/SemanticFoundation.js',
  'document-intelligence/search/DocumentSearchEngine.js',
  'document-intelligence/evidence/EvidenceManagementEngine.js',
  'document-intelligence/timelines/CaseDocumentTimelineEngine.js',
  'document-intelligence/versions/DocumentLifecycleEngine.js',
  'document-intelligence/versions/DocumentVersioningEngine.js',
  'document-intelligence/retention/RetentionGovernanceEngine.js',
  'document-intelligence/archives/ArchiveFoundation.js',
  'document-intelligence/templates/TemplateEngine.js',
  'document-intelligence/preview/DocumentPreviewEngine.js',
  'document-intelligence/telemetry/KnowledgeTelemetry.js',
  'document-intelligence/governance/DocumentIntelligenceGovernance.js',
  'document-intelligence/docs/document-intelligence-foundation.md',
  'shared/contracts/knowledge/KnowledgeContracts.js',
  'docs/knowledge/README.md',
  'docs/knowledge/taxonomy.md',
  'docs/knowledge/metadata.md',
  'docs/knowledge/lifecycle.md',
  'docs/knowledge/templates.md',
  'docs/knowledge/ocr-foundation.md',
  'docs/knowledge/semantic-foundation.md',
  'governance/documents/taxonomy-standards.md',
  'governance/documents/metadata-standards.md',
  'governance/documents/naming-standards.md',
  'governance/documents/retention-standards.md',
  'governance/documents/preview-standards.md',
  'governance/documents/ai-knowledge-governance.md',
  'governance/documents/module-requirements.md',
];

const missing = required.filter((item) => !existsSync(item));
if (missing.length) {
  console.error('validate:knowledge failed. Missing files:');
  missing.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log('validate:knowledge passed');
