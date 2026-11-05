# Kilora

Web app instalável (PWA) que mostra quanto um carro custa de verdade, por mês e por km. Os dados ficam só no dispositivo.

A especificação completa está em [`docs/especificacao.md`](docs/especificacao.md).

## Comandos

```bash
npm install        # instalar dependências
npm run dev        # servidor de desenvolvimento em http://localhost:3000
npm test           # correr os testes uma vez
npm run test:watch # testes em modo contínuo
npm run lint       # verificar o código
npm run build      # gerar o site estático na pasta out/
```

## Estrutura

- `app/(public)/` página inicial, calculadora pública e páginas legais
- `app/app/` ecrãs da aplicação
- `src/engine/` motor de cálculo (funções puras com testes)
- `src/db/` base de dados local, esquemas e backup
- `src/components/` interface reutilizável
- `src/features/` código de cada funcionalidade
- `src/lib/` formatação, datas, licença
- `src/i18n/pt-PT.json` todos os textos da app
