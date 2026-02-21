

## Plano: Central de Notificações e Fluxo de Ajustes Clínicos

### Visao Geral

Vamos criar uma central de notificações no painel do paciente e um sistema de comunicação bidirecional entre médico e paciente para ajustes clínicos. O menu lateral será reorganizado na nova ordem solicitada.

---

### 1. Reorganizar Menu Lateral do Paciente

**Ordem atual:** Início, Atendimento, Tratamento, Minha Conta

**Nova ordem:** Início, Tratamento, Notificações (com badge de contagem), Atendimento, Minha Conta

**Arquivo:** `src/components/dashboard/DashboardSidebar.tsx`

- Adicionar ícone `Bell` para Notificações
- Rota: `/dashboard/notificacoes`

---

### 2. Criar Tabelas no Banco de Dados

**Tabela `notificacoes`** -- notificações gerais do paciente (aprovação, rejeição, ajuste)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | PK |
| user_id | uuid | Paciente destinatário |
| avaliacao_id | uuid (nullable) | Avaliação relacionada |
| tipo | text | 'aprovado', 'rejeitado', 'ajuste' |
| titulo | text | Título da notificação |
| mensagem | text | Corpo da notificação |
| lida | boolean | Se foi lida |
| created_at | timestamptz | Data de criação |

**Tabela `ajustes_clinicos`** -- thread de perguntas e respostas entre médico e paciente

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | PK |
| avaliacao_id | uuid | Avaliação relacionada |
| user_id | uuid | Paciente |
| autor | text | 'medico' ou 'paciente' |
| mensagem | text | Texto da pergunta ou resposta |
| criado_por | uuid (nullable) | ID do admin que criou (quando autor=medico) |
| created_at | timestamptz | Data de criação |

**RLS:** Pacientes podem ler/atualizar suas notificações e inserir respostas nos ajustes. Admins podem gerenciar tudo.

---

### 3. Criar Página de Notificações do Paciente

**Arquivo novo:** `src/pages/DashboardNotificacoes.tsx`

- Lista de notificações com ícone por tipo (aprovado = check verde, rejeitado = X vermelho, ajuste = alerta azul)
- Ao clicar em uma notificação de ajuste, abre um painel com:
  - A pergunta do médico
  - Campo de texto para resposta
  - Botão "Enviar Resposta"
- Notificações de aprovação/rejeição mostram apenas a mensagem informativa
- Badge com contagem de não lidas no menu lateral

---

### 4. Atualizar Fluxo do Admin (Solicitar Ajuste)

**Arquivo:** `src/pages/admin/AdminDashboard.tsx` (handleUpdateStatus)

Quando o admin clica "Solicitar Ajuste":
- Cria registro em `ajustes_clinicos` com autor='medico' e a nota escrita
- Cria registro em `notificacoes` para o paciente com tipo='ajuste'
- Atualiza status da avaliação para 'ajuste'

Quando o admin aprova ou rejeita:
- Cria notificação correspondente para o paciente

---

### 5. Mostrar Thread de Ajustes no Dossiê Clínico do Admin

**Arquivo:** `src/components/admin/dashboard/ClinicalDossier.tsx`

- Adicionar nova seção "Ajustes Clínicos" abaixo do dossiê
- Exibe toda a thread de mensagens (pergunta do médico + resposta do paciente) em ordem cronológica
- Formato de chat simples: mensagens do médico alinhadas à esquerda, do paciente à direita
- Se a avaliação estiver em status 'ajuste', permitir enviar nova pergunta
- O admin pode continuar pedindo ajustes (thread cresce)

---

### 6. Rota e Integração

**Arquivo:** `src/App.tsx`

- Adicionar rota `/dashboard/notificacoes` apontando para `DashboardNotificacoes`

---

### Resumo Tecnico dos Arquivos

| Ação | Arquivo |
|------|---------|
| Editar | `src/components/dashboard/DashboardSidebar.tsx` (reordenar menu + adicionar Notificações) |
| Criar | Migration SQL (tabelas `notificacoes` e `ajustes_clinicos` com RLS) |
| Criar | `src/pages/DashboardNotificacoes.tsx` |
| Editar | `src/App.tsx` (nova rota) |
| Editar | `src/pages/admin/AdminDashboard.tsx` (criar notificações + ajustes ao mudar status) |
| Editar | `src/components/admin/dashboard/ClinicalDossier.tsx` (seção de thread de ajustes) |

