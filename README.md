# API Grove

API para gerenciamento de agendamentos do sistema Grove.

## Descrição

Esta API fornece endpoints para gerenciar agendamentos, clientes, procedimentos e estruturas organizacionais do sistema Grove.

## Instalação

```bash
# Instalar dependências
npm install

# Compilar TypeScript
npm run build
```

## Executando a API

```bash
# Modo de desenvolvimento (com hot reload)
npm run dev

# Modo de produção
npm run start
```

## Estrutura do Projeto

```
api-grove/
├── src/
│   ├── controllers/      # Controladores da API
│   ├── routes/           # Rotas da API
│   ├── services/         # Serviços de negócio
│   ├── types/            # Definições de tipos TypeScript
│   └── index.ts          # Ponto de entrada da aplicação
├── dist/                 # Código compilado (gerado após build)
├── package.json          # Dependências e scripts
└── tsconfig.json         # Configuração do TypeScript
```

## Endpoints da API

### Agendamentos

- `POST /api/scheduler/read`: Buscar agendamentos
- `POST /api/scheduler/availability-periods`: Buscar períodos disponíveis
- `POST /api/scheduler/submit-availability`: Submeter agendamento
- `POST /api/scheduler/update-status`: Atualizar status de agendamento

### Clientes

- `GET /api/clients/search`: Buscar clientes
- `POST /api/clients/list-filtered`: Listar clientes filtrados
- `POST /api/clients/birthdays`: Buscar aniversariantes

### Procedimentos

- `GET /api/procedures/types`: Buscar tipos de procedimento
- `POST /api/procedures/available`: Buscar procedimentos disponíveis
- `POST /api/procedures/daily`: Buscar procedimentos de um dia específico

### Estruturas Organizacionais

- `POST /api/organizational-structures`: Listar estruturas organizacionais
- `POST /api/organizational-structures/set-current`: Definir estrutura atual 