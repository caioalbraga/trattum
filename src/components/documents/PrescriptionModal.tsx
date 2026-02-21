import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, X, Shield, Pill } from "lucide-react";

interface Documento {
  id: string;
  tipo: string;
  titulo: string;
  conteudo: {
    paciente_nome?: string;
    paciente_cpf?: string;
    medico_nome?: string;
    medico_crm?: string;
    instrucoes?: string;
    codigo_autenticidade?: string;
    data_emissao?: string;
  };
  created_at: string;
}

interface PrescriptionModalProps {
  open: boolean;
  onClose: () => void;
  documento: Documento | null;
  isLoading?: boolean;
}

function maskCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return "***.***.***-**";
  return `***.${digits.substring(3, 6)}.${digits.substring(6, 9)}-**`;
}

function formatDate(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

export function PrescriptionModal({ open, onClose, documento, isLoading }: PrescriptionModalProps) {
  const conteudo = documento?.conteudo || {};

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Receita de Instruções de Tratamento</DialogTitle>
        </DialogHeader>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Pill className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-serif font-semibold text-sm text-foreground">
                Receita — Instruções de Tratamento
              </p>
              <p className="text-xs text-muted-foreground">Trattum Saúde Digital</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ) : !documento ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="size-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="size-7 text-muted-foreground" />
              </div>
              <p className="font-serif text-lg font-medium text-foreground">Documento não encontrado</p>
            </div>
          ) : (
            <>
              {/* Institution Header */}
              <div className="text-center border-b border-border pb-6">
                <p className="text-xs font-medium tracking-[3px] uppercase text-primary mb-1">
                  Trattum Saúde Digital
                </p>
                <h2 className="font-serif text-2xl font-bold text-foreground">
                  {documento.titulo}
                </h2>
                <p className="text-xs text-muted-foreground mt-2">
                  Documento digital autenticado
                </p>
              </div>

              {/* Doctor Info */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="px-4 py-3 bg-muted/50 border-b border-border">
                  <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                    Médico Responsável
                  </p>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Nome</p>
                    <p className="font-semibold text-foreground">
                      {conteudo.medico_nome || "Dr(a). Responsável Técnico"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">CRM</p>
                    <p className="font-mono font-semibold text-foreground">
                      {conteudo.medico_crm || "CRM/CE 00000"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Patient Info */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="px-4 py-3 bg-muted/50 border-b border-border">
                  <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                    Dados do Paciente
                  </p>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Nome</p>
                    <p className="font-semibold text-foreground">
                      {conteudo.paciente_nome || "Paciente"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">CPF</p>
                    <p className="font-mono font-semibold text-foreground">
                      {conteudo.paciente_cpf ? maskCPF(conteudo.paciente_cpf) : "Não informado"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Prescription Body */}
              <div className="space-y-3">
                <h3 className="font-serif font-semibold text-base text-foreground">
                  Protocolo de Tratamento
                </h3>
                <div className="rounded-lg border border-border p-5 bg-muted/20">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {conteudo.instrucoes ||
                      "Protocolo de Gerenciamento Metabólico — Tomar 1 dose da medicação prescrita via subcutânea, uma vez por semana, preferencialmente no mesmo horário. Manter hidratação constante."}
                  </p>
                </div>
              </div>

              {/* Footer / Authenticity */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center gap-2">
                  <Shield className="size-4 text-muted-foreground" />
                  <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                    Autenticidade
                  </p>
                </div>
                <div className="p-4 grid grid-cols-1 gap-2 font-mono text-xs text-muted-foreground">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground/70">Data de Emissão</span>
                    <span className="text-foreground">
                      {conteudo.data_emissao || formatDate(documento.created_at)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground/70">Código de Autenticidade</span>
                    <span className="text-foreground">
                      {conteudo.codigo_autenticidade || documento.id.slice(0, 12).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Legal */}
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Documento digital emitido pela plataforma Trattum Saúde Digital. 
                  Este receituário possui validade conforme regulamentação vigente do 
                  Conselho Federal de Medicina (CFM) e da ANVISA para prescrições digitais.
                </p>
                <p className="text-xs text-muted-foreground/60 text-center pt-2">
                  Trattum Saúde Digital · Fortaleza, CE
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!isLoading && documento && (
          <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button onClick={() => window.print()} className="print:hidden">
              <FileText className="size-4 mr-2" />
              Imprimir / Salvar PDF
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
