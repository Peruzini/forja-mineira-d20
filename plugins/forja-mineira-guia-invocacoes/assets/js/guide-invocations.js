(() => {
  'use strict';

  function initGuide(root) {
    if (root.dataset.fmgiReady === '1') return;
    root.dataset.fmgiReady = '1';

    const filterButtons = Array.from(root.querySelectorAll('.fmgi-style-filters [data-fmgi-filter]'));
    const functionButtons = Array.from(root.querySelectorAll('.fmgi-function-filters [data-fmgi-function-filter]'));
    const analysisButtons = Array.from(root.querySelectorAll('[data-fmgi-analysis-open]'));
    const analysisWrap = root.querySelector('[data-fmgi-analysis-wrap]');
    const analysisClose = Array.from(root.querySelectorAll('[data-fmgi-analysis-close]'));
    const analysisData = {"1": {"pt": "Armadura das Sombras", "en": "Armor of Shadows", "level": "Nível 1+", "tier": "SITUACIONAL", "tags": "DEFESA", "why": "Armadura Arcana (Mage Armor) sempre disponível sem gastar espaço de magia. Resolve uma necessidade defensiva básica quando sua CA ainda não está bem coberta.", "when": "Níveis iniciais, personagens com boa Destreza e mesas em que você ainda não conseguiu uma solução defensiva melhor.", "avoid": "Se sua CA já está resolvida por equipamento, outra característica ou por um talento que também entregue Armadura Arcana. A Invocação passa a competir com opções mais transformadoras.", "synergy": "Bruxos expostos a ataques e builds de Lâmina no começo da campanha, enquanto a defesa ainda é um problema real.", "swap": "É uma candidata natural a ser trocada assim que outra solução de CA tornar o benefício redundante."}, "2": {"pt": "Mente Mística", "en": "Eldritch Mind", "level": "Nível 1+", "tier": "BOA", "tags": "DEFESA", "why": "Vantagem nos testes de Constituição para manter Concentração. É uma forma direta de proteger magias que sustentam seu plano de combate.", "when": "Quando sua build depende de Concentração e você ainda não tem outra fonte confiável de vantagem nesses testes.", "avoid": "Se Conjurador de Guerra (War Caster) ou outra solução já cobre o mesmo problema, porque você passa a pagar uma Invocação por um benefício duplicado.", "synergy": "Magias de Concentração que você pretende manter por vários turnos, especialmente em combates onde o Bruxo toma dano com frequência.", "swap": "Excelente como escolha temporária: pode sair quando sua build adquirir outra proteção consistente para Concentração."}, "3": {"pt": "Pacto da Lâmina", "en": "Pact of the Blade", "level": "Nível 1+", "tier": "NÚCLEO", "tags": "DANO", "why": "É a fundação da rota de arma: permite estruturar o Bruxo em torno de Carisma e abre a cadeia de Invocações que aumenta ataques e dano nos níveis seguintes.", "when": "Quando ataques com arma serão uma parte central do seu turno, e não apenas uma opção ocasional.", "avoid": "Se você pretende atacar quase sempre com truques. Sem investimento posterior, pegar o pacto só para “ter uma arma” costuma consumir uma Invocação sem retorno proporcional.", "synergy": "Lâmina Sedenta (Thirsting Blade), Bebedor de Vida (Lifedrinker), Lâmina Devoradora (Devouring Blade), Vigor Infernal (Fiendish Vigor) e efeitos que aumentem sua sobrevivência no corpo a corpo.", "swap": "Normalmente permanece na build. Não pode ser removida enquanto for pré-requisito de outra Invocação que você ainda possui."}, "4": {"pt": "Pacto da Corrente", "en": "Pact of the Chain", "level": "Nível 1+", "tier": "EXCELENTE", "tags": "EXPLORAÇÃO · UTILIDADE", "why": "Transforma o familiar em uma ferramenta muito acima do padrão para reconhecimento, exploração e decisões táticas, graças às formas especiais disponíveis.", "when": "Campanhas com exploração, infiltração, scouting e jogadores que realmente usam o familiar para obter informação ou criar linhas táticas.", "avoid": "Se o familiar tende a ficar esquecido ou se a campanha quase nunca recompensa reconhecimento e interação fora do combate.", "synergy": "Investimento do Mestre da Corrente (Investment of the Chain Master) quando você quer levar o familiar para o combate; Visão do Diabo (Devil’s Sight) e outras estratégias de posicionamento podem criar combinações úteis.", "swap": "Pode sair se a campanha mostrar que o familiar não está gerando valor suficiente; como os Pactos não são exclusivos em 2024, também pode coexistir com outra rota."}, "5": {"pt": "Pacto do Tomo", "en": "Pact of the Tome", "level": "Nível 1+", "tier": "EXCELENTE", "tags": "UTILIDADE · EXPLORAÇÃO", "why": "Três truques e dois rituais de 1º nível criam uma caixa de ferramentas muito flexível. O livro pode ser recriado após descanso, permitindo ajustar essas escolhas com frequência.", "when": "Quando você quer cobrir lacunas do grupo, resolver exploração e investigação com magia e ter respostas diferentes conforme a aventura.", "avoid": "Se o grupo já cobre toda a utilidade relevante e sua build está pressionada por Invocações ofensivas ou defensivas mais urgentes.", "synergy": "Presente dos Protetores (Gift of the Protectors) dá ao Tomo uma identidade forte de suporte. Também funciona bem como pacto secundário, já que os Pactos não são exclusivos.", "swap": "Não precisa ser trocado apenas para mudar truques e rituais: a própria recriação do Livro das Sombras já permite adaptar essas escolhas."}, "6": {"pt": "Explosão Agonizante", "en": "Agonizing Blast", "level": "Nível 2+", "tier": "NÚCLEO", "tags": "DANO", "why": "Adiciona Carisma às jogadas de dano do truque escolhido. Em truques com múltiplas jogadas de dano, como Rajada Mística (Eldritch Blast), escala de forma especialmente eficiente.", "when": "Quando um truque ofensivo é sua ação de ataque padrão e você quer transformar consistência em dano recorrente.", "avoid": "Em uma build que dependa quase exclusivamente de ataques com arma e pouco use truques ofensivos.", "synergy": "Explosão Repulsiva (Repelling Blast) combina dano consistente com controle de posição. Rajada Mística aproveita muito bem o benefício conforme ganha mais ataques.", "swap": "Só tende a sair se você abandonar o truque escolhido como fonte principal de dano."}, "7": {"pt": "Explosão Repulsiva", "en": "Repelling Blast", "level": "Nível 2+", "tier": "EXCELENTE", "tags": "CONTROLE", "why": "Converte acertos de truque em deslocamento forçado. Isso pode proteger aliados, quebrar posicionamento inimigo e transformar o terreno em parte do seu dano.", "when": "Mapas com gargalos, perigos, áreas persistentes ou inimigos corpo a corpo que você quer manter longe.", "avoid": "Encontros em espaços muito apertados ou grupos que precisam manter o alvo perto dos aliados corpo a corpo.", "synergy": "Rajada Mística (Eldritch Blast), áreas perigosas e efeitos que reduzem deslocamento. Quanto mais ataques o truque faz, mais oportunidades de reposicionar aparecem.", "swap": "Pode ser trocada se a campanha quase nunca usar mapas onde posicionamento faça diferença."}, "8": {"pt": "Visão do Diabo", "en": "Devil's Sight", "level": "Nível 2+", "tier": "BOA", "tags": "UTILIDADE · EXPLORAÇÃO", "why": "Permite operar normalmente em escuridão mágica e não mágica. É uma ferramenta de percepção que também pode virar vantagem tática.", "when": "Quando sua mesa usa escuridão com frequência ou quando sua própria build pretende explorar Escuridão (Darkness).", "avoid": "Se a estratégia de escuridão atrapalhar mais os seus aliados do que os inimigos. A combinação é forte individualmente, mas pode piorar o combate do grupo.", "synergy": "Escuridão (Darkness), familiars capazes de carregar objetos e outras táticas que controlam linhas de visão.", "swap": "Sai facilmente se a campanha não usar escuridão relevante ou se o grupo não gostar da dinâmica da combinação."}, "9": {"pt": "Lança Mística", "en": "Eldritch Spear", "level": "Nível 2+", "tier": "SITUACIONAL", "tags": "UTILIDADE", "why": "Aumenta drasticamente o alcance de um truque ofensivo, permitindo atuar de distâncias que poucas criaturas conseguem responder.", "when": "Mapas abertos, combates em exteriores e encontros onde distância real é uma vantagem tática recorrente.", "avoid": "Masmorras, corredores e mapas normais em que o alcance padrão de Rajada Mística já é mais do que suficiente.", "synergy": "Rajada Mística (Eldritch Blast) e builds que valorizam controle de distância.", "swap": "É uma das primeiras candidatas a troca se o alcance extra passar vários encontros sem fazer diferença."}, "10": {"pt": "Vigor Infernal", "en": "Fiendish Vigor", "level": "Nível 2+", "tier": "EXCELENTE", "tags": "DEFESA", "why": "Vida Falsa (False Life) sem slot e com o valor máximo dos PV temporários. Em 2024, isso significa uma camada defensiva consistente e renovável.", "when": "Níveis baixos e Bruxos de Lâmina, que entram mais em alcance de ataques e sentem mais a combinação de d8 com armadura leve.", "avoid": "Quando sua subclasse, grupo ou outro recurso já fornece PV temporários com frequência, porque os valores não se acumulam.", "synergy": "Pacto da Lâmina (Pact of the Blade) e qualquer build que precise absorver dano sem gastar Magia de Pacto.", "swap": "Pode perder valor nos níveis altos ou quando outra fonte de PV temporários se torna melhor e mais frequente."}, "11": {"pt": "Lições dos Primeiros", "en": "Lessons of the First Ones", "level": "Nível 2+", "tier": "EXCELENTE", "tags": "UTILIDADE", "why": "Concede um talento de Origem sem gastar seu aumento normal de atributo/talento. É uma forma muito flexível de preencher necessidades específicas da build.", "when": "Quando um talento de Origem resolve uma lacuna concreta: perícias, truques, resistência ou outra função que sua composição realmente aproveita.", "avoid": "Se você está escolhendo um talento apenas porque a opção existe. Uma Invocação direta costuma ser melhor do que um benefício que sua build quase não usa.", "synergy": "Depende inteiramente do talento escolhido; o valor cresce quando ele fecha uma necessidade que exigiria outro investimento importante.", "swap": "Só troque se estiver disposto a perder o talento concedido e se outra Invocação passar a ter impacto maior."}, "12": {"pt": "Máscara de Muitas Faces", "en": "Mask of Many Faces", "level": "Nível 2+", "tier": "BOA", "tags": "SOCIAL · UTILIDADE", "why": "Disfarçar-se (Disguise Self) à vontade permite trocar aparência sem pressionar seus espaços de magia.", "when": "Intriga, infiltração, espionagem, fuga e campanhas sociais em que identidade e acesso importam.", "avoid": "Campanhas quase inteiramente focadas em combate e exploração de masmorra, onde disfarces raramente resolvem problemas.", "synergy": "Carisma alto, perícias sociais e planos em que você precisa assumir identidades repetidamente.", "swap": "A campanha dita o valor. Se a parte social desaparecer, ela pode virar uma Invocação livre para outro papel."}, "13": {"pt": "Visões Nebulosas", "en": "Misty Visions", "level": "Nível 2+", "tier": "EXCELENTE", "tags": "CONTROLE · UTILIDADE", "why": "Imagem Silenciosa (Silent Image) à vontade oferece controle criativo de informação e espaço sem gastar recursos.", "when": "Jogadores criativos e mesas em que ilusões são tratadas como ferramentas reais para distração, cobertura visual e engano.", "avoid": "Se a mesa raramente recompensa ilusões ou se você prefere efeitos com resultado mais previsível e direto.", "synergy": "Infiltração, controle de terreno e personagens com boa capacidade de sustentar blefes e planos.", "swap": "Se várias sessões passarem sem a ilusão encontrar uso, é um sinal de que sua mesa pode valorizar outro tipo de Invocação."}, "14": {"pt": "Salto Sobrenatural", "en": "Otherworldly Leap", "level": "Nível 2+", "tier": "SITUACIONAL", "tags": "EXPLORAÇÃO · UTILIDADE", "why": "Salto (Jump) à vontade melhora mobilidade vertical e atravessa obstáculos sem gastar slot.", "when": "Exploração física, mapas com desníveis e níveis em que você ainda não possui uma forma melhor de voo ou deslocamento.", "avoid": "Quando voo ou outras soluções de mobilidade já tornaram o salto redundante.", "synergy": "Exploração e combate em terrenos com elevação, obstáculos ou áreas difíceis de alcançar.", "swap": "É uma escolha tipicamente temporária; perde espaço assim que sua build consegue mobilidade superior."}, "15": {"pt": "Passo Ascendente", "en": "Ascendant Step", "level": "Nível 5+", "tier": "BOA", "tags": "EXPLORAÇÃO · UTILIDADE", "why": "Levitação (Levitate) à vontade oferece acesso vertical e pode manter você fora do alcance de ameaças terrestres sem gastar slot.", "when": "Exploração vertical e encontros em que ficar fora do chão muda significativamente sua segurança.", "avoid": "Em combate, Levitação exige Concentração; isso compete com algumas das melhores magias sustentadas do Bruxo.", "synergy": "Posicionamento defensivo, exploração e situações em que você precisa alcançar locais altos sem gastar recursos.", "swap": "Quando voo ou outra mobilidade aérea confiável estiver disponível, o nicho diminui bastante."}, "16": {"pt": "Golpe Místico", "en": "Eldritch Smite", "level": "Nível 5+", "tier": "BOA", "tags": "DANO · CONTROLE", "why": "Transforma um acerto com a arma do pacto em burst de dano e pode derrubar o alvo. O poder é reativo: você decide depois de acertar.", "when": "Críticos, alvos prioritários ou inimigos voadores em que o estado Caído pode mudar imediatamente a luta.", "avoid": "Não trate como botão automático de dano. Cada uso consome um dos poucos espaços de Magia de Pacto, e uma magia completa costuma gerar mais valor.", "synergy": "Pacto da Lâmina (Pact of the Blade), críticos e aliados que se beneficiam de um inimigo Caído.", "swap": "Se você nunca encontra momentos em que o burst ou o derrubar justificam perder um slot, outra Invocação pode ser mais consistente."}, "17": {"pt": "Olhar de Duas Mentes", "en": "Gaze of Two Minds", "level": "Nível 5+", "tier": "EXCELENTE", "tags": "EXPLORAÇÃO · UTILIDADE", "why": "Permite perceber pelos sentidos de uma criatura voluntária e manter a conexão à distância; em alcance adequado, também abre linhas incomuns para conjurar a partir da posição dela.", "when": "Scouting, infiltração, aliados móveis e encontros em que você quer ameaçar uma área sem expor o próprio Bruxo.", "avoid": "Se sua equipe raramente se separa ou se o custo de Ação Bônus para manter a conexão compete demais com seu turno.", "synergy": "Aliados furtivos ou invisíveis e magias cujo ponto de origem ganha muito ao ser deslocado.", "swap": "É muito forte em grupos coordenados; perde parte do brilho se o grupo não explora posicionamento e reconhecimento."}, "18": {"pt": "Dádiva das Profundezas", "en": "Gift of the Depths", "level": "Nível 5+", "tier": "SITUACIONAL", "tags": "EXPLORAÇÃO · UTILIDADE", "why": "Respiração aquática, deslocamento de natação e Respirar na Água (Water Breathing) uma vez por Descanso Longo resolvem exploração submarina sem depender de slots.", "when": "Campanhas marítimas, subaquáticas ou aventuras em que água profunda é um obstáculo recorrente.", "avoid": "Fora desse contexto, grande parte do benefício pode passar sessões inteiras sem aparecer.", "synergy": "Exploração aquática e grupos que precisam levar várias pessoas para ambientes submersos.", "swap": "Uma das Invocações mais dependentes da campanha; troque quando o arco aquático terminar."}, "19": {"pt": "Investimento do Mestre da Corrente", "en": "Investment of the Chain Master", "level": "Nível 5+", "tier": "NÚCLEO", "tags": "DANO · CONTROLE", "why": "É a evolução de combate do Pacto da Corrente: melhora mobilidade, comando de ataque, CD de efeitos e resistência do familiar.", "when": "Quando o familiar realmente participa do combate e você quer investir ações e reações para mantê-lo relevante.", "avoid": "Se o familiar é apenas scout. Familiars continuam frágeis e investir demais em dano pode expô-los a riscos desnecessários.", "synergy": "Pacto da Corrente (Pact of the Chain), fontes de PV temporários/CA para o familiar e formas com efeitos úteis além do dano bruto.", "swap": "Se o familiar vive escondido ou cai com facilidade demais, o investimento pode ser redirecionado para exploração ou poder pessoal."}, "20": {"pt": "Mestre de Muitas Formas", "en": "Master of Myriad Forms", "level": "Nível 5+", "tier": "BOA", "tags": "SOCIAL · UTILIDADE", "why": "Alterar-se (Alter Self) à vontade oferece adaptação física e mudança de aparência real, não ilusória.", "when": "Campanhas sociais, infiltração e situações em que adaptação física ou uma transformação verdadeira resolvem obstáculos.", "avoid": "Muitas opções são situacionais, e Alterar-se exige Concentração. Para simples disfarce, Máscara de Muitas Faces chega antes e pode ser mais prática.", "synergy": "Personagens sociais e campanhas que recompensam soluções de infiltração e adaptação.", "swap": "Se você usa apenas mudança de aparência, compare diretamente com Máscara de Muitas Faces e mantenha a opção que interfere menos na sua Concentração."}, "21": {"pt": "Um com as Sombras", "en": "One with Shadows", "level": "Nível 5+", "tier": "EXCELENTE", "tags": "EXPLORAÇÃO · UTILIDADE", "why": "Invisibilidade (Invisibility) em você mesmo sem slot quando está em penumbra ou escuridão. Isso transforma o Bruxo em um scout muito difícil de detectar.", "when": "Exploração, infiltração, emboscadas e locais onde você consegue permanecer em luz baixa ou escuridão.", "avoid": "Ambientes muito iluminados ou campanhas onde scouting quase não importa.", "synergy": "Furtividade, Visão do Diabo (Devil’s Sight) e grupos que valorizam reconhecimento antes de entrar em uma sala.", "swap": "Continua forte por muitos níveis; só perde espaço se a campanha não criar oportunidades de infiltração."}, "22": {"pt": "Lâmina Sedenta", "en": "Thirsting Blade", "level": "Nível 5+", "tier": "NÚCLEO", "tags": "DANO", "why": "Concede o segundo ataque com sua arma de pacto. É o marco que mantém uma build de arma acompanhando a progressão ofensiva de outros combatentes.", "when": "No nível 5, se ataques com arma são o plano principal da build.", "avoid": "Se você não usa a arma de pacto com frequência. Nesse caso, não vale investir uma Invocação em uma ação que quase nunca escolhe.", "synergy": "Pacto da Lâmina (Pact of the Blade), Bebedor de Vida (Lifedrinker) e, mais tarde, Lâmina Devoradora (Devouring Blade).", "swap": "Para um Bladelock dedicado, normalmente não sai; ela também é pré-requisito para a progressão posterior."}, "23": {"pt": "Sussurros do Túmulo", "en": "Whispers of the Grave", "level": "Nível 7+", "tier": "BOA", "tags": "EXPLORAÇÃO · UTILIDADE", "why": "Falar com os Mortos (Speak with Dead) à vontade transforma cadáveres em uma fonte recorrente de pistas e contexto.", "when": "Mistério, investigação, campanhas urbanas e aventuras em que informação perdida costuma ser valiosa.", "avoid": "Se a campanha é quase só combate ou se o Mestre raramente coloca informação útil em NPCs mortos.", "synergy": "Perícias de investigação/social e grupos que gostam de resolver problemas por informação antes de agir.", "swap": "É totalmente dependente do tipo de campanha; excelente em investigação, descartável em aventuras sem esse foco."}, "24": {"pt": "Presente dos Protetores", "en": "Gift of the Protectors", "level": "Nível 9+", "tier": "EXCELENTE", "tags": "DEFESA · UTILIDADE", "why": "Permite registrar aliados no Livro das Sombras e, uma vez por Descanso Longo, transformar uma queda a 0 PV em 1 PV. É uma proteção coletiva rara para uma Invocação.", "when": "Grupos que enfrentam encontros perigosos e valorizam uma rede de segurança para evitar que um personagem caia no pior momento.", "avoid": "Se você não possui Pacto do Tomo ou se sua mesa raramente ameaça derrubar personagens a 0 PV.", "synergy": "Pacto do Tomo (Pact of the Tome) e grupos com vários personagens que se expõem ao risco; o livro permite cadastrar múltiplos nomes.", "swap": "É uma excelente peça tardia de suporte; só faz sentido sair se a campanha for pouco letal ou se o slot de Invocação tiver prioridade mais urgente."}, "25": {"pt": "Bebedor de Vida", "en": "Lifedrinker", "level": "Nível 9+", "tier": "NÚCLEO", "tags": "DANO · DEFESA", "why": "Adiciona dano extra uma vez por turno e ainda permite gastar Dado de Vida para recuperar PV após acertar com a arma de pacto.", "when": "Bruxos de Lâmina que já estão comprometidos com combate de arma e precisam de dano consistente com uma camada de sustentação.", "avoid": "Builds que raramente atacam com a arma de pacto ou que não querem gastar Dados de Vida para cura em combate.", "synergy": "Pacto da Lâmina (Pact of the Blade), Lâmina Sedenta (Thirsting Blade) e Lâmina Devoradora (Devouring Blade).", "swap": "É uma evolução natural de Bladelock; normalmente permanece quando a rota está consolidada."}, "26": {"pt": "Visões de Reinos Distantes", "en": "Visions of Distant Realms", "level": "Nível 9+", "tier": "EXCELENTE", "tags": "EXPLORAÇÃO · UTILIDADE", "why": "Olho Arcano (Arcane Eye) sem gastar slot permite reconhecer áreas perigosas repetidamente antes de comprometer o grupo.", "when": "Masmorras, exploração, armadilhas e mesas onde saber o que existe na próxima sala evita recursos gastos ou riscos desnecessários.", "avoid": "Campanhas muito abertas ou narrativas onde reconhecimento prévio quase nunca muda decisões.", "synergy": "Grupos cuidadosos, exploração tática e personagens que gostam de coletar informação antes do combate.", "swap": "É uma das melhores ferramentas de scouting nos níveis altos; só perde valor se a campanha não oferecer espaço para reconhecimento."}, "27": {"pt": "Lâmina Devoradora", "en": "Devouring Blade", "level": "Nível 12+", "tier": "NÚCLEO", "tags": "DANO", "why": "Evolui Lâmina Sedenta para três ataques com a arma de pacto. É o salto ofensivo de nível alto que define a continuação da rota de Lâmina.", "when": "No nível 12, para Bladelocks dedicados que continuam usando a ação Atacar como principal fonte de pressão.", "avoid": "Se sua build já migrou para conjuração como plano principal ou se ataques com arma viraram uma ferramenta secundária.", "synergy": "Pacto da Lâmina (Pact of the Blade), Lâmina Sedenta (Thirsting Blade), Bebedor de Vida (Lifedrinker) e buffs que escalam com número de ataques.", "swap": "Para a rota de Lâmina dedicada, é uma peça de fim de progressão e dificilmente deve sair."}, "28": {"pt": "Visão da Bruxa", "en": "Witch Sight", "level": "Nível 15+", "tier": "EXCELENTE", "tags": "EXPLORAÇÃO · UTILIDADE", "why": "Visão Verdadeira (Truesight) permanente em curto alcance resolve invisibilidade, ilusões e transformações sem consumir magia.", "when": "Níveis altos, especialmente em campanhas com inimigos que usam disfarces mágicos, invisibilidade ou ilusões com frequência.", "avoid": "Seu impacto varia muito por encontro; se esses efeitos não aparecem na campanha, a Invocação pode ficar ociosa.", "synergy": "Exploração, investigação e combate contra criaturas que dependem de ocultação mágica.", "swap": "É poderosa, mas não universal. Avalie pelo tipo de ameaça que realmente aparece na sua mesa."}};
    const levelButtons = Array.from(root.querySelectorAll('[data-fmgi-level-filter]'));
    const routeButtons = Array.from(root.querySelectorAll('[data-fmgi-route]'));
    const routePanels = Array.from(root.querySelectorAll('[data-fmgi-route-panel]'));
    const routePopover = root.querySelector('[data-fmgi-route-popover]');
    const routeDetail = root.querySelector('#rota-escolhida');
    const routeDismissers = Array.from(root.querySelectorAll('[data-fmgi-route-dismiss]'));
    const cards = Array.from(root.querySelectorAll('.fmgi-card[data-fmgi-tags]'));
    const empty = root.querySelector('[data-fmgi-empty]');
    const resultCount = root.querySelector('[data-fmgi-result-count]');
    const activeSummary = root.querySelector('[data-fmgi-active-summary]');
    let activeRoute = null;
    let activeStyle = 'all';
    let activeFunction = 'all';
    let activeLevel = 'all';
    let lastAnalysisButton = null;
    let lastRouteButton = null;

    function applyFilters() {
      let visible = 0;
      const selectedLevel = activeLevel === 'all' ? Infinity : Number(activeLevel);
      cards.forEach((card) => {
        const routes = (card.dataset.fmgiRouteTags || 'geral').split(/\s+/);
        const funcs = (card.dataset.fmgiFunctions || '').split(/\s+/);
        const minLevel = Number(card.dataset.fmgiLevel || '1');
        const styleMatch = activeStyle === 'all' || routes.includes(activeStyle);
        const functionMatch = activeFunction === 'all' || funcs.includes(activeFunction);
        const levelMatch = minLevel <= selectedLevel;
        const show = styleMatch && functionMatch && levelMatch;
        card.hidden = !show;
        if (show) visible += 1;
      });
      filterButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.fmgiFilter === activeStyle));
      functionButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.fmgiFunctionFilter === activeFunction));
      levelButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.fmgiLevelFilter === activeLevel));
      if (empty) empty.hidden = visible !== 0;
      if (resultCount) resultCount.textContent = visible + (visible === 1 ? ' opção' : ' opções');
      if (activeSummary) {
        const styleNames = {all:'Todos os estilos',rajada:'Rajada',lamina:'Lâmina',tomo:'Tomo',corrente:'Corrente'};
        const functionNames = {all:'Todas as funções',dano:'Dano',controle:'Controle',defesa:'Defesa',utilidade:'Utilidade',exploracao:'Exploração',social:'Social'};
        const levelText = activeLevel === 'all' ? 'Todos os níveis' : 'Nível ' + activeLevel;
        activeSummary.textContent = levelText + ' · ' + (styleNames[activeStyle] || activeStyle) + (activeFunction === 'all' ? '' : ' · ' + (functionNames[activeFunction] || activeFunction));
      }
    }

    function setStyle(style) {
      activeStyle = style || 'all';
      applyFilters();
    }
    function setLevel(level) {
      activeLevel = level || 'all';
      applyFilters();
    }
    function setFunction(fn) {
      activeFunction = fn || 'all';
      applyFilters();
    }

    function positionRoutePopover(button) {
      if (!routeDetail || !button) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (vw <= 760) {
        routeDetail.style.left = '';
        routeDetail.style.top = '';
        routeDetail.style.setProperty('--arrow-x', '50%');
        return;
      }
      const rect = button.getBoundingClientRect();
      const index = Math.max(0, routeButtons.indexOf(button));
      const width = Math.min(760, vw - 32);
      const margin = 16;
      let left;
      if (index === 0) left = rect.left;
      else if (index === 1) left = rect.left - width * 0.28;
      else if (index === 2) left = rect.right - width * 0.72;
      else left = rect.right - width;
      left = Math.max(margin, Math.min(left, vw - width - margin));
      let top = rect.bottom + 16;
      const estimatedHeight = Math.min(470, vh - 32);
      if (top + estimatedHeight > vh - margin) top = Math.max(margin, rect.top - estimatedHeight - 16);
      const center = rect.left + rect.width / 2;
      const arrowX = Math.max(28, Math.min(center - left, width - 28));
      routeDetail.style.left = left + 'px';
      routeDetail.style.top = top + 'px';
      routeDetail.style.setProperty('--arrow-x', arrowX + 'px');
    }

    function closeRoutePopover(returnFocus = false) {
      if (!routePopover) return;
      routePopover.classList.remove('is-open');
      routePopover.setAttribute('aria-hidden', 'true');
      routeButtons.forEach((button) => button.classList.remove('is-route-active'));
      activeRoute = null;
      if (returnFocus && lastRouteButton) lastRouteButton.focus();
    }

    function chooseRoute(route, button) {
      if (!routePopover || !routeDetail) return;
      routeButtons.forEach((item) => item.classList.toggle('is-route-active', item === button));
      routePanels.forEach((panel) => panel.hidden = panel.dataset.fmgiRoutePanel !== route);
      activeRoute = route;
      lastRouteButton = button;
      routeDetail.setAttribute('aria-label', button.querySelector('strong')?.textContent || 'Detalhes da rota');
      routePopover.classList.add('is-open');
      routePopover.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => positionRoutePopover(button));
    }

    filterButtons.forEach((button) => button.addEventListener('click', () => setStyle(button.dataset.fmgiFilter || 'all')));
    functionButtons.forEach((button) => button.addEventListener('click', () => setFunction(button.dataset.fmgiFunctionFilter || 'all')));
    levelButtons.forEach((button) => button.addEventListener('click', () => setLevel(button.dataset.fmgiLevelFilter || 'all')));

    function closeAnalysis(returnFocus = false) {
      if (!analysisWrap) return;
      analysisWrap.classList.remove('is-open');
      analysisWrap.setAttribute('aria-hidden','true');
      if (returnFocus && lastAnalysisButton) lastAnalysisButton.focus();
    }
    function openAnalysis(id, button) {
      if (!analysisWrap) return;
      const d = analysisData[id];
      if (!d) return;
      const set = (sel, value) => { const el = analysisWrap.querySelector(sel); if (el) el.textContent = value || ''; };
      set('[data-fmgi-analysis-title]', d.pt);
      set('[data-fmgi-analysis-en]', d.en);
      set('[data-fmgi-analysis-level]', d.level);
      set('[data-fmgi-analysis-tier]', d.tier);
      set('[data-fmgi-analysis-tags]', d.tags);
      set('[data-fmgi-analysis-why]', d.why);
      set('[data-fmgi-analysis-when]', d.when);
      set('[data-fmgi-analysis-avoid]', d.avoid);
      set('[data-fmgi-analysis-synergy]', d.synergy);
      set('[data-fmgi-analysis-swap]', d.swap);
      lastAnalysisButton = button;
      analysisWrap.classList.add('is-open');
      analysisWrap.setAttribute('aria-hidden','false');
      analysisWrap.querySelector('.fmgi-analysis-close')?.focus();
    }
    analysisButtons.forEach((button) => button.addEventListener('click', () => openAnalysis(button.dataset.fmgiAnalysisOpen, button)));
    analysisClose.forEach((button) => button.addEventListener('click', () => closeAnalysis(button.classList.contains('fmgi-analysis-close'))));

    routeButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const route = button.dataset.fmgiRoute || 'rajada';
        if (routePopover?.classList.contains('is-open') && activeRoute === route) {
          closeRoutePopover(false);
          return;
        }
        chooseRoute(route, button);
      });
    });

    routeDismissers.forEach((dismiss) => dismiss.addEventListener('click', (event) => {
      event.preventDefault();
      closeRoutePopover(dismiss.classList.contains('fmgi-route-close'));
    }));

    routeDetail?.addEventListener('click', (event) => event.stopPropagation());

    root.querySelectorAll('[data-fmgi-jump-route]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const route = link.dataset.fmgiJumpRoute || 'all';
        closeRoutePopover(false);
        setStyle(route);
        setLevel('all');
        root.querySelector('#todas-invocacoes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && analysisWrap?.classList.contains('is-open')) { closeAnalysis(true); return; }
      if (event.key === 'Escape' && routePopover?.classList.contains('is-open')) closeRoutePopover(true);
    });
    window.addEventListener('resize', () => {
      if (routePopover?.classList.contains('is-open') && lastRouteButton) positionRoutePopover(lastRouteButton);
    });
    window.addEventListener('scroll', () => {
      if (routePopover?.classList.contains('is-open') && lastRouteButton) positionRoutePopover(lastRouteButton);
    }, { passive: true });

    applyFilters();
  }

  document.querySelectorAll('[data-fmgi-guide]').forEach(initGuide);
})();

