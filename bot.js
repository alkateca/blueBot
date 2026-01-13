import { BskyAgent } from '@atproto/api';
import * as dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const port = process.env.PORT || 8080;
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('O Bot esta rodando (ou tentando)!');
});

server.listen(port, () => {
    console.log(`Servidor web rodando na porta ${port}`);
    iniciarBot();
});

const { BLUESKY_USERNAME, BLUESKY_PASSWORD } = process.env;

const agent = new BskyAgent({
    service: 'https://bsky.social',
  })


async function main() {
    try {
        
        await agent.login({ identifier: BLUESKY_USERNAME, password: BLUESKY_PASSWORD})
        await agent.post({
            text: "🙂"
        });
       console.log("Just posted!");
    } catch (err) {
        console.error("Error: ", err);
        process.exit(1);
    }
}

main();