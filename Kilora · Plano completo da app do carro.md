# Kilora · Plano completo da app do carro

Nov 3, 2026 · @Manu

Uma web app instalável que diz a quem tem carro quanto ele custa de verdade, por mês e por km, guarda tudo no telemóvel do próprio utilizador e ajuda a decidir: manter, trocar, comprar usado ou deixar o carro. Este documento é a especificação para construir no Cursor, por etapas e sem prazos.

## 1. Decisões já tomadas

Fechei estas escolhas para o plano não ficar em aberto. Se mudares alguma, o resto adapta-se.

| Tema | Decisão | Porquê |
| --- | --- | --- |
| Mercado inicial | Portugal, português de Portugal, euros | As regras locais (IUC, inspeção periódica, portagens) são o que distingue a app das genéricas |
| Formato | Web app instalável no telemóvel (PWA), sem lojas | Sem aprovação nem comissões de loja, publica-se quando quiseres |
| Dados | Ficam só no dispositivo, sem contas nem servidor na primeira versão | A privacidade é argumento de venda e não há nada caro para manter |
| Preço | Grátis para 1 carro, pagamento único para o resto | É uma app que se usa de vez em quando, uma subscrição vende mal |
| Nome | Kilora | Confirma domínio e marca no INPI e no EUIPO antes de gastares dinheiro |
| Pagamentos | Lemon Squeezy (trata do IVA como vendedor oficial) | Evita teres de gerir IVA europeu sozinho. Confirma condições e taxas no site deles |
| Ferramenta de construção | Cursor Pro com Next.js + TypeScript | Detalhes na secção 9 |

O que está fora da primeira versão: contas de utilizador, sincronização entre dispositivos, ligação ao banco, leitura automática de anúncios, aplicações nativas.

## 2. Para quem é e que problema resolve

A maioria dos condutores sabe a prestação e o que gasta em combustível, e esquece o resto: seguro, IUC, inspeção, manutenção, pneus e, sobretudo, a perda de valor do carro. O resultado é que ninguém sabe quanto o carro custa de verdade.

**Promessa da app:** em 2 minutos sabes quanto o teu carro te custa por mês e por km, e o que podes fazer para pagar menos.

**Quem vai usar**

- Quem já tem carro e nunca somou tudo.
- Quem vai comprar um usado ou trocar de carro e quer comparar com números.
- Quem vive numa cidade com transportes e se pergunta se compensa ter carro.

| Momento | Pergunta da pessoa | O que a app responde |
| --- | --- | --- |
| Já tenho carro | Quanto me custa isto de verdade? | Custo por mês, por km e por ano, com a divisão entre fixos e variáveis |
| Estou a gastar demais? | O consumo ou a manutenção subiram? | Gráficos e avisos com base nos registos |
| Vou comprar usado | Este anúncio compensa? | Custo total a 3 e 5 anos, alertas e checklist de visita |
| Vou trocar de carro | Elétrico ou gasóleo? Este ou aquele? | Comparação lado a lado com custo acumulado |
| Penso em abdicar do carro | Compensa ter carro? | Ponto de equilíbrio contra passe, táxi e aluguer |

**Concorrência, sem rodeios.** Já existem apps de registo de abastecimentos e despesas (por exemplo Fuelio e Drivvo), algumas gratuitas. A aposta não é ser mais um diário de abastecimentos. É mostrar o custo real e ajudar a decidir, com as regras portuguesas e sem pedir dados pessoais.

## 3. Princípios de produto

São as regras que decidem qualquer dúvida durante a construção. Quando o Cursor propuser algo que as quebre, recusa.

1. **Resultado antes de dados.** O primeiro número aparece em menos de 2 minutos, com 6 campos obrigatórios. O resto é opcional e tem valores iniciais.
2. **Honesto sobre estimativas.** Tudo o que é estimado diz "estimado", mostra de onde vem e pode ser editado.
3. **Privado por defeito.** Nada sai do dispositivo. Sem contas, sem matrícula, sem localização.
4. **Sem dados inventados.** Nada de preços de mercado simulados nem leitura automática de sites de anúncios. O utilizador escreve, a app calcula.
5. **O pagamento nunca bloqueia o essencial.** O cálculo do custo real e o registo de despesas de 1 carro são gratuitos. O paywall só aparece em momentos de valor.
6. **Uma mão, no telemóvel.** Tudo ao alcance do polegar. Registar uma despesa leva no máximo 3 toques e 10 segundos.
7. **Zero jargão.** Palavras como "custo por km", "fixos" e "variáveis". Nada de siglas sem explicação.
8. **Explicável.** Cada número tem um botão "como é calculado?" que mostra a fórmula e os valores usados.

## 4. Funcionalidades

A app tem 11 módulos. Os da versão 1 são o que tem de existir para lançar. Os restantes entram depois, quando houver utilizadores a pedir.

| # | Módulo | O que faz | Versão |
| --- | --- | --- | --- |
| F1 | Onboarding | Dá o primeiro custo real em 4 passos | 1 |
| F2 | Painel | Mostra custo por mês, por km e por ano, com divisão por categoria | 1 |
| F3 | Despesas | Regista qualquer gasto do carro em segundos | 1 |
| F4 | Abastecimentos e consumo | Calcula o consumo real e o custo por 100 km | 1 |
| F5 | Lembretes | Inspeção, IUC, seguro, revisão e pneus | 1 |
| F6 | Simulador "e se?" | Compara cenários e alternativas ao carro | 1 |
| F7 | Avaliador de usado | Custo total de um anúncio e checklist de visita | 1 |
| F8 | Relatórios, partilha e backup | PDF, CSV, cartão para partilhar e cópia de segurança | 1 |
| F9 | Garagem | Vários carros e balanço final de um carro vendido | 1 (pago) |
| F10 | Definições | Tema, unidades, licença, dados, ajuda | 1 |
| F11 | Calculadora pública | Versão sem registo para atrair visitas | 1 |
| F12 | Importar CSV e sincronizar | Importar extratos e sincronizar entre dispositivos | Depois |

### F1 · Onboarding

- Quatro passos com barra de progresso. Cada passo guarda sozinho, e a pessoa pode sair e voltar.
- Passo 1, o carro: marca e modelo (texto livre com sugestões), ano, combustível (gasolina, gasóleo, elétrico, híbrido, híbrido plug-in, GPL), quilómetros atuais.
- Passo 2, a compra: preço pago, data de compra, valor atual estimado (opcional, com ligação externa para ver anúncios semelhantes), financiamento (opcional: montante, taxa, número de prestações, início).
- Passo 3, custos fixos: seguro (anual ou mensal), IUC anual, data da última inspeção, estacionamento ou garagem por mês.
- Passo 4, uso: quilómetros por ano, consumo médio, preço médio do combustível ou da eletricidade, portagens por mês, manutenção média por ano.
- Campos obrigatórios: combustível, quilómetros por ano, preço pago (ou valor atual), seguro, consumo, preço da energia. O resto tem valor inicial marcado "estimado", exceto a manutenção e o preço dos pneus, que não têm valor inicial (ver secção 5, "Decisões de cálculo").
- Se o valor atual for maior que o preço pago, o passo 2 pergunta "Confirmas?" antes de guardar. Quase sempre é engano de escrita.
- Ecrã final: o número grande (€/mês e €/km), a divisão em fixos e variáveis, e a frase "Isto é uma estimativa. Regista despesas para afinar."
- **Feito quando:** alguém completa o onboarding só com os 6 campos obrigatórios, vê o resultado, fecha a app, volta, e o resultado continua lá.

### F2 · Painel

- Bloco principal: custo por mês, com alternância entre mês, ano e km. Por baixo, um selo "estimado" ou "baseado em N registos".
- Barra de fixos contra variáveis, e gráfico circular por categoria (depreciação, seguro, combustível, manutenção, impostos, outros).
- Comparação "este mês contra a média dos últimos 6".
- Até 3 cartões de dicas, geradas por regras fixas (ver F2.1). Nada de texto gerado por IA.
- Próximos lembretes (até 3) e botão "+" flutuante para registar.
- Estados: vazio (convida ao onboarding), só estimativas, com dados reais, carro vendido.
- Notas junto do número principal: "Não inclui manutenção. Adiciona-a para um custo mais real" quando a manutenção está em branco (o mesmo para os pneus), e "O teu carro valorizou" quando a depreciação é negativa.
- **F2.1 · Regras das dicas.** O seguro pesa mais de 30 % dos fixos: sugere comparar seguros. O consumo dos últimos 3 enchimentos subiu mais de 10 % contra a média: sugere verificar pressão dos pneus. Menos de 5 000 km por ano: mostra o custo por km e pergunta se compensa. Mais de 25 000 km por ano: avisa que a manutenção vai pesar mais.
- **Feito quando:** os números do painel batem certo com o exemplo da secção 5 e mudam de imediato quando se edita qualquer dado.

