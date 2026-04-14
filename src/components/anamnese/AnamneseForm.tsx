import { useState, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parse, isValid } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { BodySilhouette } from './BodySilhouette';
import { PhotoUpload } from './PhotoUpload';
import { useSubmitAssessment } from '@/hooks/useSubmitAssessment';
import { setPendingPhotos } from '@/lib/photo-store';
import { savePendingAnamnese } from '@/lib/pending-anamnese';

const animVariants = {
  initial: { opacity: 0, height: 0, marginTop: 0 },
  animate: { opacity: 1, height: 'auto', marginTop: 12 },
  exit: { opacity: 0, height: 0, marginTop: 0 },
};

interface FormData {
  nome_completo: string;
  data_nascimento: Date | null;
  data_nascimento_display: string;
  sexo: string;
  peso_atual: string;
  altura: string;
  usa_medicamento_continuo: string;
  detalhe_medicamento_continuo: string;
  historico_familiar_doencas: string;
  detalhe_historico_familiar: string;
  cirurgia_previa: string;
  detalhe_cirurgia: string;
  ja_esteve_gravida: string;
  quantas_gestacoes: string;
  houve_aborto: string;
  acompanhamento_nutricional: string;
  pratica_atividade_fisica: string;
  circ_braco: string;
  circ_torax: string;
  circ_cintura: string;
  circ_quadril: string;
  circ_perna: string;
}

function YesNoField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      <RadioGroup value={value} onValueChange={onChange} className="flex gap-4">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="sim" id={`${label}-sim`} />
          <Label htmlFor={`${label}-sim`} className="font-normal cursor-pointer">Sim</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="nao" id={`${label}-nao`} />
          <Label htmlFor={`${label}-nao`} className="font-normal cursor-pointer">Não</Label>
        </div>
      </RadioGroup>
    </div>
  );
}

