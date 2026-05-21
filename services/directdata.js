import { supabase }    from './supabase.js';
import { FUNCTIONS_URL } from '../utils/config.js';

/* ── ViaCEP ──────────────────────────────────────── */
export async function lookupCEP(cep) {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    const d = await r.json();
    if (d.erro) return null;
    return {
      logradouro:  d.logradouro  || '',
      bairro:      d.bairro      || '',
      cidade:      d.localidade  || '',
      uf:          d.uf          || '',
      ibge:        d.ibge        || '',
      cep:         d.cep         || clean,
    };
  } catch (_) { return null; }
}

/* ── DirectData CPF lookup ───────────────────────── */
export async function lookupCPF(cpf) {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const r = await fetch(`${FUNCTIONS_URL}/directdata-proxy`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ cpf: clean }),
    });
    if (!r.ok) return null;

    const payload = await r.json();
    const d = payload?.retorno;
    if (!d) return null;

    return {
      nome:           d.nome          || '',
      sexo:           d.sexo          || '',
      dataNascimento: parseDDDate(d.dataNascimento),
      nomeMae:        d.nomeMae       || '',
      rendaEstimada:  d.rendaEstimada || null,
      rendaFaixa:     d.rendaFaixaSalarial || '',
      telefones:      (d.telefones || []).map(t => ({
        tipo:     mapTipoTelefone(t.tipoTelefone),
        numero:   t.telefoneComDDD || '',
        whatsapp: !!t.whatsApp,
      })),
      enderecos: (d.enderecos || []).map(e => ({
        tipo:        'Residencial',
        cep:         e.cep         || '',
        logradouro:  e.logradouro  || '',
        numero:      e.numero      || '',
        complemento: e.complemento || '',
        bairro:      e.bairro      || '',
        cidade:      e.cidade      || '',
        uf:          e.uf          || '',
      })),
      emails: (d.emails || []).map(e => e.enderecoEmail).filter(Boolean),
    };
  } catch (_) { return null; }
}

function parseDDDate(str) {
  // DirectData format: DD/MM/YYYY
  if (!str) return '';
  const [d, m, y] = str.split('/');
  if (!y) return '';
  return `${y}-${(m||'').padStart(2,'0')}-${(d||'').padStart(2,'0')}`;
}

function mapTipoTelefone(tipo) {
  const map = { CELULAR: 'Celular', FIXO: 'Fixo', COMERCIAL: 'Comercial' };
  return map[String(tipo||'').toUpperCase()] || 'Celular';
}
