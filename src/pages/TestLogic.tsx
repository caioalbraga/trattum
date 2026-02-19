import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { WeightChart } from '@/components/results/WeightChart';
import {
  runSimulation,
  SimulationParams,
  getBMICategory,
  RELEVANT_COMORBIDITIES,
} from '@/lib/assessment-logic';
import { Beaker, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

// Export the comorbidities constant for this module
const COMORBIDITY_OPTIONS = [
  { id: 'diabetes_tipo_2', label: 'Diabetes Tipo 2' },
  { id: 'hipertensao', label: 'Hipertensão' },
  { id: 'colesterol_alto', label: 'Colesterol Alto' },
  { id: 'apneia_sono', label: 'Apneia do Sono' },
  { id: 'problemas_cardiacos', label: 'Problemas Cardíacos' },
  { id: 'sindrome_metabolica', label: 'Síndrome Metabólica' },
];

// Preset test scenarios
const TEST_SCENARIOS = [
  {
    name: 'Tier 1 - Saudável',
    description: 'IMC < 27, sem comorbidades',
    params: { weight: 70, height: 175, age: 35, conditions: [] },
  },
  {
    name: 'Tier 1 - Sobrepeso Leve',
    description: 'IMC 25-27, sem comorbidades',
    params: { weight: 80, height: 175, age: 35, conditions: [] },
  },
  {
    name: 'Tier 2 - Sobrepeso + Comorbidade',
    description: 'IMC 27-30 com hipertensão',
    params: { weight: 88, height: 175, age: 45, conditions: ['hipertensao'] },
  },
  {
    name: 'Tier 3 - Obesidade Grau I',
    description: 'IMC > 30',
    params: { weight: 95, height: 175, age: 40, conditions: [] },
  },
  {
    name: 'Tier 3 - Obesidade + Múltiplas Comorbidades',
    description: 'IMC > 35 com diabetes e hipertensão',
    params: { weight: 110, height: 170, age: 50, conditions: ['diabetes_tipo_2', 'hipertensao'] },
  },
];

export default function TestLogic() {
  const [params, setParams] = useState<SimulationParams>({
    weight: 85,
    height: 170,
    age: 35,
    conditions: [],
  });

  const simulation = useMemo(() => runSimulation(params), [params]);

  const handleConditionToggle = (conditionId: string) => {
    setParams(prev => ({
      ...prev,
      conditions: prev.conditions.includes(conditionId)
        ? prev.conditions.filter(c => c !== conditionId)
        : [...prev.conditions, conditionId],
    }));
  };

  const loadScenario = (scenario: typeof TEST_SCENARIOS[0]) => {
    setParams(scenario.params);
  };

  const tierColors = {
    tier1: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    tier2: 'bg-amber-100 text-amber-800 border-amber-300',
    tier3: 'bg-rose-100 text-rose-800 border-rose-300',
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Beaker className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-medium text-foreground">
              Modo Desenvolvedor - Simulador de Lógica
            </h1>
            <p className="text-sm text-muted-foreground">
              Teste diferentes combinações de peso/altura e visualize o resultado
            </p>
          </div>
        </div>

        {/* Warning banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Página de Desenvolvimento</p>
            <p className="text-sm text-amber-700">
              Esta página é apenas para testes internos. Não expor em produção.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="space-y-6">
            {/* Quick Scenarios */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Cenários de Teste Rápido</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TEST_SCENARIOS.map((scenario, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadScenario(scenario)}
                    className="text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <p className="font-medium text-sm">{scenario.name}</p>
                    <p className="text-xs text-muted-foreground">{scenario.description}</p>
                  </button>
                ))}
              </div>
            </Card>

            {/* Manual Input */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Parâmetros Manuais</h2>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <Label htmlFor="weight" className="text-xs">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={params.weight}
                    onChange={(e) => setParams(p => ({ ...p, weight: Number(e.target.value) }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="height" className="text-xs">Altura (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={params.height}
                    onChange={(e) => setParams(p => ({ ...p, height: Number(e.target.value) }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="age" className="text-xs">Idade</Label>
                  <Input
                    id="age"
                    type="number"
                    value={params.age}
                    onChange={(e) => setParams(p => ({ ...p, age: Number(e.target.value) }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs mb-2 block">Comorbidades</Label>
                <div className="grid grid-cols-2 gap-2">
                  {COMORBIDITY_OPTIONS.map(({ id, label }) => (
                    <label
                      key={id}
                      className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={params.conditions.includes(id)}
                        onCheckedChange={() => handleConditionToggle(id)}
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            {/* Tier Result */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Resultado da Classificação</h2>
              
              <div className="space-y-4">
                {/* BMI Display */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">IMC Calculado</p>
                    <p className="text-3xl font-serif font-medium">{simulation.bmi.toFixed(1)}</p>
                  </div>
                  <Badge className={simulation.bmiCategory.color.replace('text-', 'bg-').replace('-600', '-100').replace('-500', '-100')}>
                    {simulation.bmiCategory.category}
                  </Badge>
                </div>

                {/* Tier Badge */}
                <div className={`p-4 rounded-lg border-2 ${tierColors[simulation.tierInfo.tier]}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold">
                      Tier {simulation.tierInfo.tierNumber}
                    </span>
                    {simulation.tierInfo.medicationAllowed ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600" />
                    )}
                  </div>
                  <p className="font-semibold">{simulation.tierInfo.name}</p>
                  <p className="text-sm opacity-80">{simulation.tierInfo.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    <span className="text-sm">
                      {simulation.tierInfo.medicationAllowed 
                        ? 'Medicação liberada para venda' 
                        : 'Venda de medicação BLOQUEADA'}
                    </span>
                  </div>
                </div>

                {/* Comorbidity check */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Comorbidades Detectadas</p>
                  <p className="font-medium">
                    {simulation.hasComorbidities 
                      ? `Sim (${params.conditions.length} condição${params.conditions.length > 1 ? 'ões' : ''})` 
                      : 'Não'}
                  </p>
                </div>

                {/* Treatment Details */}
                <div className="p-4 border border-border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Pacote Recomendado</p>
                  <p className="font-semibold text-lg">{simulation.packageDetails.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {simulation.packageDetails.description}
                  </p>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">
                      R$ {simulation.packageDetails.price}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Weight Projection */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Projeção de Peso (Curva Logarítmica)</h2>
              <div className="text-sm text-muted-foreground mb-4">
                <p>Meta: 18% de perda em 6 meses</p>
                <p>Peso alvo: {simulation.potentialLoss.targetWeight}kg (-{simulation.potentialLoss.targetPercent}%)</p>
              </div>
              <WeightChart
                data={simulation.weightProjection}
                currentWeight={params.weight}
                targetWeight={simulation.potentialLoss.targetWeight}
              />
            </Card>
          </div>
        </div>

        {/* Debug JSON */}
        <Card className="mt-8 p-6">
          <h2 className="text-lg font-semibold mb-4">Debug JSON</h2>
          <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
            {JSON.stringify({ params, simulation }, null, 2)}
          </pre>
        </Card>
      </main>
    </div>
  );
}