export function AnamneseForm() {
  const navigate = useNavigate();
  const { submitAssessment, isSubmitting } = useSubmitAssessment();
  const [photos, setPhotos] = useState<{ frente: File | null; lateral: File | null; costas: File | null }>({
    frente: null,
    lateral: null,
    costas: null,
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      nome_completo: '',
      data_nascimento: null,
      data_nascimento_display: '',
      sexo: '',
      peso_atual: '',
      altura: '',
      usa_medicamento_continuo: '',
      detalhe_medicamento_continuo: '',
      historico_familiar_doencas: '',
      detalhe_historico_familiar: '',
      cirurgia_previa: '',
      detalhe_cirurgia: '',
      ja_esteve_gravida: '',
      quantas_gestacoes: '',
      houve_aborto: '',
      acompanhamento_nutricional: '',
      pratica_atividade_fisica: '',
      circ_braco: '',
      circ_torax: '',
      circ_cintura: '',
      circ_quadril: '',
      circ_perna: '',
    },
  });

  const nomeCompleto = watch('nome_completo');
  const sexo = watch('sexo');
  const usaMedicamento = watch('usa_medicamento_continuo');
  const historicoFamiliar = watch('historico_familiar_doencas');
  const cirurgiaPrevia = watch('cirurgia_previa');
  const jaEsteve = watch('ja_esteve_gravida');
  const dataNascimento = watch('data_nascimento');

  // Dev test mode: auto-fill when nome = @dev_test
  const devFilled = useRef(false);
  useEffect(() => {
    if (nomeCompleto === '@dev_test' && !devFilled.current) {
      devFilled.current = true;
      setValue('nome_completo', 'João Silva Teste');
      setValue('data_nascimento_display', '15/03/1990');
      setValue('data_nascimento', new Date(1990, 2, 15));
      setValue('sexo', 'masculino');
      setValue('peso_atual', '95');
      setValue('altura', '175');
      setValue('usa_medicamento_continuo', 'sim');
      setValue('detalhe_medicamento_continuo', 'Losartana 50mg, Metformina 850mg');
      setValue('historico_familiar_doencas', 'sim');
      setValue('detalhe_historico_familiar', 'Diabetes tipo 2, hipertensão arterial');
      setValue('cirurgia_previa', 'nao');
      setValue('detalhe_cirurgia', '');
      setValue('ja_esteve_gravida', '');
      setValue('quantas_gestacoes', '');
      setValue('houve_aborto', '');
      setValue('acompanhamento_nutricional', 'nao');
      setValue('pratica_atividade_fisica', 'sim');
      setValue('circ_braco', '35');
      setValue('circ_torax', '105');
      setValue('circ_cintura', '98');
      setValue('circ_quadril', '104');
      setValue('circ_perna', '60');
      toast.success('🧪 Modo teste: campos preenchidos!');
    }
    if (nomeCompleto !== '@dev_test') devFilled.current = false;
  }, [nomeCompleto, setValue]);

  const uploadPhoto = async (file: File, userId: string, tipo: string): Promise<string | null> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/${tipo}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('anamnese-fotos').upload(path, file);
    if (error) {
      console.error(`Upload error (${tipo}):`, error);
      return null;
    }
    const { data } = supabase.storage.from('anamnese-fotos').getPublicUrl(path);
    return data.publicUrl;
  };

  const onSubmit = async (data: FormData) => {
    // Validate required fields
    if (!data.nome_completo.trim()) { toast.error('Preencha o nome completo.'); return; }
    if (!data.data_nascimento) { toast.error('Selecione a data de nascimento.'); return; }
    if (!data.sexo) { toast.error('Selecione o sexo.'); return; }
    if (!data.peso_atual) { toast.error('Informe o peso atual.'); return; }
    if (!data.altura) { toast.error('Informe a altura.'); return; }

    // Build answers object matching new structure
    const answers: Record<string, unknown> = {
      nome_completo: data.nome_completo.trim(),
      data_nascimento: data.data_nascimento ? format(data.data_nascimento, 'yyyy-MM-dd') : null,
      sexo: data.sexo,
      peso_atual: parseFloat(data.peso_atual),
      altura: parseFloat(data.altura),
      usa_medicamento_continuo: data.usa_medicamento_continuo || 'nao',
      historico_familiar_doencas: data.historico_familiar_doencas || 'nao',
      cirurgia_previa: data.cirurgia_previa || 'nao',
      acompanhamento_nutricional: data.acompanhamento_nutricional || 'nao',
      pratica_atividade_fisica: data.pratica_atividade_fisica || 'nao',
    };

    // Conditional fields
    if (data.usa_medicamento_continuo === 'sim' && data.detalhe_medicamento_continuo.trim()) {
      answers.detalhe_medicamento_continuo = data.detalhe_medicamento_continuo.trim();
    }
    if (data.historico_familiar_doencas === 'sim' && data.detalhe_historico_familiar.trim()) {
      answers.detalhe_historico_familiar = data.detalhe_historico_familiar.trim();
    }
    if (data.cirurgia_previa === 'sim' && data.detalhe_cirurgia.trim()) {
      answers.detalhe_cirurgia = data.detalhe_cirurgia.trim();
    }
    if (data.sexo === 'feminino') {
      answers.ja_esteve_gravida = data.ja_esteve_gravida || 'nao';
      if (data.ja_esteve_gravida === 'sim') {
        if (data.quantas_gestacoes) answers.quantas_gestacoes = parseInt(data.quantas_gestacoes);
        if (data.houve_aborto) answers.houve_aborto = data.houve_aborto;
      }
    }

    // Circumferences
    const circFields = ['circ_braco', 'circ_torax', 'circ_cintura', 'circ_quadril', 'circ_perna'] as const;
    circFields.forEach((f) => {
      if (data[f]) answers[f] = parseFloat(data[f]);
    });

    // Photos stored locally for now - will be uploaded after account creation
    // Photo files are in the `photos` state but not uploaded yet since user has no account

    // --- Client-side validation: age ≥ 18, BMI ≥ 25 ---
    const peso = parseFloat(data.peso_atual);
    const alturaM = parseFloat(data.altura) / 100;
    const bmi = alturaM > 0 ? peso / (alturaM * alturaM) : 0;

    let age = 0;
    if (data.data_nascimento) {
      const today = new Date();
      const birth = new Date(data.data_nascimento);
      age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    }

    if (age < 18 || bmi < 25) {
      sessionStorage.setItem('notEligibleReason', age < 18 ? 'age' : 'bmi');
      navigate('/not-eligible');
      return;
    }

    // Check if user is already logged in
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      // User is logged in — submit directly
      const userId = session.user.id;

      // Upload photos directly
      const photoUrls: Record<string, string> = {};
      const uploadPromises: Promise<void>[] = [];
      for (const [tipo, file] of Object.entries(photos)) {
        if (file) {
          uploadPromises.push(
            uploadPhoto(file as File, userId, tipo).then(url => {
              if (url) photoUrls[`foto_${tipo}`] = url;
            })
          );
        }
      }
      await Promise.all(uploadPromises);

      // Merge photo URLs into answers
      const finalAnswers = { ...answers, ...photoUrls } as Record<string, string | number | boolean | string[] | null | { [fieldId: string]: number | string }>;

      // Submit assessment
      const result = await submitAssessment(finalAnswers);

      if (result.success) {
        // Update profile name with anamnese nome_completo
        await supabase
          .from('profiles')
          .update({ nome: data.nome_completo.trim() })
          .eq('user_id', userId);

        // Persist any pending localStorage consents
        const consentKeys = [
          { key: 'consent_tcle', termo: 'tcle' },
          { key: 'consent_declaracao_veracidade', termo: 'declaracao_veracidade' },
        ];
        const consentsToInsert: Array<{ user_id: string; termo: string; aceito: boolean; aceito_em: string }> = [];
        const now = new Date().toISOString();

        for (const { key, termo } of consentKeys) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (parsed.aceito) {
                consentsToInsert.push({ user_id: userId, termo, aceito: true, aceito_em: parsed.aceito_em || now });
              }
            } catch { /* ignore */ }
          }
        }

        if (consentsToInsert.length > 0) {
          await supabase.from('user_consents').insert(consentsToInsert);
          consentKeys.forEach(({ key }) => localStorage.removeItem(key));
        }

        // Clear session storage
        sessionStorage.removeItem('pendingQuizAnswers');
        navigate('/confirmacao');
      }
    } else {
      // User not logged in — store and redirect to /cadastro
      sessionStorage.setItem('pendingQuizAnswers', JSON.stringify(answers));
      savePendingAnamnese(answers);
      setPendingPhotos(photos);
      navigate('/cadastro');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-8">

      {/* ── BLOCO 1: Identificação ── */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg">1. Identificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Nome completo */}
          <div className="space-y-2">
            <Label htmlFor="nome_completo">Nome completo</Label>
            <Input id="nome_completo" {...register('nome_completo')} placeholder="Seu nome completo" />
          </div>

          {/* Data de nascimento */}
          <div className="space-y-2">
            <Label htmlFor="data_nascimento_display">Data de nascimento</Label>
            <Input
              id="data_nascimento_display"
              placeholder="DD/MM/AAAA"
              maxLength={10}
              value={watch('data_nascimento_display') || ''}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '');
                let masked = '';
                if (raw.length > 0) masked += raw.slice(0, 2);
                if (raw.length > 2) masked += '/' + raw.slice(2, 4);
                if (raw.length > 4) masked += '/' + raw.slice(4, 8);
                setValue('data_nascimento_display', masked);
                if (raw.length === 8) {
                  const parsed = parse(masked, 'dd/MM/yyyy', new Date());
                  if (isValid(parsed) && parsed <= new Date() && parsed >= new Date('1900-01-01')) {
                    setValue('data_nascimento', parsed);
                  } else {
                    setValue('data_nascimento', null);
                  }
                } else {
                  setValue('data_nascimento', null);
                }
              }}
            />
          </div>

          {/* Sexo */}
          <div className="space-y-2">
            <Label>Sexo</Label>
            <Select value={sexo} onValueChange={(v) => setValue('sexo', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Peso / Altura */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="peso_atual">Peso atual</Label>
              <div className="relative">
                <Input
                  id="peso_atual"
                  type="number"
                  step="0.1"
                  {...register('peso_atual')}
                  placeholder="Ex: 85"
                  className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kg</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="altura">Altura</Label>
              <div className="relative">
                <Input
                  id="altura"
                  type="number"
                  step="1"
                  {...register('altura')}
                  placeholder="Ex: 175"
                  className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">cm</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── BLOCO 2: Histórico de Saúde ── */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg">2. Histórico de Saúde</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Medicamento contínuo */}
          <div>
            <YesNoField
              label="Você usa algum medicamento de uso contínuo?"
              value={usaMedicamento}
              onChange={(v) => setValue('usa_medicamento_continuo', v)}
            />
            <AnimatePresence>
              {usaMedicamento === 'sim' && (
                <motion.div {...animVariants} transition={{ duration: 0.3 }}>
                  <Textarea
                    {...register('detalhe_medicamento_continuo')}
                    placeholder="Ex: hormônios, anticoncepcionais, vitaminas, suplementos..."
                    className="mt-3"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Histórico familiar */}
          <div>
            <YesNoField
              label="Sua família tem histórico de doenças ou comorbidades?"
              value={historicoFamiliar}
              onChange={(v) => setValue('historico_familiar_doencas', v)}
            />
            <AnimatePresence>
              {historicoFamiliar === 'sim' && (
                <motion.div {...animVariants} transition={{ duration: 0.3 }}>
                  <Textarea
                    {...register('detalhe_historico_familiar')}
                    placeholder="Ex: obesidade, diabetes, hipertensão, câncer..."
                    className="mt-3"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cirurgia prévia */}
          <div>
            <YesNoField
              label="Você já realizou alguma cirurgia prévia?"
              value={cirurgiaPrevia}
              onChange={(v) => setValue('cirurgia_previa', v)}
            />
            <AnimatePresence>
              {cirurgiaPrevia === 'sim' && (
                <motion.div {...animVariants} transition={{ duration: 0.3 }}>
                  <Textarea
                    {...register('detalhe_cirurgia')}
                    placeholder="Quantas e quais?"
                    className="mt-3"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Gestação - só feminino */}
          <AnimatePresence>
            {sexo === 'feminino' && (
              <motion.div {...animVariants} transition={{ duration: 0.3 }}>
                <div className="border-t border-border pt-5 space-y-4">
                  <YesNoField
                    label="Você já esteve grávida?"
                    value={jaEsteve}
                    onChange={(v) => setValue('ja_esteve_gravida', v)}
                  />
                  <AnimatePresence>
                    {jaEsteve === 'sim' && (
                      <motion.div {...animVariants} transition={{ duration: 0.3 }}>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div className="space-y-2">
                            <Label htmlFor="quantas_gestacoes">Quantas gestações?</Label>
                            <Input
                              id="quantas_gestacoes"
                              type="number"
                              min="1"
                              {...register('quantas_gestacoes')}
                            />
                          </div>
                          <div className="space-y-2">
                            <YesNoField
                              label="Houve algum aborto?"
                              value={watch('houve_aborto')}
                              onChange={(v) => setValue('houve_aborto', v)}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* ── BLOCO 3: Estilo de Vida ── */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg">3. Estilo de Vida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <YesNoField
            label="Você tem acompanhamento nutricional atualmente?"
            value={watch('acompanhamento_nutricional')}
            onChange={(v) => setValue('acompanhamento_nutricional', v)}
          />
          <YesNoField
            label="Você pratica alguma atividade física?"
            value={watch('pratica_atividade_fisica')}
            onChange={(v) => setValue('pratica_atividade_fisica', v)}
          />
        </CardContent>
      </Card>

      {/* ── BLOCO 4: Medidas e Fotos ── */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg">4. Medidas e Fotos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Circunferências com silhueta */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr,200px] gap-6 items-start">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Meça as circunferências nos pontos indicados na ilustração (em cm).
              </p>
              {[
                { id: 'circ_braco', label: 'Braço' },
                { id: 'circ_torax', label: 'Tórax' },
                { id: 'circ_cintura', label: 'Cintura' },
                { id: 'circ_quadril', label: 'Quadril' },
                { id: 'circ_perna', label: 'Perna/Coxa' },
              ].map((field) => (
                <div key={field.id} className="space-y-1">
                  <Label htmlFor={field.id}>{field.label}</Label>
                  <div className="relative">
                    <Input
                      id={field.id}
                      type="number"
                      step="0.1"
                      {...register(field.id as keyof FormData)}
                      placeholder={`Circunferência ${field.label.toLowerCase()}`}
                      className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">cm</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block">
              <BodySilhouette />
            </div>
          </div>

          {/* Upload de fotos */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Fotos corporais</p>
            <p className="text-xs text-muted-foreground">
              Envie fotos de corpo inteiro para acompanhamento visual do tratamento.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <PhotoUpload
                label="Frente"
                value={photos.frente}
                onChange={(f) => setPhotos((p) => ({ ...p, frente: f }))}
              />
              <PhotoUpload
                label="Lateral"
                value={photos.lateral}
                onChange={(f) => setPhotos((p) => ({ ...p, lateral: f }))}
              />
              <PhotoUpload
                label="Costas"
                value={photos.costas}
                onChange={(f) => setPhotos((p) => ({ ...p, costas: f }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-center pb-8">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full max-w-md gap-2"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Enviando avaliação...' : 'Enviar Anamnese'}
        </Button>
      </div>
    </form>
  );
}
