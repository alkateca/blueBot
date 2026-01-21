# Usa uma imagem estável e leve do Node.js
FROM node:20-slim

# Instala ferramentas necessárias para dependências nativas (se houver)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências do projeto e o PM2 globalmente
RUN npm install --production && npm install pm2 -g

# Copia todo o código do projeto (incluindo os dois scripts e o ecosystem)
COPY . .

# Expõe a porta (opcional, já que são bots de saída, mas boa prática)
# EXPOSE 3000

# Comando para rodar o PM2 em modo runtime para Docker
# Ele lerá o arquivo ecosystem.config.js e iniciará os dois scripts
CMD ["pm2-runtime", "ecosystem.config.js"]