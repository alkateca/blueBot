import { BskyAgent } from '@atproto/api';
import * as dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const agent = new BskyAgent({
    service: 'https://bsky.social',
});

async function iniciarBot() {
    const { BLUESKY_USERNAME, BLUESKY_PASSWORD } = process.env;
    
    try {
        console.log(`Tentando logar como: ${BLUESKY_USERNAME}...`);
        
        await agent.login({ identifier: BLUESKY_USERNAME, password: BLUESKY_PASSWORD });
        console.log("Login realizado com sucesso!");

        await agent.post({
            text: "Bot reiniciado e estável! 🚀"
        });
        console.log("Post enviado!");

    } catch (error) {
        console.error("ERRO NO BOT (Mas o servidor continua online):");
        console.error(error);

    }
}

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('O Bot esta rodando!');
});

server.listen(port, () => {
    console.log(`Servidor web rodando na porta ${port}`);
    
    iniciarBot(); 
});