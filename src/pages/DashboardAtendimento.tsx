import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { MessageCircle, HelpCircle } from 'lucide-react';

const faqItems = [
  {
    question: 'Como funciona o tratamento para obesidade?',
    answer: 'O tratamento é personalizado e combina acompanhamento médico, medicação quando necessária, orientação nutricional e suporte contínuo. Começamos com uma avaliação completa do seu perfil de saúde para criar um plano adequado às suas necessidades.',
  },
  {
    question: 'Quanto tempo leva para ver resultados?',
    answer: 'Os resultados variam de pessoa para pessoa, mas a maioria dos pacientes começa a notar mudanças significativas nas primeiras 4 a 8 semanas de tratamento. O acompanhamento regular ajuda a ajustar o plano conforme necessário.',
  },
  {
    question: 'Os medicamentos são seguros?',
    answer: 'Todos os medicamentos prescritos são aprovados pela ANVISA e têm sua segurança comprovada cientificamente. Nossos médicos avaliam cuidadosamente seu histórico antes de qualquer prescrição.',
  },
  {
    question: 'Como faço para renovar meu tratamento?',
    answer: 'A renovação pode ser feita diretamente pela plataforma na seção "Tratamento". Você receberá um lembrete antes da data de renovação para facilitar o processo.',
  },
  {
    question: 'Posso pausar meu tratamento?',
    answer: 'Sim, é possível pausar o tratamento se necessário. Entre em contato com nossa equipe para avaliar a melhor forma de fazer isso sem prejudicar seus resultados.',
  },
  {
    question: 'O tratamento é coberto por plano de saúde?',
    answer: 'Atualmente nosso tratamento é particular, mas oferecemos opções de parcelamento. Alguns planos de saúde podem reembolsar parte do valor - consulte sua operadora.',
  },
];

export default function DashboardAtendimento() {
  const handleWhatsApp = () => {
    window.open('https://wa.me/5511999999999?text=Olá! Preciso de ajuda com meu tratamento na Trattum.', '_blank');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-serif text-3xl lg:text-4xl font-semibold text-foreground">
            Atendimento
          </h1>
          <p className="text-muted-foreground mt-2">
            Estamos aqui para ajudar você em sua jornada.
          </p>
        </div>

        {/* Quick Actions */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Fale Conosco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Precisa de ajuda? Nossa equipe de especialistas está disponível para tirar suas dúvidas.
            </p>
            <Button 
              onClick={handleWhatsApp}
              className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Falar com Especialista via WhatsApp
            </Button>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Perguntas Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
