'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, MessageSquare, BookOpen, Phone } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Faq {
  pergunta: string;
  resposta: string;
}

interface Categoria {
  titulo: string;
  icone: React.ElementType;
  itens: Faq[];
}

const CATEGORIAS: Categoria[] = [
  {
    titulo: 'Meu Processo',
    icone: BookOpen,
    itens: [
      {
        pergunta: 'Como acompanho o andamento do meu processo?',
        resposta: 'Na seção "Meu Caso" você encontra o status atual, andamentos recentes, publicações do Diário de Justiça e próximas audiências. Tudo é atualizado automaticamente conforme o processo avança.',
      },
      {
        pergunta: 'O que são as publicações do Diário de Justiça?',
        resposta: 'São comunicados oficiais publicados pelo tribunal sobre seu processo. Quando há uma nova publicação relevante, você será notificado. Elas podem indicar audiências marcadas, decisões, despachos ou intimações.',
      },
      {
        pergunta: 'Quando terei uma audiência?',
        resposta: 'Audiências são agendadas pelo juiz e comunicadas por publicação oficial. Assim que uma for marcada no seu processo, ela aparecerá na aba Agenda e você receberá uma notificação. Nosso escritório também entrará em contato com antecedência.',
      },
      {
        pergunta: 'Como sei se houve alguma decisão no processo?',
        resposta: 'Decisões judiciais aparecem automaticamente em "Meu Caso" dentro do histórico de andamentos. Você também pode verificar as publicações do Diário de Justiça relacionadas ao seu processo.',
      },
    ],
  },
  {
    titulo: 'Documentos e Contratos',
    icone: BookOpen,
    itens: [
      {
        pergunta: 'Que documentos preciso enviar?',
        resposta: 'Seu advogado indicará quais documentos são necessários em cada fase. Os documentos solicitados aparecerão na seção "Documentos" com o status "Pendente envio". Acesse, clique em "Enviar documento" e faça o upload do arquivo.',
      },
      {
        pergunta: 'Em qual formato devo enviar os documentos?',
        resposta: 'Aceitamos arquivos em PDF, JPG e PNG. Para documentos oficiais (RG, CPF, comprovantes), prefira sempre PDF. O tamanho máximo por arquivo é de 10 MB.',
      },
      {
        pergunta: 'Onde encontro meu contrato de honorários?',
        resposta: 'Na seção "Contratos" você encontra todos os documentos contratuais do seu processo, incluindo o contrato de honorários, procuração e eventuais acordos. Você pode visualizá-los ou baixá-los a qualquer momento.',
      },
      {
        pergunta: 'Preciso assinar algo eletronicamente. Como faço?',
        resposta: 'Quando um documento exige sua assinatura, ele aparecerá em "Contratos" com o status "Aguardando assinatura". Clique em "Visualizar documento" e siga as instruções para assinatura eletrônica. Em caso de dúvida, entre em contato pelo chat.',
      },
    ],
  },
  {
    titulo: 'Financeiro e Custas',
    icone: HelpCircle,
    itens: [
      {
        pergunta: 'O que são custas processuais?',
        resposta: 'Custas são taxas e despesas obrigatórias cobradas pelo tribunal para movimentar o processo — como taxas de distribuição, guias de recolhimento e despesas com citação. Elas são distintas dos honorários advocatícios.',
      },
      {
        pergunta: 'Como envio um comprovante de pagamento de custas?',
        resposta: 'Acesse a seção "Custas", clique em "Enviar comprovante" e faça o upload do PDF ou imagem do comprovante. Nosso escritório irá confirmar o recebimento e atualizar o status do pagamento.',
      },
      {
        pergunta: 'Onde acompanho meu plano de pagamento?',
        resposta: 'Na seção "Plano" você encontra o plano de pagamento dos honorários acordado com o escritório, com as parcelas, vencimentos e status de cada pagamento.',
      },
    ],
  },
  {
    titulo: 'Acesso e Conta',
    icone: HelpCircle,
    itens: [
      {
        pergunta: 'Esqueci minha senha. Como recupero o acesso?',
        resposta: 'Na tela de login, clique em "Esqueci minha senha" e informe seu e-mail cadastrado. Você receberá um link para criar uma nova senha. Se não receber o e-mail em alguns minutos, verifique a caixa de spam.',
      },
      {
        pergunta: 'Posso acessar o portal pelo celular?',
        resposta: 'Sim. O portal foi desenvolvido para funcionar perfeitamente em celulares, tablets e computadores. Você pode acessar diretamente pelo navegador do seu dispositivo, sem precisar instalar nenhum aplicativo.',
      },
      {
        pergunta: 'Meus dados estão seguros?',
        resposta: 'Sim. Utilizamos criptografia em todas as comunicações e armazenamento. Nenhum dado do seu processo é compartilhado com terceiros sem sua autorização. Sua conta é protegida por senha e pode ter autenticação em dois fatores ativada.',
      },
    ],
  },
];

function FaqItem({ faq }: { faq: Faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-3 px-4 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <span className="text-sm font-medium text-foreground leading-snug">{faq.pergunta}</span>
        {open
          ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />}
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{faq.resposta}</p>
        </div>
      )}
    </div>
  );
}

export default function AjudaClient() {
  const [categoriaAtiva, setCategoriaAtiva] = useState(0);
  const cat = CATEGORIAS[categoriaAtiva];

  return (
    <div className="max-w-2xl space-y-6">
      {/* Intro */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-4 flex items-start gap-3">
        <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Como podemos ajudar?</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Encontre respostas para as dúvidas mais frequentes ou entre em contato com o escritório.
          </p>
        </div>
      </div>

      {/* Categorias */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIAS.map((c, i) => (
          <button
            key={c.titulo}
            onClick={() => setCategoriaAtiva(i)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              categoriaAtiva === i
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            {c.titulo}
          </button>
        ))}
      </div>

      {/* FAQ */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{cat.titulo}</p>
        </div>
        {cat.itens.map((faq, i) => (
          <FaqItem key={i} faq={faq} />
        ))}
      </div>

      {/* Contato */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Link
          href="/mensagens"
          className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-4 hover:border-primary/40 hover:bg-muted/20 transition-colors group"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Enviar mensagem</p>
            <p className="text-xs text-muted-foreground">Fale diretamente com o escritório</p>
          </div>
        </Link>
        <Link
          href="/agenda"
          className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-4 hover:border-primary/40 hover:bg-muted/20 transition-colors group"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Phone className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Agendar atendimento</p>
            <p className="text-xs text-muted-foreground">Marque uma consulta com seu advogado</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
