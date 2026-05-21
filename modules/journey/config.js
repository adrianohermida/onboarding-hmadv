/**
 * config.js — Definição canônica dos passos da Jornada CNJ
 * Cada passo define tipo, comportamento e regras de avanço.
 */

// URLs públicas dos PDFs no Supabase Storage (portal-assets bucket)
export const ASSET_URLS = {
  cartilha: 'https://sspvizogbcyigquqycsz.supabase.co/storage/v1/object/public/portal-assets/Cartilha-Superendividamento.pdf',
  anexo_ii: 'https://sspvizogbcyigquqycsz.supabase.co/storage/v1/object/public/portal-assets/Anexo%20II%20CNJ.pdf',
};

/** Definição dos passos — imutável em runtime */
export const JOURNEY_STEPS = [
  {
    id:         'video_welcome',
    type:       'video',
    stepKey:    'welcome',         // chave em onboarding_videos.step_key
    icon:       'VID',
    label:      'Boas-vindas',
    title:      'Bem-vindo à Jornada CNJ',
    subtitle:   'Conheça o processo e o que esperar desta recuperação financeira.',
    cnjStepRef: 1,
    required:   true,
    allowSkip:  false,
    skipMinPct: 100,
  },
  {
    id:         'video_lei',
    type:       'video',
    stepKey:    'lei_superendividamento',
    icon:       'LEI',
    label:      'Seus Direitos',
    title:      'Lei do Superendividamento',
    subtitle:   'Entenda a Lei 14.181/2021 e os direitos que ela garante a você.',
    cnjStepRef: 2,
    required:   true,
    allowSkip:  true,
    skipMinPct: 80,
  },
  {
    id:         'video_negociacao',
    type:       'video',
    stepKey:    'negociacao',
    icon:       'NEG',
    label:      'Negociação',
    title:      'Negociação com Credores',
    subtitle:   'Como funciona a conciliação coletiva e o papel do escritório.',
    cnjStepRef: 3,
    required:   true,
    allowSkip:  true,
    skipMinPct: 80,
  },
  {
    id:         'video_plano',
    type:       'video',
    stepKey:    'plano_pagamento',
    icon:       'PLN',
    label:      'Plano CNJ',
    title:      'Plano de Pagamento',
    subtitle:   'Entenda o formulário oficial CNJ Anexo II e como calcular parcelas.',
    cnjStepRef: 4,
    required:   true,
    allowSkip:  true,
    skipMinPct: 80,
  },
  {
    id:          'cartilha',
    type:        'pdf_view',
    icon:        'PDF',
    label:       'Cartilha CNJ',
    title:       'Cartilha de Superendividamento',
    subtitle:    'Leia a cartilha oficial do CNJ sobre seus direitos e o processo.',
    cnjStepRef:  5,
    assetKey:    'cartilha_superendividamento',
    assetLabel:  'Cartilha Superendividamento CNJ',
    assetUrl:    ASSET_URLS.cartilha,
    required:    true,
    allowSkip:   true,
  },
  {
    id:          'anexo_ii',
    type:        'pdf_form',
    icon:        'DOC',
    label:       'Formulário',
    title:       'Formulário CNJ Anexo II',
    subtitle:    'Baixe, preencha e envie o formulário oficial do plano de pagamento.',
    cnjStepRef:  6,
    assetKey:    'anexo_ii_cnj',
    assetLabel:  'Formulário Oficial CNJ Anexo II',
    assetUrl:    ASSET_URLS.anexo_ii,
    required:    true,
    allowSkip:   false,
  },
  {
    id:         'cnj_form',
    type:       'cnj_form',
    icon:       'OK',
    label:      'Formulário',
    title:      'Formulário CNJ — 7 Passos',
    subtitle:   'Preencha os 7 passos do formulário de superendividamento.',
    cnjStepRef: 7,
    required:   true,
    allowSkip:  false,
  },
];

/** Mapa de labels e cores para cada estado */
export const STEP_STATE_META = {
  locked:          { label: 'Bloqueado',    color: '#94a3b8', bg: '#f1f5f9', icon: 'OFF' },
  available:       { label: 'Disponivel',   color: '#2E6DA4', bg: '#eff6ff', icon: 'GO' },
  in_progress:     { label: 'Em andamento', color: '#c07b00', bg: '#fffbeb', icon: 'RUN' },
  awaiting_review: { label: 'Em analise',   color: '#c07b00', bg: '#fffbeb', icon: 'REV' },
  approved:        { label: 'Aprovado',     color: '#16a34a', bg: '#f0fdf4', icon: 'OK' },
  rejected:        { label: 'Devolvido',    color: '#dc2626', bg: '#fef2f2', icon: 'NO' },
  completed:       { label: 'Concluido',    color: '#16a34a', bg: '#f0fdf4', icon: 'OK' },
};