(() => {
  'use strict';

  function initBlueprints(root) {
    if (!root || root.dataset.fmgiBlueprintReady === '1') return;
    root.dataset.fmgiBlueprintReady = '1';

    const styleButtons = Array.from(root.querySelectorAll('[data-fmgi-blueprint-style]'));
    const panels = Array.from(root.querySelectorAll('[data-fmgi-blueprint-panel]'));

    function activateStyle(style) {
      styleButtons.forEach((button) => {
        const active = button.dataset.fmgiBlueprintStyle === style;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.fmgiBlueprintPanel !== style;
      });
    }

    styleButtons.forEach((button) => {
      button.addEventListener('click', () => activateStyle(button.dataset.fmgiBlueprintStyle || 'rajada'));
    });

    panels.forEach((panel) => {
      const tabs = Array.from(panel.querySelectorAll('[data-fmgi-blueprint-tab]'));
      const tabPanels = Array.from(panel.querySelectorAll('[data-fmgi-blueprint-tabpanel]'));

      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          const key = tab.dataset.fmgiBlueprintTab || 'overview';
          tabs.forEach((candidate) => {
            const active = candidate === tab;
            candidate.classList.toggle('is-active', active);
            candidate.setAttribute('aria-selected', active ? 'true' : 'false');
          });
          tabPanels.forEach((content) => {
            content.hidden = content.dataset.fmgiBlueprintTabpanel !== key;
          });
        });
      });
    });
  }

  document.querySelectorAll('[data-fmgi-blueprints]').forEach(initBlueprints);
})();