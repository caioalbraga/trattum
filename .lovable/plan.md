

## Plan: Refazer Formulário de Anamnese (4 Blocos) + Atualizar Prontuário Clínico

### Overview

Substituir completamente o formulário de anamnese atual (quiz step-by-step com ~40 perguntas JSON) por um formulário de 4 blocos em página única, com campos condicionais animados. Atualizar o prontuário clínico (ClinicalDossier) para refletir os novos campos.

### Current State

- Anamnese usa `QuizContainer` + `useQuiz` + `questions.json` (41 questões step-by-step)
- Dados salvos no campo JSONB `respostas` da tabela `avaliacoes`
- ClinicalDossier mapeia keys do quiz antigo para exibição no painel admin
- Não existe storage bucket para fotos

### Changes Required

#### 1. Create Storage Bucket for Photos
- Create `anamnese-fotos` bucket via migration
- Add RLS policies: users upload own photos, admins can view all

#### 2. New Anamnese Page (`src/pages/Anamnese.tsx`)
- Replace quiz-based approach with a single-page, multi-block form
- 4 blocks rendered sequentially with scroll, all on one page
- Use `react-hook-form` for form state management
- Submit saves to `avaliacoes.respostas` JSONB with new key structure

**Block 1 — Identificação:**
- `nome_completo` (text)
- `data_nascimento` (date picker)
- `sexo` (select: Masculino/Feminino)
- `peso_atual` (number, suffix "kg")
- `altura` (number, suffix "cm")

**Block 2 — Histórico de Saúde:**
- `usa_medicamento_continuo` (Sim/Não) → if Sim: `detalhe_medicamento_continuo` (text)
- `historico_familiar_doencas` (Sim/Não) → if Sim: `detalhe_historico_familiar` (text)
- `cirurgia_previa` (Sim/Não) → if Sim: `detalhe_cirurgia` (text)
- **Conditional (sexo=Feminino only):** `ja_esteve_gravida` (Sim/Não) → if Sim: `quantas_gestacoes` (number) + `houve_aborto` (Sim/Não)

**Block 3 — Estilo de Vida:**
- `acompanhamento_nutricional` (Sim/Não)
- `pratica_atividade_fisica` (Sim/Não)

**Block 4 — Medidas e Fotos:**
- Circumferences (number fields): `circ_braco`, `circ_torax`, `circ_cintura`, `circ_quadril`, `circ_perna`
- SVG body silhouette illustration showing measurement points
- 3 photo upload fields: `foto_frente`, `foto_lateral`, `foto_costas`

**Conditional animations:** `framer-motion` AnimatePresence for smooth show/hide of conditional fields.

#### 3. New Component: `src/components/anamnese/AnamneseForm.tsx`
- Main form component with all 4 blocks
- Handles conditional logic client-side (no page redirects)
- On submit: uploads photos to storage bucket, saves all data to `avaliacoes.respostas`

#### 4. Update `useSubmitAssessment.ts`
- Adapt `calculateRiskScore` for new field keys
- Calculate BMI from `peso_atual` and `altura` (instead of `altura_peso` object)

#### 5. Update ClinicalDossier (`src/components/admin/dashboard/ClinicalDossier.tsx`)
- Replace section definitions and `questionLabels` to match new 4-block structure:
  - **Identificação**: nome_completo, data_nascimento, sexo, peso_atual, altura
  - **Histórico de Saúde**: medicamentos, histórico familiar, cirurgias, gestações
  - **Estilo de Vida**: acompanhamento nutricional, atividade física
  - **Medidas**: circumferences
  - **Fotos**: render photo URLs as images
- Keep backward compatibility: old `questionLabels` remain so existing assessments still render correctly
- Conditional fields that weren't answered simply don't appear (existing `ResponseRow` already returns null for empty values)

#### 6. Files Affected
- **Rewrite:** `src/pages/Anamnese.tsx`
- **New:** `src/components/anamnese/AnamneseForm.tsx`
- **New:** `src/components/anamnese/BodySilhouette.tsx` (SVG illustration)
- **New:** `src/components/anamnese/PhotoUpload.tsx`
- **Edit:** `src/hooks/useSubmitAssessment.ts` (adapt risk calculation)
- **Edit:** `src/components/admin/dashboard/ClinicalDossier.tsx` (add new sections, keep old ones)
- **Edit:** `src/components/admin/dashboard/EvaluationsTable.tsx` (adapt summary extraction)
- **No changes** to: `questions.json`, `useQuiz.ts`, `QuizContainer.tsx` (kept for reference but no longer used by `/anamnese` route)
- **DB migration:** Create storage bucket + policies

#### 7. What Will NOT Change
- No table recreation or column alterations
- All data saved as JSONB in existing `respostas` column
- No changes to Results page, auth flow, checkout, or any other pages
- Old assessment data from previous patients remains readable

