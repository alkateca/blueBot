import { BskyAgent } from '@atproto/api';
import * as dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const agent = new BskyAgent({
    service: 'https://bsky.social',
});

// --- FUNÇÃO PRINCIPAL DO BOT ---
async function executarBot() {
    const { BLUESKY_USERNAME, BLUESKY_PASSWORD } = process.env;
    
    console.log(`[${new Date().toISOString()}] Iniciando ciclo do bot...`);

    try {
        // Tenta logar (se já estiver logado, ele renova a sessão)
        await agent.login({ identifier: BLUESKY_USERNAME, password: BLUESKY_PASSWORD });
        console.log("Login realizado!");

        // Aqui você pode mudar o texto ou colocar uma lógica para pegar frases aleatórias
        await agent.post({
            text: `Olá Bluesky! Este é um post automático. Hora atual: ${new Date().toLocaleTimeString('pt-BR')}`
        });
        console.log("Post enviado com sucesso!");

    } catch (error) {
        console.error("Erro na execução do bot:");
        // Se for erro de Rate Limit, mostramos uma mensagem específica
        if (error.error === 'RateLimitExceeded') {
            console.error(">> OPA! Limite do Bluesky atingido. Vou esperar o próximo ciclo.");
        } else {
            console.error(error);
        }
    }
}

// --- SERVIDOR WEB (Para o Fly.io não desligar a máquina) ---
const port = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot online e agendado!');
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${port}`);
    
    // 1. Executa a primeira vez assim que liga
    executarBot();

    // 2. Agenda para repetir a cada 1 HORA (em milissegundos)
    // 1000 * 60 * 60 = 3600000 ms
    const INTERVALO = 1000 * 60 * 60; 
    
    setInterval(() => {
        executarBot();
    }, INTERVALO);
    
    console.log(`Agendamento iniciado: O bot vai rodar a cada ${INTERVALO / 1000 / 60} minutos.`);
});