### F3 · Despesas

- Tipos: combustível ou carregamento, manutenção, reparação, pneus, seguro, IUC, inspeção, portagens, estacionamento, lavagem, multas, acessórios, outros.
- Campos: data (hoje por defeito), valor, tipo, quilómetros do conta-quilómetros (opcional, sugerido), notas, foto do recibo (opcional).
- Registo rápido em folha inferior: teclado numérico, tipos em botões, data já preenchida. Máximo de 3 toques.
- Despesas recorrentes (ex.: seguro pago ao mês) criam-se uma vez e geram entradas sozinhas.
- Lista agrupada por mês, com filtros por tipo e pesquisa em notas. Editar e apagar com "desfazer" durante 5 segundos.
- Fotos de recibos ficam no dispositivo, comprimidas. A app avisa quando o espaço ocupado passa de um limite.
- **Feito quando:** registar combustível a meio do dia leva menos de 10 segundos e o painel atualiza.

### F4 · Abastecimentos e consumo

- Campos: data, quilómetros, litros ou kWh, preço por unidade ou total (a app calcula o terceiro), "encheste o depósito?".
- Consumo real pelo método de depósito cheio a depósito cheio (fórmula na secção 5). Enchimentos parciais contam para o custo, mas não para o consumo.
- Gráfico de consumo ao longo do tempo, média dos últimos 3 enchimentos e custo por 100 km.
- Aviso de anomalia quando um valor se afasta mais de 40 % da média: "Confirmas este valor?".
- Elétricos: carregamento em casa e público com preços diferentes. Híbridos plug-in: ambos os tipos de energia.
- **Feito quando:** com os dois enchimentos do exemplo da secção 13 a app mostra 6,0 L/100 km.

### F5 · Lembretes

- Tipos: inspeção, IUC, renovação do seguro, revisão (por data e/ou quilómetros), pneus, personalizado.
- Estados: ok, em breve (30 dias ou 1 000 km), atrasado.
- A regra da inspeção por idade do carro e a regra do mês do IUC vêm de um ficheiro de regras editável, com a data da última verificação visível. Confirma sempre nas fontes oficiais (IMT e Portal das Finanças) antes de lançar.
- Avisos dentro da app, e exportação em ficheiro de calendário (.ics) para o telemóvel avisar sozinho. Notificações push ficam para depois.
- Ao marcar como feito, a app propõe registar a despesa correspondente.
- **Feito quando:** um lembrete de inspeção muda de "ok" para "em breve" quando a data entra na janela, sem a pessoa abrir nada.

### F6 · Simulador "e se?"

- Cenário 1, uso: e se fizer mais ou menos km por ano? Controlo deslizante com resultado em direto.
- Cenário 2, combustível: trocar gasolina, gasóleo e elétrico, com consumo e preço da energia.
- Cenário 3, outro carro: carro A contra carro B, lado a lado, a 5 anos, com custo acumulado em gráfico.
- Cenário 4, alternativas: carro contra passe mensal mais táxi ou aluguer ocasional. Mostra o ponto de equilíbrio em km por ano.
- Cenário 5, manter ou vender hoje: custo de manter mais 1, 2 e 3 anos contra o dinheiro que sairia da venda.
- Guardar cenários é premium. Ver e mexer nos controlos é gratuito.
- **Feito quando:** o cenário "menos 3 000 km por ano" mostra a poupança em euros por ano e a explicação da conta.

### F7 · Avaliador de usado

- Entrada manual (sem ligar a sites de anúncios): preço do anúncio, ano, quilómetros, combustível, consumo esperado, seguro estimado, IUC (se souber), estado dos pneus, data da próxima inspeção.
- Resultado: custo total a 3 e 5 anos, custo por mês e por km, e comparação com o carro atual (se existir).
- Semáforo com razões escritas: verde, amarelo ou vermelho para quilómetros por ano (abaixo de 5 000 ou acima de 25 000 chama a atenção), idade, inspeção iminente, custo por km acima do teu carro atual.
- Checklist de visita (para levar no telemóvel ou imprimir): histórico de revisões, número de donos, DUA e livro de revisões, correia de distribuição, pneus, travões, ruídos, fugas, eletrónica, teste de estrada.
- Nunca dá um veredito absoluto. Diz "o que pesa" e deixa a decisão à pessoa.
- **Feito quando:** dois anúncios podem ser comparados lado a lado e o PDF da checklist sai sem erros.

### F8 · Relatórios, partilha e backup

- PDF mensal e anual com resumo, gráficos e lista de despesas. CSV de todas as despesas.
- Cartão para partilhar: imagem 1080 por 1350 com "O meu carro custa-me X €/mês" e o logótipo. Sem matrícula, sem marca e modelo por defeito. Botão de partilha do sistema.
- Backup completo em ficheiro JSON (exportar e importar), com número de versão do formato.
- Apagar tudo, com confirmação em dois passos.
- **Feito quando:** exportar e importar o backup num dispositivo limpo devolve exatamente os mesmos números.

### F9 · Garagem

- Gratuito: 1 carro. Pago: carros ilimitados com seletor no topo.
- Carro vendido: data e preço de venda, congela o carro e mostra o balanço final (total gasto, custo por km durante a posse, custo por mês).

### F10 · Definições

- Tema (claro, escuro, automático), formato de números, unidades (km e litros), idioma (apenas português na v1, mas todos os textos em ficheiro de traduções).
- Licença, backup, privacidade, termos, versão das regras, contacto e sugestões.

### F11 · Calculadora pública

- Mesmos 6 campos do onboarding, sem registo, resultado imediato.
- No fim: "Guarda e acompanha na app" abre a app com os valores já preenchidos.
- É a página que traz visitas pelo Google (ver secção 11).

## 5. Regras de cálculo

Todo o cálculo vive num módulo próprio, em funções puras sem interface, com testes. É a parte que tem de estar certa. Os números abaixo servem de base para os testes automáticos.

### Custo total

O custo do carro divide-se em **fixos** (pagas mesmo que o carro esteja parado) e **variáveis** (dependem dos km).

```latex
C_{ano} = F_{ano} + V_{ano}
```

```latex
F_{ano} = D + S + I + K + J + O
```

```latex
V_{ano} = km_{ano} \times (c_{energia} + c_{manut} + c_{pneus}) + P_{ano}
```

```latex
c_{km} = \frac{C_{ano}}{km_{ano}} \qquad C_{mes} = \frac{C_{ano}}{12}
```

| Símbolo | Significado | Como se obtém |
| --- | --- | --- |
| D | Depreciação anual | (valor de compra menos valor atual) a dividir pelos anos de posse |
| S | Seguro anual | Introduzido pela pessoa ou somado dos registos |
| I | IUC anual | Introduzido ou somado dos registos |
| K | Inspeção anualizada | Preço da inspeção a dividir pelo intervalo em anos |
| J | Juros anuais do crédito | Total pago menos o capital, a dividir pelos anos do crédito |
| O | Outros fixos | Garagem, estacionamento fixo, assinaturas |
| P | Portagens e estacionamento variável por ano | Introduzido ou somado dos registos |
| c energia | Custo de energia por km | Consumo por 100 km a dividir por 100, vezes preço da energia |
| c manut | Manutenção por km | Reserva anual a dividir pelos km por ano |
| c pneus | Pneus por km | Preço do jogo a dividir pela vida útil em km |

**Regra importante: a prestação do crédito não é custo.** O capital já está contado na depreciação. Contar a prestação inteira seria contar duas vezes. Só entram os juros.

### Depreciação

```latex
D = \frac{V_{compra} - V_{atual}}{anos\ de\ posse}
```

- Para o passado usa-se a depreciação linear acima, porque só depende de dois valores que a pessoa conhece.
- Para projeções futuras (simulador e avaliador de usado) usa-se perda percentual composta por ano, calculada assim:

```latex
r = 1 - \left(\frac{V_{atual}}{V_{compra}}\right)^{1/anos}
```

- Se a pessoa não indicar o valor atual, usa-se 12 % ao ano como valor inicial sugerido, marcado "estimado" e editável.
- Custo de oportunidade (dinheiro parado no carro) é opcional e vem desligado. Quando ligado, soma capital imobilizado vezes uma taxa anual definida pela pessoa.

### Crédito

Prestação mensal para capital P, taxa mensal i e n prestações:

