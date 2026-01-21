# blueBot 🤖
Este projeto consiste em um sistema duplo de bots para a rede social Bluesky, focado em automação de postagens através de web scraping e interação via hashtags.

## 🚀 Funcionalidades
O projeto é dividido em dois serviços principais que rodam simultaneamente através do PM2:

Bot de Postagem (main.js):

Realiza web scraping de galerias utilizando as bibliotecas cheerio e axios.

Faz o download de imagens e extrai metadados automáticos, como título e artista.

Agenda postagens automáticas utilizando node-cron nos minutos 0 e 45 de cada hora.

Inclui lógica para truncar títulos longos acima de 300 caracteres para compatibilidade com a API.

## Bot de Repost (hashtagShare.js):

Monitora hashtags específicas definidas via variáveis de ambiente no arquivo .env.

Realiza reposts automáticos em intervalos recorrentes de 10 minutos.

Utiliza um cache em memória (Set) para evitar a repostagem duplicada de um mesmo post.

## 🛠️ Tecnologias Utilizadas

- Node.js: Ambiente de execução principal para os scripts.

- @atproto/api: SDK oficial para integração com a rede Bluesky.

- Cheerio & Axios: Utilizados para realizar requisições e extrair dados de páginas HTML.

- PM2: Gerenciador de processos utilizado para manter os bots ativos e gerenciar logs.

- Docker: Utilizado para containerização, garantindo um ambiente de deploy isolado.

- node-cron: Biblioteca para o agendamento de tarefas baseadas em tempo.

## ⚙️ Configuração

O projeto utiliza um arquivo .env para gerenciar credenciais e constantes. Este arquivo é ignorado pelo controle de versão por motivos de segurança.

Crie um arquivo .env na raiz do projeto com as seguintes variáveis:

Snippet de código

```
BLUESKY_USERNAME=seu-handle.bsky.social
BLUESKY_PASSWORD=sua-app-password
BASE_URL=url-do-site-para-scraping
HASHTAG=hashtag-para-monitorar
POST_HASHTAG=hashtag-para-incluir-no-post
```
## 📦 Como Rodar

Via Docker (Recomendado)
Construa a imagem a partir do Dockerfile:

Bash
```
docker build -t bsky-bots .
```
Inicie o container referenciando o arquivo de variáveis de ambiente:

Bash
```
docker run -d --name meus-bots --env-file .env --restart always bsky-bots
```
Localmente
Instale as dependências listadas no package.json:

Bash
```
npm install
```
Inicie os serviços gerenciados pelo PM2:

Bash
```
pm2 start ecosystem.config.js
```
📂 Estrutura de Arquivos

- main.js: Script principal para scraping de dados e postagem de mídia.

- hashtagShare.js: Script secundário focado em monitoramento e repostagem de hashtags.

- ecosystem.config.js: Define a configuração multisserviço para o PM2.

- Dockerfile: Instruções para o build do container baseado em node:20-slim.

- .gitignore: Define os arquivos e pastas que não devem ser rastreados pelo Git, como segredos e arquivos temporários.
