'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import type { Tables } from '@/types/database';
import toast from 'sonner';

type Caso = Tables<'portal_casos'>;

interface Props {
  caso: Caso;
  userId: string;
}

// Step definitions
const STEPS = [
  { id: 'dados_pessoais', title: 'Dados pessoais', description: 'Informações básicas de identificação' },
  { id: 'endereco', title: 'Endereço', description: 'Onde você reside atualmente' },
  { id: 'situacao_profissional', title: 'Situação profissional', description: 'Emprego e renda' },
  { id: 'dividas', title: 'Dívidas', description: 'Relação de débitos e credores' },
  { id: 'documentos', title: 'Documentos', description: 'Envio dos documentos necessários' },
  { id: 'revisao', title: 'Revisão', description: 'Confirme suas informações' },
];

const stepSchemas = {
  dados_pessoais: z.object({
    nome: z.string().min(2, 'Nome obrigatório'),
    cpf: z.string().min(11, 'CPF inválido'),
    rg: z.string().optional(),
    telefone: z.string().min(10, 'Telefone inválido'),
    estado_civil: z.string().min(1, 'Selecione o estado civil'),
  }),
  endereco: z.object({
    endereco: z.string().min(5, 'Endereço obrigatório'),
  }),
  situacao_profissional: z.object({
    profissao: z.string().optional(),
    situacao_profissional: z.string().min(1, 'Selecione sua situação'),
    renda_mensal: z.coerce.number().min(0, 'Valor inválido'),
    numero_dependentes: z.coerce.number().min(0).max(20),
  }),
  dividas: z.object({}), // handled separately
  documentos: z.object({}),
  revisao: z.object({}),
};

const ESTADO_CIVIL_OPTIONS = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável'];
const SITUACAO_PROF_OPTIONS = ['Empregado(a)', 'Autônomo(a)', 'Empresário(a)', 'Aposentado(a)', 'Desempregado(a)', 'Do lar'];

type DividaEntry = { credor: string; valor_atual: number; tipo: string };

