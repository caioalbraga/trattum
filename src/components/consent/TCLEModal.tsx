import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, FileText, X, CheckCircle2 } from "lucide-react";
import { CONSENT_TEXTS } from "@/lib/consent.texts";

interface ConsentLog {
  id: string;
  consent_timestamp: string;
  terms_version: string;
  document_hash: string;
  ip_address: string;
  email_sent: boolean;
  user_agent?: string | null;
}

interface UserProfile {
  nome?: string | null;
  cpf?: string | null;
  email?: string;
}

interface TCLEModalProps {
  open: boolean;
  onClose: () => void;
  consentLog: ConsentLog | null;
  userProfile: UserProfile | null;
  isLoading?: boolean;
}

function maskCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return "***.***.***-**";
  return `***.${digits.substring(3, 6)}.${digits.substring(6, 9)}-**`;
}

function formatDateTime(isoString: string) {
  const date = new Date(isoString);
  const formattedDate = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
  const formattedTime = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  return { formattedDate, formattedTime };
}

export function TCLEModal({ open, onClose, consentLog, userProfile, isLoading }: TCLEModalProps) {
  const userName = userProfile?.nome || userProfile?.email || "Titular";
  const maskedCpf = userProfile?.cpf ? maskCPF(userProfile.cpf) : "Não informado";
  const shortHash = consentLog?.document_hash?.substring(0, 16) ?? "—";
  const { formattedDate, formattedTime } = consentLog
    ? formatDateTime(consentLog.consent_timestamp)
    : { formattedDate: "—", formattedTime: "—" };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Termo de Consentimento Livre e Esclarecido</DialogTitle>
        </DialogHeader>

        {/* Certificate Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-serif font-semibold text-sm text-foreground">
                Certificado de Aceite — TCLE
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
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ) : !consentLog ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="size-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="size-7 text-muted-foreground" />
              </div>
              <p className="font-serif text-lg font-medium text-foreground">Documento não encontrado</p>
              <p className="text-sm text-muted-foreground mt-2">
                Nenhum registro de consentimento foi encontrado para este usuário.
              </p>
            </div>
          ) : (
            <>
              {/* Institution */}
              <div className="text-center border-b border-border pb-6">
                <p className="text-xs font-medium tracking-[3px] uppercase text-primary mb-1">
                  Trattum Saúde Digital
                </p>
                <h2 className="font-serif text-2xl font-bold text-foreground">
                  Termo de Consentimento Livre e Esclarecido
                </h2>
                <p className="text-xs text-muted-foreground mt-2">
                  TCLE · Versão {consentLog.terms_version} · Documento autenticado digitalmente
                </p>
              </div>

              {/* Identification Card */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="px-4 py-3 bg-muted/50 border-b border-border">
                  <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                    Identificação do Titular
                  </p>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Nome</p>
                    <p className="font-semibold text-foreground">{userName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">CPF</p>
                    <p className="font-mono font-semibold text-foreground">{maskedCpf}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Data do Aceite</p>
                    <p className="text-foreground">{formattedDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Horário (Brasília)</p>
                    <p className="text-foreground">{formattedTime}</p>
                  </div>
                </div>
              </div>

              {/* Declaration */}
              <div className="space-y-3">
                <h3 className="font-serif font-semibold text-base text-foreground">
                  Declaração de Consentimento
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Eu, <strong className="text-foreground">{userName}</strong>, portador(a) do CPF{" "}
                  <strong className="font-mono text-foreground">{maskedCpf}</strong>, declaro que em{" "}
                  <strong className="text-foreground">{formattedDate}</strong> às{" "}
                  <strong className="text-foreground">{formattedTime}</strong> (horário de Brasília),
                  li integralmente e aceito os seguintes documentos da plataforma Trattum:
                </p>
                <div className="space-y-2">
                  {[
                    "Termos de Uso da Plataforma Trattum",
                    "Política de Privacidade e Proteção de Dados (LGPD)",
                    "Termo de Consentimento Livre e Esclarecido (TCLE)",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-primary shrink-0" />
                      <span className="text-sm text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Declaro ainda ter mais de 18 (dezoito) anos de idade e que todas as informações
                  biométricas e clínicas fornecidas são verídicas e atualizadas.
                </p>
              </div>

              {/* Terms Summary */}
              <div className="space-y-3">
                <h3 className="font-serif font-semibold text-base text-foreground">
                  Sumário dos Termos Aceitos
                </h3>
                <div className="rounded-lg border border-border overflow-hidden divide-y divide-border/60">
                  {CONSENT_TEXTS.terms.sections.slice(0, 6).map((section) => (
                    <div key={section.id} className="px-4 py-3">
                      <p className="text-xs font-semibold text-foreground mb-0.5">
                        {section.number}. {section.title}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {section.content.replace(/\*\*/g, "").replace(/\*/g, "").split("\n")[0]}
                      </p>
                    </div>
                  ))}
                  <div className="px-4 py-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      + {CONSENT_TEXTS.terms.sections.length - 6} seções adicionais aceitas
                    </p>
                  </div>
                </div>
              </div>

              {/* Audit Trail */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center gap-2">
                  <Shield className="size-4 text-muted-foreground" />
                  <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                    Registro de Auditoria
                  </p>
                </div>
                <div className="p-4 grid grid-cols-1 gap-2 font-mono text-xs text-muted-foreground">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground/70">Versão</span>
                    <span className="text-foreground font-medium">{consentLog.terms_version}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground/70">Timestamp UTC</span>
                    <span className="text-foreground">{consentLog.consent_timestamp}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground/70">IP registrado</span>
                    <span className="text-foreground">{consentLog.ip_address}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground/70">Hash SHA-256</span>
                    <span className="text-foreground">{shortHash}…</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground/70">E-mail de confirmação</span>
                    <span className={consentLog.email_sent ? "text-primary" : "text-muted-foreground"}>
                      {consentLog.email_sent ? "Enviado ✓" : "Pendente"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Legal Footer */}
              <div className="border-t border-border pt-4 space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Este documento eletrônico possui validade jurídica conforme a Medida Provisória
                  nº 2.200-2/2001. Os dados de saúde serão armazenados pelo período mínimo de 20
                  anos, conforme Resolução CFM nº 1.821/2007.
                </p>
                <p className="text-xs text-muted-foreground">
                  DPO:{" "}
                  <a
                    href="mailto:dpo@trattum.com.br"
                    className="text-primary hover:underline"
                  >
                    dpo@trattum.com.br
                  </a>
                </p>
                <p className="text-xs text-muted-foreground/60 text-center pt-2">
                  Trattum Saúde Digital · Fortaleza, CE
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!isLoading && consentLog && (
          <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button
              onClick={() => window.print()}
              className="print:hidden"
            >
              <FileText className="size-4 mr-2" />
              Imprimir / Salvar PDF
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
