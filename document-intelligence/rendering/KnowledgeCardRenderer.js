export function renderKnowledgeCard(entry = {}) {
  return {
    title: entry.title || 'Knowledge',
    domain: entry.domain || 'faq',
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    status: entry.lifecycle_state || 'published',
    owner: entry.owner_id || 'knowledge-team',
  };
}