```latex
PMT = \frac{P \cdot i}{1 - (1+i)^{-n}}
```

Juros totais = PMT vezes n menos P. Dividem-se pelos anos do crédito para entrar em J.

No custo atual, J conta só os juros dos meses do crédito que caem nos últimos 12 meses. Um crédito já acabado dá 0, e um crédito com menos de 12 meses decorridos conta só esses meses.

### Consumo

Método de depósito cheio a depósito cheio:

```latex
L/100km = \frac{\sum litros \text{ entre dois enchimentos cheios (incl. parciais)}}{km_{atual} - km_{cheio\ anterior}} \times 100
```

- O primeiro enchimento cheio só serve de ponto de partida.
- Enchimentos parciais somam litros, mas não dão consumo sozinhos.
- Elétricos usam kWh por 100 km. Híbridos plug-in usam a percentagem de km em modo elétrico (valor inicial: pergunta à pessoa).

### Ponto de equilíbrio contra uma alternativa

Se o custo por km da alternativa é c alt e o custo variável do carro é c var, o carro compensa a partir de:

```latex
km^{*} = \frac{F_{ano}}{c_{alt} - c_{var}}
```

Se c alt for menor ou igual a c var, a alternativa é sempre mais barata e a app diz isso.

### Estimado ou real

- **Estimado:** usa só o que foi preenchido nas definições do carro.
- **Real:** usa as despesas registadas nos últimos 12 meses. Para cada categoria, se houver registos nesses 12 meses, usam-se os registos. Se não houver, usa-se a estimativa. Assim nada é contado duas vezes.
- O painel diz sempre qual dos dois está a mostrar e, no modo misto, que categorias ainda são estimadas.

### Decisões de cálculo

Decididas a 5 de novembro de 2026, depois da Etapa 1.

| Situação | Motor de cálculo | Ecrã |
| --- | --- | --- |
| Manutenção ou preço dos pneus em branco | Conta 0 € e indica que a categoria está em falta. Não há valor inicial, para não inventar um preço sem fonte | Nota junto do número: "Não inclui manutenção. Adiciona-a para um custo mais real" |
| Crédito já acabado ou a meio | Só os juros dos meses do crédito dentro dos últimos 12 meses. Crédito acabado dá 0. Implementar e testar na Etapa 3 | Nada de especial |
| Valor atual maior que o preço pago | A depreciação fica negativa, porque é a conta honesta | Nota "O teu carro valorizou". No onboarding pergunta "Confirmas?" |

### Valores iniciais (sempre editáveis, sempre marcados "estimado")

| Parâmetro | Valor inicial | Onde se muda |
| --- | --- | --- |
| Vida útil de um jogo de pneus | 40 000 km | Carro, custos |
| Depreciação sem valor atual | 12 % ao ano | Carro, compra |
| Custo de oportunidade | Desligado, taxa sugerida de 3 % | Definições |
| Limiar de anomalia no consumo | 40 % da média | Definições |
| Aviso de poucos km por ano | Menos de 5 000 | Ficheiro de regras |
| Aviso de muitos km por ano | Mais de 25 000 | Ficheiro de regras |

### Formato dos números

- Dinheiro guardado em cêntimos inteiros. Cálculos intermédios em decimais, arredondados só ao mostrar.
- Português de Portugal: vírgula decimal, espaço nos milhares, símbolo € depois do número.
- O campo de números aceita "1,85" e "1.85".
- Custo por km mostra 2 casas decimais, com 3 em detalhe.

### Exemplo para testes

Valores inventados só para validar as contas, não são preços reais.

| Dado | Valor |
| --- | --- |
| Compra há 2 anos | 12 000 € |
| Valor atual | 9 000 € |
| Seguro | 480 €/ano |
| IUC | 60 €/ano |
| Inspeção | 30 € de 2 em 2 anos |
| Km por ano | 12 000 |
| Consumo e preço | 6,0 L/100 km a 1,75 €/L |
| Manutenção | 400 €/ano |
| Pneus | 320 € por jogo, 40 000 km de vida |

| Resultado | Conta | Valor |
| --- | --- | --- |
| Depreciação | 3 000 a dividir por 2 anos | 1 500 €/ano |
| Inspeção anualizada | 30 a dividir por 2 | 15 €/ano |
| Fixos | 1 500 + 480 + 60 + 15 | 2 055 €/ano |
| Energia | 12 000 × 0,06 × 1,75 | 1 260 €/ano |
| Pneus | 12 000 × 320 / 40 000 | 96 €/ano |
| Variáveis | 1 260 + 400 + 96 | 1 756 €/ano |
| Total | 2 055 + 1 756 | 3 811 €/ano |
| Por mês | 3 811 a dividir por 12 | 317,58 € |
| Por km | 3 811 a dividir por 12 000 | 0,3176 € (mostra 0,32) |

## 6. Dados e privacidade

Tudo é guardado no próprio dispositivo, na base de dados do navegador (IndexedDB, através da biblioteca Dexie). Não há servidor, não há contas e não se pede matrícula.

### Modelo de dados

```ts
type Fuel = 'gasolina' | 'gasoleo' | 'eletrico' | 'hibrido' | 'hibrido_plugin' | 'gpl';

interface Vehicle {
  id: string;                 // uuid
  nickname: string;           // ex.: "O meu Golf"
  brand?: string;
  model?: string;
  year: number;
  fuel: Fuel;
  purchaseDate: string;       // yyyy-mm-dd
  purchasePriceCents: number;
  currentValueCents?: number; // estimado
  currentValueDate?: string;
  odometerAtPurchase?: number;
  kmPerYear: number;
  consumptionPer100: number;  // L ou kWh
  energyPriceCents: number;   // por L ou kWh
  insuranceYearCents: number;
  iucYearCents: number;
  iucMonth?: number;          // 1-12
  inspectionPriceCents?: number;
  lastInspectionDate?: string;
  parkingMonthCents?: number;
  tollsMonthCents?: number;
  maintenanceYearCents?: number;
  tyreSetCents?: number;
  tyreLifeKm?: number;        // 40000 por defeito
  financing?: { principalCents: number; annualRatePct: number; months: number; startDate: string };
  soldDate?: string;
  soldPriceCents?: number;
  createdAt: string;
}

type ExpenseType =
  | 'energia' | 'manutencao' | 'reparacao' | 'pneus' | 'seguro' | 'iuc'
  | 'inspecao' | 'portagens' | 'estacionamento' | 'lavagem' | 'multa'
  | 'acessorios' | 'outros';

interface Expense {
  id: string;
  vehicleId: string;
  date: string;               // yyyy-mm-dd
  type: ExpenseType;
  amountCents: number;
  odometer?: number;
  quantity?: number;          // litros ou kWh
  unitPriceCents?: number;
  fullTank?: boolean;
  chargeKind?: 'casa' | 'publico'; // elétricos
  note?: string;
  receiptId?: string;         // referência a um Blob guardado à parte
  recurringId?: string;
}

interface Reminder {
  id: string;
  vehicleId: string;
  kind: 'inspecao' | 'iuc' | 'seguro' | 'revisao' | 'pneus' | 'custom';
  dueDate?: string;
  dueOdometer?: number;
  doneAt?: string;
  title?: string;
}

interface Settings {
  theme: 'claro' | 'escuro' | 'auto';
  locale: 'pt-PT';
  opportunityCost: { enabled: boolean; ratePct: number };
  license?: { key: string; status: 'ativa' | 'invalida' | 'desconhecida'; lastCheck: string };
  rulesVersion: string;
  schemaVersion: number;
}
```

### Regras de armazenamento

- Dinheiro em cêntimos inteiros. Datas como texto ISO de dia (sem horas). Quilómetros como inteiros.
- Cada gravação valida os dados com um esquema (Zod). Dados inválidos nunca entram na base.
- Alterações ao modelo fazem-se com migrações numeradas. Nunca se apaga dados do utilizador numa migração.
- Fotos de recibos ficam numa tabela à parte, comprimidas, com limite de tamanho por foto.
- Decidido na Etapa 2:
  - Os preços por litro ou kWh (`energyPriceCents`, `unitPriceCents`) aceitam décimas de cêntimo, porque os combustíveis têm 3 casas decimais (1,759 €/L = 175,9 cêntimos). Os montantes pagos continuam em cêntimos inteiros.
  - As fotos guardam-se como bytes (`Uint8Array`) com o tipo de imagem, e não como `Blob`, porque os bytes funcionam melhor no Safari do iPhone e passam diretamente para o backup. O limite é de 1 MB por foto, depois de comprimida.
  - Um campo em branco fica ausente na base de dados e no backup, nunca guardado como 0. Um 0 escrito pela pessoa continua a ser 0.
  - Importar um backup é tudo ou nada: valida o ficheiro inteiro antes de gravar e grava numa só transação. Se já houver dados no dispositivo, a pessoa escolhe substituir tudo ou cancelar.
