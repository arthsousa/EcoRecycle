# EcoRecycle - Sistema de Login

Este projeto implementa uma tela de login completa (frontend e backend) utilizando Node.js, Express e SQLite, com o design idêntico ao fornecido na imagem de referência. Ele também inclui um dashboard simples após o login.

## 🌟 Características

- **Frontend**: HTML5, CSS3 e JavaScript vanilla para uma interface responsiva e fiel ao design.
- **Backend**: Node.js com Express para gerenciar as rotas da API.
- **Banco de Dados**: SQLite para armazenamento de usuários.
- **Autenticação**: Senhas com hash bcryptjs para segurança.
- **CORS**: Habilitado para permitir a comunicação entre frontend e backend.
- **Estrutura**: Projeto organizado em uma única pasta `EcoRecycle`.

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior recomendada)
- npm (gerenciador de pacotes do Node.js)

## 🚀 Instalação e Execução

### 1. Navegue até o diretório do projeto
```bash
cd EcoRecycle
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Inicie o servidor
```bash
node server.js
```

### 4. Acesse a aplicação
Abra seu navegador e acesse: `http://localhost:3000`

## 👤 Usuário de Teste

Para testar a aplicação, um usuário de exemplo é criado automaticamente na primeira execução do `server.js`:

- **Email**: `admin@ecorecycle.com`
- **Senha**: `password123`

## 📁 Estrutura do Projeto

```
EcoRecycle/
├── public/               # Arquivos do frontend
│   ├── index.html        # Página de login
│   ├── dashboard.html    # Página após o login
│   ├── style.css         # Estilos CSS da aplicação
│   ├── script.js         # Lógica JavaScript do frontend
│   └── logo.png          # Logo da Terra Reciclagem
├── database.db           # Arquivo do banco de dados SQLite (gerado na primeira execução)
├── server.js             # Arquivo principal do backend Node.js
├── package.json          # Metadados do projeto e dependências
├── package-lock.json     # Registro exato das dependências
└── README.md             # Este arquivo
```

## 💡 Como funciona

### Backend (`server.js`)
- Configura um servidor Express para servir os arquivos estáticos do frontend (na pasta `public`).
- Conecta-se a um banco de dados SQLite (`database.db`). Se o banco de dados ou a tabela `users` não existirem, eles são criados.
- Um usuário de exemplo (`admin@ecorecycle.com`, `password123`) é inserido automaticamente na primeira execução.
- Possui rotas de API para:
  - `POST /api/register`: Para registrar novos usuários (com hash de senha).
  - `POST /api/login`: Para autenticar usuários (comparando senhas com hash).
  - `GET /api/health`: Um endpoint simples para verificar a saúde do servidor.

### Frontend (pasta `public`)
- `index.html`: Contém o formulário de login com o design especificado.
- `style.css`: Define os estilos visuais para replicar o design da imagem.
- `script.js`: Lida com a lógica do formulário de login, validação, comunicação com o backend e redirecionamento para o dashboard.
- `dashboard.html`: Uma página simples que é exibida após o login bem-sucedido.

## 🔐 Segurança

- As senhas são armazenadas com hash usando `bcryptjs`.
- O backend utiliza CORS para permitir requisições do frontend.

## 📄 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

