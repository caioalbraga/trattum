# Correção do Envio de E-mail TCLE

## Diagnóstico

Investiguei os logs e o banco de dados e encontrei:

1. **Zero registros em `consent_logs**` -- o consentimento nunca foi salvo no banco
2. **Zero logs da Edge Function** -- a função nunca foi chamada
3. **O usuário provavelmente não estava logado** ao aceitar os termos, fazendo o fluxo cair no caminho "guest" que salva apenas no `sessionStorage` e nunca envia e-mail

Alem disso, a Edge Function usa `supabase.auth.getClaims()` que **não existe** no SDK do Supabase -- isso causaria erro silencioso se a função fosse chamada.

Por fim, o dominio `trattum.com.br` precisa estar verificado no Resend para enviar e-mails de produção. Sem verificação, o Resend só envia para o e-mail do dono da conta.

## Problemas Identificados


| #   | Problema                                                                 | Impacto                                           |
| --- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| 1   | Usuário não logado -> caminho guest -> sem registro no banco, sem e-mail | E-mail nunca é enviado                            |
| 2   | `supabase.auth.getClaims(token)` não existe no SDK                       | Edge Function falharia com erro se chamada        |
| 3   | Domínio possivelmente não verificado no Resend                           | E-mails rejeitados pela API                       |
| 4   | `consent_logs` não permite UPDATE pelo usuário (RLS)                     | Edge Function não consegue atualizar `email_sent` |


## Plano de Correção

### 1. Corrigir a Edge Function (`send-consent-email`)

- Substituir `supabase.auth.getClaims(token)` por `supabase.auth.getUser(token)` que é o método correto do SDK
- Usar um **service role client** para operações de INSERT/UPDATE em `consent_logs` (já que o usuário não tem permissão de UPDATE via RLS)
- Manter a validação de que `user_id` do body bate com o usuário autenticado

### 2. Garantir que o fluxo funciona para usuarios logados

- Revisar `useConsent.ts` para garantir que quando o usuário está logado, todo o fluxo (insert consent_log + invoke edge function) executa corretamente
- Melhorar o tratamento de erros para logar no console quando a Edge Function falha

### 3. Adicionar RLS de UPDATE em `consent_logs` (ou usar service role)

A Edge Function precisa fazer UPDATE em `consent_logs` para marcar `email_sent = true`. Como a tabela não permite UPDATE pelo usuário, a solução mais segura é usar o **service role client** dentro da Edge Function para essas operações.

### 4. Verificação de dominio (ação manual do usuario)

Para que e-mails cheguem em qualquer destinatário, o domínio `trattum.com.br` precisa estar verificado no painel do Resend com registros DNS (SPF/DKIM). Enquanto não estiver verificado, apenas e-mails para o dono da conta Resend funcionam.

Como alternativa temporária para testes, pode-se usar `onboarding@resend.dev` como remetente.

## Resumo Tecnico das Alteracoes

```text
supabase/functions/send-consent-email/index.ts
  - Trocar getClaims() por getUser()
  - Criar service role client para INSERT/UPDATE
  - Usar from remetente condicional (resend.dev para testes)

src/hooks/useConsent.ts
  - Melhorar logging de erros na chamada da edge function
  - Garantir que o email do usuario é passado corretamente
```

## Sobre o Dominio Resend

Voce precisa verificar o dominio `trattum.com.br` no painel do Resend adicionando os registros DNS que eles fornecem. Ate la, os e-mails so chegam no e-mail cadastrado na conta Resend. Para testes imediatos, posso configurar o remetente como `onboarding@resend.dev` que funciona sem verificação de dominio.  
  
Lovable, não é trattum.com.br, é apenas .com  
  
Outra coisa, veja que o usuario realmente pode n estar logado sempre de primeira. então conte que o banco pode receber o aceite de contrato somente no final. Então vamos fazer o seguinte, vamos remover esse aceite do começo do questionario e deixar o aceite funcionando somente na parte de criação de conta, ou se for um usuario logado, esse mesmo aceite aparece antes de passar para o endereço. Nosso plano vai ser esse