- O backup em JSON inclui o número de versão do esquema e as fotos opcionais.

### O que nunca se guarda nem se envia

Matrícula, nome, email (a não ser que a pessoa escreva para pedir ajuda), localização, identificadores de publicidade e conteúdo das despesas. A única comunicação com o exterior na v1 é o pagamento e a validação da licença.

### Texto de privacidade (para usar na app)

> Os teus dados ficam neste dispositivo. Não temos conta, não temos servidor e não vemos o que registas. Se limpares os dados do navegador ou mudares de telemóvel, só os recuperas com o ficheiro de backup que podes exportar nas definições.

## 7. Ecrãs e navegação

Barra de navegação inferior com 5 posições: **Início**, **Registos**, **+** (botão central, regista uma despesa), **Simular** e **Mais**. Em ecrãs largos, a barra passa a menu lateral.

| Rota | Ecrã | Objetivo | Estados a tratar |
| --- | --- | --- | --- |
| / | Página inicial pública | Explicar, mostrar a calculadora e levar à app | Primeira visita, instalada |
| /calcular | Calculadora pública | Dar um número sem registo | Campos inválidos, resultado |
| /app/boas-vindas | Onboarding (4 passos) | Primeiro custo real | Passo guardado, saltado, concluído |
| /app | Painel | Mostrar o custo e as dicas | Vazio, estimado, real, vendido |
| /app/registos | Lista de despesas | Ver, filtrar e editar | Vazio, com filtros sem resultados |
| /app/registos/novo | Folha de registo rápido | Registar em 3 toques | Offline, valor estranho, foto |
| /app/combustivel | Consumo e abastecimentos | Ver consumo real | Menos de 2 enchimentos cheios |
| /app/lembretes | Lembretes | Ver o que vem aí | Nenhum, atrasado, exportar .ics |
| /app/simular | Simulador "e se?" | Comparar cenários | Sem dados do carro, guardar (pago) |
| /app/usado | Avaliador de usado | Comparar anúncios | Dados em falta, resultado, PDF |
| /app/relatorios | Relatórios e partilha | Exportar PDF, CSV e cartão | Sem dados suficientes |
| /app/garagem | Garagem | Trocar de carro e ver vendidos | 1 carro (gratuito), vários (pago) |
| /app/definicoes | Definições | Tema, dados, licença, ajuda | Backup falhou, licença inválida |
| /app/pagar | Folha de upgrade | Mostrar o que o pagamento desbloqueia | Já pago, em validação |
| /privacidade e /termos | Páginas legais | Confiança | Texto fixo |

**Regra do paywall.** A folha de upgrade abre quando a pessoa toca numa função paga (exportar PDF, segundo carro, guardar cenário). Mostra exatamente o que desbloqueia. Fecha-se sem perder o que estava a fazer.

**Ecrã de erro e de offline.** A app funciona sem ligação. Só a validação da licença precisa de rede, e se falhar usa a última validação guardada.

### Como é cada ecrã principal

- **Painel.** Topo: seletor de carro e período. Centro: número grande (€/mês) com o selo "estimado" ou "baseado em N registos". Abaixo: barra fixos e variáveis, gráfico por categoria, comparação com a média, até 3 dicas e próximos lembretes. Botão "+" flutuante.
- **Registo rápido.** Folha que sobe de baixo. Linha 1: valor com teclado numérico grande. Linha 2: tipos como botões (combustível, manutenção, portagens, outros). Linha 3: data (hoje), quilómetros, nota. Botão "Guardar" fixo em baixo.
- **Simulador.** Dois painéis lado a lado em ecrãs largos e empilhados no telemóvel. Controlos deslizantes à esquerda ou em cima. Resultado grande e gráfico de custo acumulado por baixo. Botão "como é calculado?".
- **Avaliador de usado.** Três passos (anúncio, o teu uso, resultado). O resultado mostra o semáforo, as razões em frases curtas, o custo a 3 e 5 anos e o botão da checklist em PDF.

## 8. Design visual e tom de voz

**Direção:** limpa, calma e séria, como uma app de finanças pessoais bem feita, e não como uma app de carros. O número é o herói. Pouca cor, muito espaço, sem imagens de stock de carros.

### Cores

```css
:root {
  --bg: #F6F7F9;          --surface: #FFFFFF;     --surface-2: #EEF1F5;
  --ink: #0F172A;         --ink-muted: #64748B;   --border: #E2E8F0;
  --accent: #0E9F8E;      --accent-ink: #FFFFFF;  --accent-soft: #D9F3EF;
  --warn: #D97706;        --danger: #DC2626;      --ok: #16A34A;
}
[data-theme="dark"] {
  --bg: #0B0F14;          --surface: #121821;     --surface-2: #1A2230;
  --ink: #E6EAF0;         --ink-muted: #94A3B8;   --border: #243041;
  --accent: #2DD4BF;      --accent-ink: #05201C;  --accent-soft: #123530;
  --warn: #F59E0B;        --danger: #F87171;      --ok: #4ADE80;
}
```

- A cor de destaque (verde-azulado) usa-se só para ações principais, o número grande e o que está bom. Aviso a âmbar e perigo a vermelho só para o que pede atenção.
- Contraste mínimo de 4,5 para 1 em texto normal. Verifica os dois temas. Estes valores são ponto de partida e devem ser testados com uma ferramenta de contraste antes de fechar.
- Nunca usar só a cor para dizer "bom" ou "mau". Junta sempre ícone ou texto.

### Tipografia

| Uso | Fonte | Tamanho | Peso |
| --- | --- | --- | --- |
| Número grande do painel | Inter, algarismos tabulares | 48 a 56 px | 700 |
| Títulos de ecrã | Inter | 24 px | 600 |
| Texto | Inter | 16 px | 400 |
| Texto secundário | Inter | 14 px | 400 |
| Etiquetas e selos | Inter | 12 px | 500, maiúsculas pequenas |

- Inter carregada localmente pelo Next (sem pedidos a servidores de fontes externos).
- Todos os números de dinheiro com algarismos tabulares, para alinharem em colunas.

### Espaço e forma

- Escala de espaçamento em múltiplos de 4 px. Margem lateral de 16 px no telemóvel.
- Cartões com cantos de 16 px, botões com 12 px. Sem sombras pesadas: borda fina de 1 px e, no máximo, uma sombra suave.
- Alvos de toque de pelo menos 44 por 44 px. Botão principal sempre ao alcance do polegar.
- Largura máxima de conteúdo de 720 px em ecrãs grandes.

### Componentes principais

| Componente | Comportamento |
| --- | --- |
| Número grande | Anima de 0 até ao valor em 600 ms. Mostra selo "estimado" ou "baseado em N registos" |
| Barra de fixos e variáveis | Duas cores neutras, legenda por baixo, toque abre o detalhe |
| Gráfico por categoria | Anel simples, 6 categorias no máximo, restantes agrupadas em "outros" |
| Gráficos de linha | Uma linha principal, valores ao toque, sem grelha pesada. Biblioteca: Recharts |
| Folha inferior | Sobe de baixo, fecha com arrasto, mantém o teclado numérico |
| Cartão de dica | Ícone, frase curta, botão "ver porquê". Máximo de 3 visíveis |
| Selo de estado | Ok (verde), em breve (âmbar), atrasado (vermelho), sempre com texto |
| Botão "como é calculado?" | Abre painel com fórmula e valores usados |
| Estado vazio | Uma frase, um ícone simples e um botão. Nunca um ecrã em branco |

### Movimento

- Transições de 150 a 200 ms, curva suave de saída. Nada a saltar nem a abanar.
- Contagem do número principal e entrada dos gráficos só na primeira vez que o ecrã aparece.
- Se o sistema pedir menos movimento, desligar todas as animações.

### Ícones e imagens

- Ícones Lucide, traço de 1,75 px, um único estilo.
- Sem fotografias. O logótipo é um monograma simples (um K numa forma circular) a criar na etapa 0.
- O cartão para partilhar tem fundo de cor lisa, o número enorme e a frase, e nada mais.

### Acessibilidade

- Navegação completa por teclado e leitor de ecrã. Gráficos com alternativa em texto (tabela escondida).
- Etiquetas em todos os campos, mensagens de erro claras junto do campo, foco visível.
- Teclado numérico nos campos de números e de dinheiro.
- Texto com tamanho que respeita a definição do sistema.