export default function OnboardingWizard({ caso, userId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(caso.cnj_step_atual ?? 0);
  const [saving, startSave] = useTransition();

  // Dívidas state (step 3)
  const [dividas, setDividas] = useState<DividaEntry[]>(
    Array.isArray(caso.dividas) ? (caso.dividas as DividaEntry[]) : []
  );
  const [newDivida, setNewDivida] = useState<DividaEntry>({ credor: '', valor_atual: 0, tipo: '' });

  const currentStep = STEPS[step];

  const schema = stepSchemas[currentStep?.id as keyof typeof stepSchemas] ?? z.object({});

  type StepData = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors } } = useForm<StepData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: caso.nome ?? '',
      cpf: caso.cpf ?? '',
      rg: caso.rg ?? '',
      telefone: caso.telefone ?? '',
      estado_civil: caso.estado_civil ?? '',
      endereco: caso.endereco ?? '',
      profissao: caso.profissao ?? '',
      situacao_profissional: caso.situacao_profissional ?? '',
      renda_mensal: caso.renda_mensal ?? 0,
      numero_dependentes: caso.numero_dependentes ?? 0,
    } as StepData,
  });

  async function saveStep(data: StepData) {
    startSave(async () => {
      const supabase = createClient();
      const payload: Partial<Caso> = { ...data, cnj_step_atual: step + 1 };

      if (step === 3) payload.dividas = dividas as any;
      if (step === STEPS.length - 1) payload.onboarding_done = true;

      const { error } = await supabase
        .from('portal_casos')
        .update(payload)
        .eq('id', caso.id);

      if (error) {
        toast.error('Erro ao salvar: ' + error.message);
        return;
      }

      if (step === STEPS.length - 1) {
        toast.success('Onboarding concluído!');
        router.push('/dashboard');
        return;
      }

      setStep(step + 1);
    });
  }

  const progressPct = Math.round((step / STEPS.length) * 100);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Progress header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-semibold">Onboarding</h1>
          <span className="text-sm text-muted-foreground">{step + 1} / {STEPS.length}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-between mt-3">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-col items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${
                i < step ? 'bg-primary text-primary-foreground' :
                i === step ? 'bg-primary/20 text-primary ring-2 ring-primary/40' :
                'bg-muted text-muted-foreground'
              }`}>
                {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className="hidden sm:block text-xs text-muted-foreground">{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold">{currentStep?.title}</h2>
          <p className="text-sm text-muted-foreground">{currentStep?.description}</p>
        </div>

        <form onSubmit={handleSubmit(saveStep)} className="p-5 space-y-4">
          {step === 0 && (
            <>
              <Field label="Nome completo *" error={errors.nome?.message}>
                <input {...register('nome')} placeholder="João da Silva" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CPF *" error={errors.cpf?.message}>
                  <input {...register('cpf')} placeholder="000.000.000-00" className={inputCls} />
                </Field>
                <Field label="RG">
                  <input {...register('rg')} placeholder="00.000.000-0" className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Telefone *" error={errors.telefone?.message}>
                  <input {...register('telefone')} placeholder="(11) 99999-9999" className={inputCls} />
                </Field>
                <Field label="Estado civil *" error={errors.estado_civil?.message}>
                  <select {...register('estado_civil')} className={inputCls}>
                    <option value="">Selecione...</option>
                    {ESTADO_CIVIL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
              </div>
            </>
          )}

          {step === 1 && (
            <Field label="Endereço completo *" error={errors.endereco?.message}>
              <textarea
                {...register('endereco')}
                placeholder="Rua, número, bairro, cidade, estado, CEP"
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </Field>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Profissão">
                  <input {...register('profissao')} placeholder="Ex: Engenheiro" className={inputCls} />
                </Field>
                <Field label="Situação *" error={errors.situacao_profissional?.message}>
                  <select {...register('situacao_profissional')} className={inputCls}>
                    <option value="">Selecione...</option>
                    {SITUACAO_PROF_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Renda mensal (R$)" error={errors.renda_mensal?.message}>
                  <input {...register('renda_mensal')} type="number" step="0.01" min="0" placeholder="0,00" className={inputCls} />
                </Field>
                <Field label="Dependentes" error={errors.numero_dependentes?.message}>
                  <input {...register('numero_dependentes')} type="number" min="0" max="20" className={inputCls} />
                </Field>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-3">
              {/* Existing debts */}
              {dividas.map((d, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-muted/40 rounded-lg text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{d.credor}</p>
                    <p className="text-xs text-muted-foreground">{d.tipo} · R$ {d.valor_atual}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDividas(dividas.filter((_, j) => j !== i))}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remover
                  </button>
                </div>
              ))}

              {/* Add debt */}
              <div className="p-3 border border-dashed border-border rounded-lg space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Adicionar dívida</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={newDivida.credor}
                    onChange={(e) => setNewDivida({ ...newDivida, credor: e.target.value })}
                    placeholder="Credor (ex: Banco X)"
                    className={`${inputCls} text-xs`}
                  />
                  <input
                    value={newDivida.tipo}
                    onChange={(e) => setNewDivida({ ...newDivida, tipo: e.target.value })}
                    placeholder="Tipo (ex: cartão de crédito)"
                    className={`${inputCls} text-xs`}
                  />
                  <input
                    type="number"
                    value={newDivida.valor_atual || ''}
                    onChange={(e) => setNewDivida({ ...newDivida, valor_atual: Number(e.target.value) })}
                    placeholder="Valor atual (R$)"
                    className={`${inputCls} text-xs`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!newDivida.credor) return;
                    setDividas([...dividas, newDivida]);
                    setNewDivida({ credor: '', valor_atual: 0, tipo: '' });
                  }}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  + Adicionar dívida
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Acesse <strong>Documentos</strong> no menu lateral para enviar os arquivos necessários, como RG, CPF e comprovante de renda.
              </p>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Revise os dados informados antes de concluir.</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Nome</span><span>{caso.nome}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">CPF</span><span>{caso.cpf || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Telefone</span><span>{caso.telefone || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Dívidas informadas</span><span>{dividas.length}</span></div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {step === STEPS.length - 1 ? 'Concluir onboarding' : <>Próximo <ChevronRight className="h-4 w-4" /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
