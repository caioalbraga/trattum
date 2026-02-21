export const CONSENT_TEXTS = {
  modal: {
    title: "Proteção dos Seus Dados de Saúde",
    subtitle: "Para realizar seu diagnóstico personalizado, precisamos do seu consentimento informado.",
    
    section1Title: "O que faremos com seus dados",
    section1Body: "Suas informações de saúde serão utilizadas exclusivamente para gerar uma avaliação clínica personalizada. Nosso time médico analisará seus dados para recomendar o melhor caminho para seus objetivos de saúde.",
    section1Items: [
      { icon: "clipboard", text: "Dados pessoais de identificação (nome, CPF, e-mail, telefone)" },
      { icon: "heart", text: "Dados de saúde (peso, altura, histórico clínico, sintomas, hábitos)" },
      { icon: "shield", text: "Dados técnicos para segurança (IP, timestamps, logs de navegação)" },
    ],
    section1Highlight: "Seus dados NUNCA serão vendidos ou compartilhados para fins comerciais.",

    section2Title: "Como seus dados são protegidos",
    section2Items: [
      "Criptografia ponta a ponta (AES-256-GCM) em todos os dados sensíveis",
      "Controle de acesso por funções (RBAC) — somente profissionais autorizados",
      "Conformidade total com a Lei Geral de Proteção de Dados (LGPD)",
      "Backups automatizados e retenção segura por 20 anos (Resolução CFM 1.821/2007)",
    ],

    section3Title: "Seus direitos como titular",
    section3Items: [
      "Acessar todos os seus dados a qualquer momento",
      "Solicitar correção de informações incorretas",
      "Solicitar portabilidade dos seus dados",
      "Solicitar exclusão (respeitando retenção legal obrigatória)",
      "Revogar este consentimento a qualquer momento",
    ],

    section4Title: "Aviso Clínico Importante",
    section4Body: "As indicações de tratamento apresentadas são baseadas no seu perfil clínico e estão sujeitas à revisão por profissional médico habilitado (CRM ativo). A Trattum atua como facilitadora e NÃO substitui consulta médica presencial.",
    section4Warning: "NÃO SE AUTOMEDIQUE. Em caso de emergência, ligue para o SAMU: 192.",

    checkbox1: "Li e concordo com os Termos de Uso e a Política de Privacidade da Trattum.",
    checkbox2: "Declaro ter mais de 18 (dezoito) anos de idade e que todas as informações biométricas e clínicas que fornecerei são verídicas e atualizadas.",

    scrollHint: "Role para ler o termo completo",
    acceptButton: "Aceitar e Iniciar Avaliação",
    supportLink: "Tenho dúvidas — falar com suporte",
    termsLink: "Leia o TCLE completo e a Política de Privacidade",
  },

  disclaimer: {
    full: "A indicação de tratamento apresentada é baseada no perfil clínico informado por você e está sujeita a revisão médica assíncrona por profissional habilitado. NÃO SE AUTOMEDIQUE. Em caso de emergência, ligue para o SAMU: 192.",
    compact: "Aviso clínico",
    dismiss: "Entendi",
  },

  terms: {
    pageTitle: "Termos de Uso, Política de Privacidade e TCLE",
    lastUpdated: "15 de fevereiro de 2026",
    version: "1.0",
    sections: [
      {
        id: "objeto",
        number: 1,
        title: "Objeto do Serviço",
        content: `A Trattum é uma plataforma digital de gestão de saúde que utiliza questionários clínicos e algoritmos de análise para gerar indicações personalizadas de tratamento. A plataforma atua como facilitadora entre o paciente e profissionais de saúde habilitados, não substituindo consulta médica presencial.\n\nO serviço inclui:\n\n• Avaliação clínica via questionário de 44 perguntas;\n• Geração de relatório com indicações de tratamento;\n• Revisão médica assíncrona por profissional habilitado (CRM ativo);\n• Facilitação na aquisição de medicamentos e suplementos indicados.`,
      },
      {
        id: "dados-coletados",
        number: 2,
        title: "Dados Coletados",
        content: `Para a prestação dos serviços, a Trattum coleta as seguintes categorias de dados:\n\n**Dados pessoais de identificação:** nome completo, CPF, data de nascimento, endereço, telefone e e-mail.\n\n**Dados sensíveis de saúde:** peso, altura, IMC, circunferência abdominal, histórico clínico, sintomas, hábitos alimentares, padrão de sono, nível de atividade física, medicamentos em uso e resultados de exames.\n\n**Dados técnicos:** endereço IP, timestamp, user-agent e logs de navegação na plataforma.`,
      },
      {
        id: "finalidade",
        number: 3,
        title: "Finalidade do Tratamento de Dados",
        content: `Os dados coletados serão utilizados para as seguintes finalidades:\n\n(i) Realização de diagnóstico clínico personalizado;\n(ii) Geração de indicações de tratamento e metas de saúde;\n(iii) Comunicação com profissionais de saúde;\n(iv) Acompanhamento e evolução do plano de tratamento;\n(v) Registro de auditoria para conformidade legal;\n(vi) Cumprimento de obrigações legais e regulatórias.\n\nOs dados **NÃO** serão utilizados para fins publicitários ou comercialização a terceiros.`,
      },
      {
        id: "base-legal",
        number: 4,
        title: "Base Legal (LGPD)",
        content: `O tratamento de dados pessoais pela Trattum fundamenta-se nas seguintes bases legais da Lei nº 13.709/2018 (LGPD):\n\n• **Consentimento livre e informado** do titular (art. 11, I) — para coleta e processamento de dados sensíveis de saúde;\n• **Tutela da saúde** por profissionais habilitados (art. 11, II, "f") — para compartilhamento com a equipe médica vinculada.`,
      },
      {
        id: "compartilhamento",
        number: 5,
        title: "Compartilhamento de Dados",
        content: `Os dados poderão ser compartilhados exclusivamente com:\n\n• **Profissionais de saúde vinculados** à plataforma, para fins de revisão clínica e acompanhamento;\n• **Laboratórios e farmácias parceiras**, estritamente para execução do tratamento prescrito;\n• **Autoridades competentes**, mediante determinação legal ou judicial.\n\n**Os dados nunca serão vendidos ou cedidos a terceiros para fins comerciais.**`,
      },
      {
        id: "armazenamento",
        number: 6,
        title: "Armazenamento e Segurança",
        content: `A Trattum emprega medidas técnicas e organizacionais para proteção dos dados:\n\n• **Criptografia ponta a ponta** (AES-256-GCM) para dados sensíveis;\n• **Controle de acesso baseado em funções** (RBAC) — somente profissionais autorizados acessam os dados;\n• **Backups automatizados** com redundância geográfica;\n• **Logs de auditoria** imutáveis para rastreabilidade.\n\nOs dados serão armazenados pelo período mínimo de **20 (vinte) anos**, conforme Resolução CFM nº 1.821/2007, que estabelece normas técnicas sobre documentação médica.`,
      },
      {
        id: "direitos",
        number: 7,
        title: "Direitos do Titular",
        content: `Conforme a LGPD, você tem os seguintes direitos:\n\n• **Confirmação** da existência de tratamento de dados;\n• **Acesso** aos dados coletados;\n• **Correção** de dados incompletos, inexatos ou desatualizados;\n• **Anonimização, bloqueio ou eliminação** de dados desnecessários;\n• **Portabilidade** dos dados a outro fornecedor;\n• **Eliminação** dos dados tratados com base no consentimento;\n• **Informação** sobre compartilhamento com terceiros;\n• **Revogação** do consentimento.\n\nPara exercer qualquer destes direitos, entre em contato com nosso Encarregado de Proteção de Dados (DPO) pelo e-mail: **dpo@trattum.com**.`,
      },
      {
        id: "revogacao",
        number: 8,
        title: "Revogação do Consentimento",
        content: `Você pode revogar este consentimento a qualquer momento, sem prejuízo da legalidade do tratamento realizado com base no consentimento anteriormente manifestado.\n\nA revogação poderá implicar na descontinuação dos serviços prestados pela Trattum.\n\n**Importante:** a revogação não se aplica a dados cuja retenção seja obrigatória por força de lei ou regulação (como o período de 20 anos da Resolução CFM nº 1.821/2007).`,
      },
      {
        id: "aviso-clinico",
        number: 9,
        title: "Aviso de Segurança Clínica",
        content: `As indicações de tratamento geradas pela plataforma são baseadas em algoritmos de análise clínica e estão **sujeitas à revisão por profissional médico habilitado** (CRM ativo).\n\nA Trattum **NÃO substitui** consulta médica presencial, diagnóstico profissional ou tratamento emergencial.\n\n⚠️ **NÃO SE AUTOMEDIQUE.** Em caso de emergência, ligue imediatamente para o **SAMU: 192**.`,
      },
      {
        id: "responsabilidade",
        number: 10,
        title: "Responsabilidade do Usuário",
        content: `O usuário declara e se compromete a:\n\n• Fornecer informações **verídicas, completas e atualizadas**;\n• Manter seus dados de acesso (e-mail e senha) em sigilo;\n• Informar imediatamente sobre qualquer alteração relevante em seu quadro de saúde.\n\nA Trattum **não se responsabiliza** por indicações baseadas em dados falsos, incompletos ou desatualizados fornecidos pelo usuário.`,
      },
      {
        id: "reembolso",
        number: 11,
        title: "Política de Reembolso",
        content: `As seguintes regras se aplicam:\n\n**(a) Consulta não realizada:** reembolso integral em até 7 (sete) dias úteis;\n\n**(b) Cancelamento antes da revisão médica:** reembolso integral;\n\n**(c) Cancelamento após revisão médica:** sujeito a análise, com taxa administrativa de até 30%;\n\n**(d) Medicamentos manipulados ou despachados:** sem reembolso, salvo comprovação de vício de qualidade (art. 18, CDC).`,
      },
      {
        id: "auditoria",
        number: 12,
        title: "Registro de Auditoria",
        content: `Todos os consentimentos são registrados automaticamente com:\n\n• **Versão do documento** aceito;\n• **Timestamp UTC** do aceite;\n• **Endereço IP** do dispositivo;\n• **Hash SHA-256** do conteúdo do documento (integridade);\n• **Identificador do usuário**.\n\nEste registro constitui prova jurídica de consentimento conforme a Medida Provisória nº 2.200-2/2001, que institui a Infraestrutura de Chaves Públicas Brasileira (ICP-Brasil) e equipara documentos eletrônicos assinados digitalmente a documentos originais.`,
      },
      {
        id: "dpo",
        number: 13,
        title: "Encarregado de Proteção de Dados (DPO)",
        content: `**Nome:** Encarregado de Proteção de Dados da Trattum\n**E-mail:** dpo@trattum.com\n**Telefone:** (85) 9 9999-9999\n\nO Encarregado é responsável por:\n\n• Aceitar reclamações e comunicações dos titulares;\n• Prestar esclarecimentos às autoridades;\n• Orientar funcionários e contratados sobre práticas de proteção de dados.`,
      },
      {
        id: "foro",
        number: 14,
        title: "Foro Competente",
        content: `Fica eleito o Foro da Comarca de Fortaleza, Estado do Ceará, para dirimir quaisquer questões oriundas destes Termos, com renúncia expressa de qualquer outro, por mais privilegiado que seja.`,
      },
    ],
  },
} as const;