### Tom e textos

- Português de Portugal, tratamento por "tu", frases curtas, sem jargão financeiro nem siglas por explicar.
- Direto e calmo. Sem exclamações, sem emojis, sem culpa ("gastaste demais" nunca).
- Estimativas dizem "estimado". Avisos dizem o que fazer a seguir.

| Situação | Texto |
| --- | --- |
| Título da página inicial | Quanto te custa o teu carro, de verdade? |
| Subtítulo | Descobre o custo por mês e por km em 2 minutos. Fica tudo no teu telemóvel |
| Botão principal | Calcular o meu custo |
| Estado vazio das despesas | Ainda não registaste nada. Regista o próximo abastecimento em 10 segundos |
| Valor estranho | Este valor está muito acima do habitual. Confirmas? |
| Estimativa | Estimado a partir do que preencheste. Regista despesas para afinar |
| Erro de rede | Sem ligação. Os teus dados estão guardados e a app continua a funcionar |
| Paywall | Desbloqueia relatórios em PDF, vários carros e cenários guardados. Pagamento único |
| Apagar tudo | Isto apaga todos os dados deste dispositivo e não se pode desfazer. Exportaste o backup? |

## 9. Stack técnica e estrutura do projeto

Tudo corre no navegador. O site é gerado como ficheiros estáticos, por isso é barato de alojar e rápido.

| Parte | Escolha | Porquê |
| --- | --- | --- |
| Framework | Next.js (App Router) com exportação estática | Páginas públicas boas para o Google e a app no mesmo projeto |
| Linguagem | TypeScript em modo estrito | O Cursor erra menos com tipos |
| Estilo | Tailwind CSS com variáveis de cor do design | Rápido e consistente |
| Componentes | shadcn/ui (base Radix) | Acessíveis e personalizáveis |
| Base de dados local | Dexie (IndexedDB) | Simples, rápida, com migrações |
| Validação | Zod | Dados sempre válidos |
| Gráficos | Recharts | Suficiente e leve |
| Datas | date-fns | Pequeno e fiável |
| PDF | @react-pdf/renderer | PDF no próprio navegador |
| PWA | Serwist (service worker) | Instalável e funciona offline |
| Testes | Vitest para o motor de cálculo, Playwright para fluxos principais | O cálculo tem de estar certo |
| Pagamentos | Lemon Squeezy com chave de licença | Trata do IVA, sem servidor teu |
| Alojamento | Cloudflare Pages (plano gratuito) | Permite uso comercial |
| Estatísticas | Cloudflare Web Analytics ou Plausible | Sem cookies nem dados pessoais |

**Notas importantes**

- O plano gratuito da Vercel é para uso não comercial. Como vais vender, escolhe Cloudflare Pages ou confirma outra opção. Verifica as condições atuais antes de decidir.
- A validação da licença chama a interface de licenças do Lemon Squeezy a partir do navegador. Confirma na documentação deles que o pedido não exige chave secreta. Se exigir, cria uma função serverless mínima só para isso.
- No iOS, os dados de sites não instalados podem ser apagados pelo Safari após semanas sem uso. Por isso a app pede para ser instalada no ecrã inicial, pede armazenamento persistente (`navigator.storage.persist()`) e lembra a pessoa de exportar o backup.

### Estrutura de pastas

```text
kilora/
  app/
    (public)/            # página inicial, /calcular, /privacidade, /termos
    app/                 # tudo o que está em /app (painel, registos, simular...)
  src/
    engine/              # motor de cálculo: funções puras + testes
      cost.ts            # custo total, fixos, variáveis
      depreciation.ts
      credit.ts
      consumption.ts
      breakeven.ts
      scenarios.ts
      used-car.ts        # avaliador de usado
      tips.ts            # regras das dicas
      rules.ts           # ficheiro de regras (inspeção, IUC) com data de verificação
      *.test.ts
    db/                  # Dexie, esquemas Zod, migrações, backup
    components/          # interface reutilizável
    features/            # onboarding, dashboard, expenses, reminders, ...
    lib/                 # formatação pt-PT, datas, licença
    i18n/pt-PT.json      # todos os textos
  public/                # ícones, manifest
  .cursor/rules/         # regras para o Cursor
```

### Regras para o Cursor (colar em `.cursor/rules`)

```text
Projeto: Kilora, web app PWA em português de Portugal que calcula o custo real de um carro.
Stack: Next.js (App Router, exportação estática), TypeScript estrito, Tailwind, shadcn/ui, Dexie, Zod, Recharts, date-fns, Vitest.
Regras:
- Toda a lógica de cálculo fica em src/engine como funções puras, sem React nem acesso à base de dados. Cada função tem testes.
- Dinheiro em cêntimos inteiros. Datas como yyyy-mm-dd. Formatação pt-PT (vírgula decimal, € depois do número).
- Todos os textos vêm de src/i18n/pt-PT.json. Nunca escrever texto fixo nos componentes.
- Nenhum dado do utilizador sai do dispositivo. Não adicionar analytics que identifiquem pessoas, nem chamadas a servidores além da validação de licença.
- Mobile primeiro. Alvos de toque de 44 px. Respeitar prefers-reduced-motion.
- Acessibilidade: etiquetas, foco visível, contraste. Gráficos com alternativa em texto.
- Antes de alterar o motor de cálculo, atualizar os testes com o exemplo da especificação.
- Não adicionar dependências sem justificar. Preferir o que já está no projeto.
- Não inventar dados de mercado, preços ou regras legais. Regras ficam em src/engine/rules.ts com data de verificação.
```

## 10. Monetização

Modelo: gratuito para uso essencial, pagamento único para desbloquear tudo. Preço de partida sugerido: **14,99 €**, para testares entre 9,99 € e 19,99 € quando houver visitas.

| Função | Gratuito | Pago |
| --- | --- | --- |
| Calculadora pública | Sim | Sim |
| Onboarding e painel de 1 carro | Sim | Sim |
| Registo de despesas e consumo | Últimos 3 meses de histórico | Histórico completo |
| Lembretes dentro da app | Sim | Sim |
| Exportar lembretes para o calendário (.ics) | Não | Sim |
| Simulador | Ver e mexer nos controlos | Guardar e comparar cenários |
| Avaliador de usado | 1 avaliação de cada vez | Guardar e comparar vários anúncios |
| Relatórios em PDF e CSV | Não | Sim |
| Cartão para partilhar | Sim, com o nome da app | Sim, sem o nome da app |
| Backup em JSON | Sim | Sim |
| Vários carros e carros vendidos | Não | Sim |

O backup é gratuito de propósito: não prendas os dados de ninguém. Quem paga, paga por conveniência e por mais funções.

### Quando aparece o pagamento

- Só quando a pessoa toca numa função paga. Nunca ao abrir a app, nunca a meio do onboarding.
- A folha de upgrade mostra o preço, o que desbloqueia e a frase "Pagamento único, sem subscrição".
- Fecha-se com um toque e a pessoa volta ao que estava a fazer.

### Como funciona a licença

1. A pessoa paga num ecrã seguro do Lemon Squeezy (aberto sobre a app).
2. Recebe por email uma chave de licença.
3. Cola a chave nas definições. A app valida-a com o serviço de licenças e guarda o resultado no dispositivo.
4. Se não houver rede, a app confia na última validação positiva. Nunca bloqueia dados já existentes.
5. Uma chave pode ser ativada em um número limitado de dispositivos (define o limite no painel do Lemon Squeezy).

### Outras fontes de receita (só depois de haver utilizadores)

- Afiliados de comparadores de seguros ou de pneus, sempre assinalados como publicidade e nunca em ecrãs com dados pessoais.
- Pacote de regras para outros países como complemento pago.
- Versão com sincronização entre dispositivos, se houver pedidos reais.

### Contas de cabeça (hipótese, não promessa)

Se 1 000 pessoas usarem a versão gratuita e 3 % pagarem, são 30 vendas. A 14,99 € dá cerca de 450 €, antes da comissão do Lemon Squeezy (confirma o valor no site deles; costuma rondar uma percentagem mais um valor fixo por venda) e dos impostos. Os números reais só existem depois de lançares. Mede e ajusta o preço com isso.

### O que medir (sem identificar ninguém)

| Métrica | Pergunta que responde |
| --- | --- |
| Onboardings concluídos a dividir pelos iniciados | O primeiro minuto funciona? |
| Pessoas que registam a primeira despesa | A app prende depois do número? |
| Cartões de partilha gerados | Há efeito de boca a boca? |
| Aberturas da folha de upgrade | Que função faz querer pagar? |
| Pagamentos a dividir pelas aberturas | O preço e a mensagem estão certos? |
| Pedidos de reembolso | Há promessa que não cumprimos? |

