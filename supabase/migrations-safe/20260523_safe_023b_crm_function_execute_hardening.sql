-- =============================================================================
-- MIGRATION SAFE 023B — endurecimento RPC das funcoes internas CRM
-- =============================================================================
-- As funcoes abaixo sao usadas somente por triggers internos. Elas permanecem
-- SECURITY DEFINER para executar dentro das operacoes de escrita, mas nao devem
-- ficar chamaveis pelo Data API como RPC.
-- =============================================================================

REVOKE EXECUTE ON FUNCTION set_crm_tenant_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION touch_crm_conversation_from_message() FROM PUBLIC, anon, authenticated;
