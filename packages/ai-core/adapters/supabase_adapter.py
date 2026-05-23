from __future__ import annotations

from .common import AdapterResult


def get_client(client_id: str) -> AdapterResult:
    if not client_id:
        return AdapterResult(success=False, error='client_id is required')
    return AdapterResult(
        success=True,
        data={
            'client_id': client_id,
            'source': 'data_platform',
            'status': 'placeholder',
        },
    )


def get_cliente(cliente_id: str) -> AdapterResult:
    # Compatibility alias for existing callers.
    return get_client(cliente_id)