Para isto usa contadores de eventos anónimos, sem cookies e sem identificador de pessoa.

## 11. Lançamento e aquisição

O problema da maioria das apps pequenas não é construir, é ninguém saber que existem. Esta secção diz como as pessoas te encontram.

### Três canais que não custam dinheiro

1. **Pesquisa no Google.** A calculadora pública e algumas páginas de conteúdo respondem a perguntas que as pessoas já fazem: quanto custa ter um carro por mês, custo por km, vale a pena ter carro na cidade, elétrico ou gasóleo, que custos tem um carro usado. Cada página termina na calculadora.
2. **Conteúdo curto em vídeo.** Formato "descobri quanto custa de verdade o meu carro", com o número a aparecer no ecrã. O cartão para partilhar da app já é um bom final de vídeo.
3. **Boca a boca.** O cartão para partilhar ( "O meu carro custa-me X €/mês") é feito para ser publicado em histórias e grupos de amigos.

### Páginas de conteúdo a criar (uma a uma, curtas e úteis)

| Página | Pergunta que responde | Leva a |
| --- | --- | --- |
| Quanto custa ter um carro por mês em Portugal | Conta completa explicada | Calculadora |
| Custo por km: como se calcula | Fórmula e exemplo | Calculadora |
| Elétrico ou gasóleo: qual compensa? | Comparação com os teus números | Simulador |
| Vale a pena ter carro em Lisboa ou no Porto? | Carro contra passe e alternativas | Simulador |
| Checklist para visitar um carro usado | Lista para imprimir | Avaliador de usado |
| IUC, inspeção e seguro: o que tens de pagar | Guia sem jargão, com ligações oficiais | Lembretes |

Cada página tem uma data de atualização visível e liga às fontes oficiais.

### Pessoas de confiança antes do lançamento

- Escolhe 10 a 15 pessoas que tenham carro e peça-lhes para fazer o onboarding à tua frente, sem ajuda. Onde hesitarem, o texto ou o ecrã está mal.
- Pergunta a cada uma: o número pareceu-te certo? Partilharias o cartão? Pagarias por alguma função?
- Corrige, e só depois publica.

### Regras de conduta

- Em grupos e fóruns, responde a perguntas reais com utilidade e só depois menciona a app, respeitando as regras de cada grupo.
- Não inventes testemunhos, avaliações nem números de utilizadores. Mostra apenas o que existe.
- Diz sempre que o valor é uma estimativa.

## 12. Legal e confiança

Não sou advogado nem contabilista. Esta lista diz o que verificar antes de cobrar dinheiro. Confirma cada ponto com as fontes oficiais ou com um profissional.

| Tema | O que fazer |
| --- | --- |
| Atividade e impostos | Para receber vendas em Portugal, em regra precisas de atividade aberta nas Finanças. Confirma com as Finanças ou um contabilista e vê se o teu contrato de trabalho tem cláusula de exclusividade |
| IVA | Com um vendedor oficial como o Lemon Squeezy, o IVA ao consumidor é tratado por eles. Continuas a ter de declarar o que recebes. Confirma como se aplica ao teu caso |
| Reembolsos | Define e escreve uma política clara de reembolso, tendo em conta os direitos do consumidor em compras digitais na União Europeia |
| Privacidade (RGPD) | Sem contas nem recolha de dados pessoais o risco é baixo, mas escreve uma política de privacidade clara. Se recebes emails de suporte, diz o que fazes com eles |
| Cookies | Sem cookies e sem estatísticas que identifiquem pessoas, não precisas de faixa de cookies. Revê se mudares de ferramenta |
| Termos de utilização | Aviso de que os valores são estimativas, não aconselhamento financeiro, jurídico ou mecânico, e que a pessoa deve confirmar regras e preços nas fontes oficiais |
| Regras locais (IUC, inspeção) | Guarda-as em src/engine/rules.ts com data de verificação e ligação à fonte oficial. Mostra a data na app. Atualiza quando a lei mudar |
| Nome e logótipo | Pesquisa o nome nas bases de marcas (INPI e EUIPO) e em motores de busca. Não uses marcas de carros no logótipo |
| Dados de terceiros | Não leias nem copies anúncios de sites de venda. O utilizador escreve os valores. Evita problemas com os termos desses sites |
| Dados de mercado | Não afirmes preços médios de carros ou de seguros se não tiveres fonte. Se um dia usares dados públicos, cita a fonte e a data |

### Confiança na própria app

- Página "Como calculamos" com todas as fórmulas, e botão "como é calculado?" em cada número.
- Data da última verificação das regras visível nas definições.
- Aviso claro quando um valor é estimado, sem letras pequenas.
- Contacto de suporte real e visível.
- Apagar tudo funciona de verdade e confirma o que foi apagado.

## 13. Qualidade e testes

Uma app de dinheiro com contas erradas perde a confiança de imediato. Por isso o motor de cálculo tem testes antes de qualquer interface.

### Testes automáticos

- **Motor de cálculo (Vitest):** cada função com casos normais e extremos. O exemplo da secção 5 (317,58 €/mês e 0,3176 €/km) é um teste obrigatório.
- **Consumo:** enchimento cheio aos 10 000 km e enchimento cheio aos 10 500 km com 30 L dá 6,0 L/100 km. Um parcial entre os dois soma litros e muda o resultado.
- **Crédito:** prestação e juros totais conferidos com uma calculadora externa e com um caso de taxa zero.
- **Dados (Vitest):** exportar e importar o backup devolve exatamente os mesmos dados. Migração de um esquema antigo mantém tudo.
- **Fluxos (Playwright):** onboarding até ao resultado, registar uma despesa, criar um lembrete, abrir o simulador, avaliar um usado, exportar PDF.

### Casos extremos que têm de estar tratados

| Situação | Comportamento esperado |
| --- | --- |
| Quilómetros menores que os do registo anterior | Recusa com mensagem a explicar |
| Sem nenhum enchimento cheio | Mostra custo, não mostra consumo, explica porquê |
| Primeiro enchimento cheio | Serve só de ponto de partida |
| Carro com menos de 1 mês de posse | Depreciação sem dividir por zero, marcada "estimado" |
| Valor atual maior que o preço pago | Depreciação negativa, nota "O teu carro valorizou", "Confirmas?" no onboarding |
| Manutenção ou pneus em branco | Contam 0 € com a nota "Não inclui manutenção" junto do número |
| Crédito já acabado | Juros contam 0 no custo atual |
| Quilómetros por ano iguais a zero | Mostra só €/mês, sem €/km |
| Valor zero ou negativo | Recusa |
| Data no futuro | Só aceite em lembretes |
| Elétrico sem kWh nem preço | Pede os campos em falta |
| Backup de uma versão mais recente que a app | Recusa e pede para atualizar a app |
| Armazenamento quase cheio | Aviso com atalho para apagar fotos de recibos |
| Número escrito com vírgula ou ponto | Aceita os dois |
| Fuso horário | Datas por dia, sem horas, para evitar saltos de dia |

### Critérios de qualidade antes de lançar

- Lighthouse acima de 90 em desempenho, acessibilidade e boas práticas na página inicial e no painel.
- Primeiro carregamento rápido em telemóvel com rede lenta. Define um orçamento de peso e não o ultrapasses sem motivo.
- Funciona offline depois do primeiro carregamento.
- Testado em Chrome para Android, Safari no iPhone e um computador. O iPhone é onde mais coisas falham em PWA.
- Contraste e leitor de ecrã verificados nos dois temas.
- Testado com 10 a 15 pessoas reais que nunca viram a app.

### Definição de "feito" para cada funcionalidade

1. Faz o que a secção 4 diz, incluindo estados vazios e de erro.
2. Tem testes onde há cálculo ou dados.
3. Textos no ficheiro de traduções, sem texto fixo nos componentes.
4. Funciona com teclado e em telemóvel pequeno.
5. Não aumenta o que sai do dispositivo.

## 14. Riscos e o que pode correr mal

Para não te enganares: construir isto é a parte fácil. Os riscos reais estão fora do código.

