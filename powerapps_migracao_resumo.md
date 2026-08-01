# Resumo da migracao do PowerApps

## Tela inicial

### Modulo 1: Equipamentos

- Acao principal: `Equipamentos`
- Destino: tela com cadastro e consulta de equipamentos

### Fluxo: Novo equipamento

- Acao principal: `NOVO EQUIPAMENTO`
- Comportamento: abre formulario para preenchimento

Campos identificados:

- `nome`: texto
- `sistema_produtivo`: opcoes
- `convenio_termo`: texto
- `condicao`: opcoes
- `proprietario`: texto
- `valor_estimado`: moeda BRL
- `municipio`: opcoes
- `endereco`: opcoes dependentes do municipio selecionado
- `programa`: opcoes
- `descricao`: multipla linha
- `anexos`: upload de arquivos

Regras identificadas:

- O campo `endereco` deve ser filtrado pelo `municipio` selecionado.
- Sera necessario receber a base de municipios/enderecos para abastecer o Supabase.

### Fluxo: Consultar equipamentos

- Acao principal: `CONSULTAR EQUIPAMENTOS`
- Comportamento esperado: listar registros ja cadastrados em formato de galeria
- Observacao de UX: manter a ideia da galeria do app, mas com visual mais bonito e mais claro para consulta

### Fluxo: Solicitar

- Acao na listagem: botao `SOLICITAR`
- Comportamento: abre popup na propria tela com formulario

Campos identificados:

- `nome_solicitante`: texto
- `contato_solicitante`: texto
- `local_destino`: texto
- `justificativa`: multipla linha

Regra identificada:

- Ao salvar a solicitacao, o usuario volta para a tela inicial.

### Fluxo: Solicitacoes

- Acao principal: `SOLICITACOES`
- Destino: tela com galeria das solicitacoes realizadas

Campos adicionais na listagem:

- `nome_admin`
- `decisao_admin`: `APROVADO` ou `RECUSADO`
- `observacoes`: texto multipla linha

## Estrutura inicial sugerida para a stack Bahia

### Frontend

- Aplicacao web seguindo a mesma linguagem visual do projeto Bahia
- Telas:
  - dashboard inicial
  - cadastro de equipamento
  - consulta de equipamentos
  - popup/modal de solicitacao
  - tela de solicitacoes

### Backend / dados

- `supabase` para autenticacao, banco e storage
- Tabelas provaveis:
  - `equipamentos`
  - `solicitacoes`
  - `municipios`
  - `enderecos`
  - `programas`
  - `sistemas_produtivos`
  - `condicoes`

### Deploy

- Preferencia inicial: `Vercel`
- Motivo: mais controle e alinhamento com uma aplicacao versionada no GitHub

## Pendencias para as proximas telas

- Receber os prints ou documentos das outras telas
- Receber a base que alimenta `municipio` e `endereco`
- Confirmar se havera login/perfis de usuario
- Confirmar se anexos ficam em `Supabase Storage`
- Confirmar quais perfis podem aprovar ou recusar solicitacoes
