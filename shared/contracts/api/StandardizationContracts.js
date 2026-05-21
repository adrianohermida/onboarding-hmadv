export const PaginationContract = {
  required: ['page', 'page_size'],
  defaults: { page: 1, page_size: 20 },
};

export const FilterContract = {
  required: ['filters'],
};

export const SortingContract = {
  required: ['sort_by', 'sort_order'],
  defaults: { sort_order: 'asc' },
};

export const MetadataContract = {
  required: ['request_id', 'timestamp'],
};

export const TenantPropagationContract = {
  required: ['tenant_id'],
};