| Risco | Porque importa | O que fazer |
| --- | --- | --- |
| Ninguém descobre a app | Sem tráfego não há vendas, por melhor que seja | Calculadora pública e páginas de conteúdo desde o início, testes com pessoas reais |
| Uso pouco frequente | Quem calcula uma vez pode não voltar | Pagamento único em vez de subscrição, lembretes úteis e cartão para partilhar |
| Concorrência gratuita | Apps de registo de abastecimentos já existem | Não competir como diário. Competir no custo real, nas regras portuguesas e na decisão de compra |
| Números errados | Uma conta errada destrói a confiança | Motor com testes, exemplo de referência, botão "como é calculado?" |
| Valores iniciais fracos | Estimativas más dão resultados enganadores | Marcar tudo como "estimado" e deixar editar. Não afirmar preços de mercado sem fonte |
| Regras que mudam (IUC, inspeção) | Informação desatualizada | Ficheiro de regras com data de verificação, e verificação periódica |
| Dados perdidos no iPhone | O Safari pode apagar dados de sites não instalados | Pedir instalação, armazenamento persistente e backup lembrado |
| Notificações limitadas em PWA | Lembretes menos fiáveis que numa app nativa | Exportar para o calendário (.ics) em vez de depender de push |
| Licenças partilhadas | Uma chave usada por muita gente | Limite de dispositivos por chave. Não vale a pena perseguir quem partilha |
| Burocracia de cobrar | Atividade nas Finanças, IVA e contrato de trabalho | Tratar antes da primeira venda, secção 12 |
| Expectativas de dinheiro | Pode demorar meses a render ou não render | Ver como experiência de baixo custo, e não como salário |

### O que está deliberadamente fora

Sincronização entre dispositivos, contas, ligação ao banco, leitura automática de anúncios, aplicações nativas, versão em outros países. Cada uma é um projeto próprio e só se justifica se houver utilizadores a pedir.

### Sinal de que deves mudar de ideia

Se 10 a 15 pessoas fizeram o teste e quase nenhuma partilharia o cartão nem pagaria por nenhuma função, o problema não é o design. É a proposta. Nesse caso, pára, volta à secção 2 e testa outro ângulo antes de gastares mais tempo.

## 15. Plano corrente por etapas

Sem datas. Tu defines o ritmo. A regra é simples: só passas à etapa seguinte quando o "feito quando" for verdadeiro. Se uma etapa bloquear, parte-a em duas em vez de saltar.

O Cursor Pro dura um mês, por isso gasta-o nas etapas 1 a 9, que são as que têm mais código. As etapas 10 a 12 têm menos código e boa parte faz-se sem ele.

| Etapa | Objetivo | Feito quando |
| --- | --- | --- |
| 0 | Preparação | Projeto criado, regras do Cursor colocadas, cores e fontes definidas, nome escolhido (Kilora) |
| 1 | Motor de cálculo | O exemplo da secção 5 passa nos testes (317,58 €/mês, 0,3176 €/km) |
| 2 | Base de dados local | Guardar, ler, migrar e exportar/importar backup sem perder nada |
| 3 | Onboarding e painel | Alguém completa o onboarding só com 6 campos e vê o painel certo, mesmo depois de fechar a app |
| 4 | Despesas e abastecimentos | Registar combustível em menos de 10 segundos e ver 6,0 L/100 km no exemplo |
| 5 | Lembretes | Um lembrete de inspeção muda de estado sozinho e exporta para o calendário |
| 6 | Simulador | "Menos 3 000 km por ano" mostra a poupança e a explicação |
| 7 | Avaliador de usado | Dois anúncios comparados lado a lado e checklist em PDF |
| 8 | Relatórios, partilha e garagem | PDF anual, CSV, cartão para partilhar e segundo carro a funcionar |
| 9 | PWA e polimento | Instala-se no telemóvel, funciona offline, Lighthouse acima de 90, teclado e leitor de ecrã verificados |
| 10 | Página inicial, calculadora pública e conteúdo | Qualquer pessoa chega a um número sem se registar e pode abrir a app com esses dados |
| 11 | Pagamentos e licença | Pagar, receber a chave, ativar, e as funções pagas desbloqueiam, com e sem rede |
| 12 | Teste com pessoas e lançamento | 10 a 15 pessoas fizeram o onboarding sozinhas, o que falhou foi corrigido, a app está publicada |
| 13 | Depois do lançamento | Mediste os eventos principais e escolheste o que construir a seguir com base em dados |

### Listas para ir assinalando

**Etapa 0 · Preparação**

- [ ] Criar o repositório e o projeto Next.js com TypeScript
- [ ] Instalar as dependências da secção 9
- [ ] Colocar as regras do Cursor em .cursor/rules
- [ ] Definir as variáveis de cor e a fonte
- [ ] Confirmar o domínio e registar a marca (nome escolhido: Kilora)
- [ ] Desenhar o monograma

**Etapa 1 · Motor de cálculo**

- [ ] Custo total, fixos e variáveis
- [ ] Depreciação linear e composta
- [ ] Crédito (prestação e juros)
- [ ] Consumo depósito cheio a depósito cheio
- [ ] Ponto de equilíbrio
- [ ] Regras das dicas
- [ ] Todos os testes da secção 13

**Etapa 2 · Base de dados local**

- [ ] Esquemas Zod e tipos
- [ ] Tabelas Dexie e migrações
- [ ] Backup em JSON (exportar e importar)
- [ ] Dados de demonstração para desenvolver
- [ ] Armazenamento persistente pedido

**Etapa 3 · Onboarding e painel**

- [ ] Os 4 passos com guardar automático
- [ ] Ecrã de resultado
- [ ] Painel com número grande, barra, gráfico e dicas
- [ ] Estados vazio, estimado e real
- [ ] Botão "como é calculado?"
- [ ] Juros só dos meses do crédito nos últimos 12 meses, com teste para crédito já acabado
- [ ] Notas "Não inclui manutenção" e "O teu carro valorizou", e "Confirmas?" no onboarding

**Etapa 4 · Despesas e abastecimentos**

- [ ] Folha de registo rápido
- [ ] Lista com filtros e pesquisa
- [ ] Editar, apagar e desfazer
- [ ] Consumo e gráfico
- [ ] Aviso de anomalia
- [ ] Despesas recorrentes
- [ ] Foto de recibo

**Etapa 5 · Lembretes**

- [ ] Ficheiro de regras com data de verificação
- [ ] Lembretes de inspeção, IUC, seguro, revisão e pneus
- [ ] Estados ok, em breve e atrasado
- [ ] Exportar .ics

**Etapa 6 · Simulador**

- [ ] Cenários de uso e de combustível
- [ ] Carro A contra carro B
- [ ] Carro contra alternativas, com ponto de equilíbrio
- [ ] Manter ou vender hoje
- [ ] Guardar cenários (pago)

**Etapa 7 · Avaliador de usado**

- [ ] Formulário em 3 passos
- [ ] Custo a 3 e 5 anos
- [ ] Semáforo com razões
- [ ] Comparação lado a lado
- [ ] Checklist em PDF

**Etapa 8 · Relatórios, partilha e garagem**

- [ ] PDF mensal e anual
- [ ] CSV
- [ ] Cartão para partilhar
- [ ] Vários carros e carro vendido com balanço final

**Etapa 9 · PWA e polimento**

- [ ] Manifesto e service worker
- [ ] Offline
- [ ] Tema claro e escuro
- [ ] Acessibilidade e contraste
- [ ] Desempenho
- [ ] Teste em iPhone e Android

**Etapa 10 · Página inicial e conteúdo**

- [ ] Página inicial
- [ ] Calculadora pública
- [ ] Pelo menos 2 páginas de conteúdo
- [ ] Privacidade e termos
- [ ] Estatísticas sem cookies

**Etapa 11 · Pagamentos e licença**

- [ ] Produto e preço no Lemon Squeezy
- [ ] Folha de upgrade
- [ ] Validação da chave
- [ ] Funções pagas desbloqueiam
- [ ] Política de reembolso

**Etapa 12 · Teste e lançamento**

- [ ] 10 a 15 pessoas a fazer o onboarding sozinhas
- [ ] Correções
- [ ] Atividade nas Finanças e faturação resolvidas
- [ ] Publicar
- [ ] Primeiro conteúdo de lançamento

## 16. Prompts para o Cursor

**Como usar:** exporta este documento em Markdown e guarda-o no projeto como `docs/especificacao.md`. Em cada prompt, o Cursor lê essa especificação com `@docs/especificacao.md`. Faz um prompt de cada vez, corre os testes e faz commit antes do seguinte. Se o Cursor se afastar da especificação, diz-lhe qual secção está a falhar.

**Etapa 0 · Preparação**

