# Projeto Bahia Dois

Primeira montagem da migracao do PowerApps para uma aplicacao web com a mesma
linha tecnica e visual do `sistema_bahia`, preparada para `Supabase` e `Vercel`.

## O que esta implementado

- shell visual alinhado ao sistema Bahia publicado
- formulario de `Novo equipamento`
- galeria de `Consultar equipamentos`
- popup de `Solicitar`
- tela de `Solicitacoes`
- dados mockados para validar a navegacao e a logica

## Stack

- `Vite`
- `React`
- `TypeScript`
- `Supabase`

## Rodar localmente

```bash
npm install
npm run dev
```

Se o PowerShell bloquear o `npm`, use:

```bash
npm.cmd install
npm.cmd run dev
```

## Variaveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=
```

## Proximos passos

1. Criar as tabelas reais no Supabase.
2. Trocar os mocks por consultas reais.
3. Configurar upload real de anexos no Supabase Storage.
4. Adicionar autenticacao e perfis administrativos.
5. Publicar no GitHub e conectar na Vercel.