```text
Lê @docs/especificacao.md, secções 8 e 9.
Cria um projeto Next.js (App Router, TypeScript estrito, exportação estática) com Tailwind e shadcn/ui.
Instala: dexie, zod, recharts, date-fns, @react-pdf/renderer, serwist e vitest.
Configura as variáveis de cor claro e escuro da secção 8 como tokens do Tailwind, a fonte Inter carregada localmente e o tema automático.
Cria a estrutura de pastas da secção 9 (vazia, com README curto em cada pasta).
Cria src/i18n/pt-PT.json e uma função t() para ler textos.
Não cries ecrãs ainda. No fim, diz-me como correr o projeto e os testes.
```

**Etapa 1 · Motor de cálculo**

```text
Lê @docs/especificacao.md, secção 5.
Implementa em src/engine funções puras e tipadas: cost.ts, depreciation.ts, credit.ts, consumption.ts, breakeven.ts.
Usa dinheiro em cêntimos inteiros. Sem React, sem acesso a base de dados.
Escreve testes Vitest para cada função, incluindo OBRIGATORIAMENTE o exemplo de teste da secção 5 (317,58 €/mês e 0,3176 €/km) e o exemplo de consumo da secção 13.
Casos extremos: km por ano zero, carro com menos de 1 mês, taxa de crédito zero, consumo sem enchimento cheio.
Não avances para outra tarefa até todos os testes passarem.
```

**Etapa 2 · Base de dados local**

```text
Lê @docs/especificacao.md, secção 6.
Implementa src/db com Dexie: tabelas vehicles, expenses, reminders, settings, receipts.
Cria esquemas Zod para cada entidade, com os tipos da secção 6, e valida em cada gravação.
Implementa migrações numeradas (começa na versão 1).
Implementa exportBackup() e importBackup() em JSON com schemaVersion. Recusa backups de versão mais recente.
Pede armazenamento persistente com navigator.storage.persist().
Cria um script que preenche dados de demonstração para desenvolvimento.
Escreve testes: exportar e importar devolve exatamente os mesmos dados.
```

**Etapa 3 · Onboarding e painel**

```text
Lê @docs/especificacao.md, secções 4 (F1 e F2), 7 e 8.
Implementa o onboarding em 4 passos em /app/boas-vindas, com guardar automático em cada passo, barra de progresso e só os 6 campos obrigatórios.
Implementa o ecrã de resultado e o painel em /app, usando src/engine para todos os números.
Inclui: número grande com selo "estimado" ou "baseado em N registos", barra de fixos e variáveis, gráfico por categoria (Recharts), até 3 dicas pelas regras de F2.1, estados vazio, estimado, real e vendido.
Cada número tem o botão "como é calculado?" com a fórmula e os valores usados.
Todos os textos em src/i18n/pt-PT.json. Mobile primeiro.
```

**Etapa 4 · Despesas e abastecimentos**

```text
Lê @docs/especificacao.md, secções 4 (F3 e F4) e 5.
Implementa a folha de registo rápido (teclado numérico, tipos em botões, data de hoje, quilómetros opcionais), a lista agrupada por mês com filtros e pesquisa, editar e apagar com desfazer durante 5 segundos.
Implementa abastecimentos com o cálculo de consumo pelo método de depósito cheio a depósito cheio, gráfico de consumo, média dos últimos 3 enchimentos e aviso de anomalia acima de 40 % da média.
Suporta elétricos (kWh, casa e público) e híbridos plug-in.
Implementa despesas recorrentes e foto de recibo comprimida guardada à parte.
O painel tem de passar a usar os registos reais com a regra "por categoria, registos ou estimativa" da secção 5.
```

**Etapa 5 · Lembretes**

```text
Lê @docs/especificacao.md, secção 4 (F5).
Cria src/engine/rules.ts com a regra de inspeção por idade, o mês do IUC e a data da última verificação (usa valores marcados como "a confirmar" para eu verificar nas fontes oficiais).
Implementa lembretes de inspeção, IUC, seguro, revisão e pneus com estados ok, em breve e atrasado.
Implementa exportação em ficheiro .ics com um evento por lembrete.
Ao marcar como feito, propõe registar a despesa correspondente.
Testes para a mudança de estado em torno das datas-limite.
```

**Etapa 6 · Simulador**

```text
Lê @docs/especificacao.md, secção 4 (F6) e secção 5.
Implementa /app/simular com os cinco cenários: mais ou menos km, trocar combustível, carro A contra carro B, carro contra alternativas com ponto de equilíbrio, manter ou vender hoje.
Controlos deslizantes com resultado em direto, gráfico de custo acumulado a 5 anos e botão "como é calculado?".
A lógica fica em src/engine/scenarios.ts, com testes.
Guardar cenários fica marcado como função paga (ainda sem pagamento a sério, usa uma flag).
```

**Etapa 7 · Avaliador de usado**

```text
Lê @docs/especificacao.md, secção 4 (F7).
Implementa /app/usado com 3 passos (anúncio, o teu uso, resultado).
A lógica fica em src/engine/used-car.ts: custo total a 3 e 5 anos, semáforo com razões escritas, comparação com o carro atual.
Sem ler nem copiar dados de sites de anúncios. Os valores são escritos pela pessoa.
Gera a checklist de visita em PDF com @react-pdf/renderer.
Permite comparar dois anúncios lado a lado.
```

**Etapa 8 · Relatórios, partilha e garagem**

```text
Lê @docs/especificacao.md, secção 4 (F8 e F9).
Implementa PDF mensal e anual, CSV, cartão para partilhar (imagem 1080 por 1350, sem matrícula, com Web Share API) e backup na interface.
Implementa a garagem com vários carros, seletor no topo e carro vendido com balanço final.
As funções pagas usam a flag de licença.
```

**Etapa 9 · PWA e polimento**

```text
Lê @docs/especificacao.md, secções 8 e 13.
Configura manifesto e service worker (Serwist) para a app funcionar offline e ser instalável.
Verifica navegação por teclado, foco visível, contraste nos dois temas e alternativas em texto para os gráficos.
Respeita prefers-reduced-motion.
Corre Lighthouse na página inicial e no painel e corrige tudo abaixo de 90.
Diz-me o que não conseguiste verificar sem um iPhone real.
```

**Etapa 10 · Página inicial e calculadora pública**

```text
Lê @docs/especificacao.md, secções 4 (F11), 8 e 11.
Cria a página inicial, /calcular com os 6 campos e resultado imediato, e a passagem para a app com os dados preenchidos (via armazenamento local).
Cria a estrutura de 2 páginas de conteúdo da secção 11 com metadados para pesquisa, data de atualização visível e ligação à calculadora.
Cria as páginas /privacidade e /termos com texto-base que eu vou rever.
Estatísticas sem cookies, apenas contadores anónimos.
```

**Etapa 11 · Pagamentos e licença**

```text
Lê @docs/especificacao.md, secção 10.
Implementa a folha de upgrade, a ativação da chave de licença do Lemon Squeezy e a validação com guardar do último resultado, para funcionar sem rede.
O estado da licença desbloqueia as funções pagas pela mesma flag usada até aqui.
Nunca bloqueies nem apagues dados já existentes por falha de validação.
Explica-me como configurar o produto e o limite de dispositivos no Lemon Squeezy.
Se a validação exigir uma chave secreta, diz-me antes de a pores no código.
```

## 17. Decisões em aberto

Não precisas de fechar tudo para começar. As que bloqueiam cada etapa estão assinaladas. As outras podes decidir quando lá chegares.

- [ ] Domínio e registo da marca para Kilora (antes da etapa 10)
- [ ] Só Portugal na versão 1, ou preparar já outros países? (antes da etapa 5)
- [ ] Preço final e o que fica no plano gratuito (antes da etapa 11)
- [ ] Lemon Squeezy ou outro processador de pagamentos (antes da etapa 11)
- [ ] Alojamento: Cloudflare Pages ou outro que permita uso comercial (antes da etapa 10)
- [ ] Confirmar a regra da inspeção e o mês do IUC nas fontes oficiais (antes da etapa 5)
- [ ] Confirmar os valores iniciais: 12 % de depreciação ao ano e 40 000 km de vida dos pneus (antes da etapa 3)
- [ ] Atividade nas Finanças, faturação e compatibilidade com o teu contrato de trabalho (antes da primeira venda)
- [ ] Política de reembolso (antes da etapa 11)
- [ ] Logótipo e nome visível do cartão para partilhar (antes da etapa 8)
- [ ] Quem vai fazer o teste com pessoas reais (antes da etapa 12)

### Como manter este documento vivo

Cada vez que decidires algo, muda a secção correspondente em vez de criar notas soltas. Antes de pedir uma etapa ao Cursor, exporta o documento em Markdown e substitui `docs/especificacao.md`. Assim o Cursor trabalha sempre com a versão certa.
