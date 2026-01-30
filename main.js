const { BskyAgent, RichText } = require('@atproto/api');
const fs = require("fs");
const process = require("process");
require('dotenv').config();
const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");
const cron = require("node-cron");
const probe = require('probe-image-size');

// Agente do bluesky
const agent = new BskyAgent({
    service: 'https://bsky.social',
});

const base_url = process.env.BASE_URL;
const historyPath = path.resolve(__dirname, 'history.json');

// function para ler o histórico de links já postados do arquivo JSON
function getHistory() {
    if (!fs.existsSync(historyPath)) return [];
    try {
        return JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
    } catch {
        return [];
    }
}

// function para salvar novos links no histórico (Lógica LIFO - limite de 25 itens)
function saveToHistory(link) {
    let history = getHistory();
    
    history.unshift(link);
    
    if (history.length > 25) {
        history = history.slice(0, 25);
    }
    
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

// agendador de postagem
console.log("🤖 Bot iniciado! Histórico LIFO configurado para 25 links.");

cron.schedule("0,45 * * * *", async () => {
    console.log(`⏰ Executando agendamento: ${new Date().toLocaleString()}`);
    try {
        await main();
    } catch (error) {
        console.error("Erro na execução agendada:", error);
    };
});

// function para buscar 4 links aleatórios que contenham /g/ e não estejam no histórico
async function get_random_galleries(base_url){
    return await axios.get(base_url)
        .then(response => {
            const html = response.data;
            const $ = cheerio.load(html);
            const history = getHistory();

            const links = [];
            $("a").each((index, element) => {
                const linkHref = $(element).attr("href");
                if (linkHref && linkHref.includes("/g/") && !history.includes(linkHref)) {
                    links.push(linkHref);
                }
            });

            const shuffled = links.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 4);
            
            return selected;
        })
        .catch(err => {
            console.log("Error fetching data: ", err);
            return [];
    });
}

// function que extrai o título, artista e o link da página da primeira imagem
async function gallery_infos(link) {
    return axios.get(link)
        .then(response => {
            const html = response.data;
            const $ = cheerio.load(html);
            const artist_name = $('.tc:contains("artist:")').next().text().trim();
            let titleName = $('h1').first().text().trim();

            if (titleName.length > 300) {
                titleName = titleName.substring(0, 230) + " (...)";
            }

            const all_links = [];
            $("a").each((index, element) => {
                const linkHref = $(element).attr("href");
                all_links.push({ url: linkHref });
            });

            const target_link = all_links.find(item => item.url && item.url.endsWith("-1"));

            return {
                title: titleName,
                artist: artist_name,
                url: target_link ? target_link.url : null
            };
        })
        .catch(err => {
            console.log("Error fetching gallery info: ", err);
            return null;
    });
};

// function para localizar a URL da imagem real e baixá-la localmente
async function download_image(imagem_url){
    try {
        const response = await axios.get(imagem_url);
        const html = response.data;
        const $ = cheerio.load(html);
        const image_src = $("#img").attr("src");
        const pathDoArquivo = path.resolve(__dirname, 'imagem_baixada.webp');
        const writer = fs.createWriteStream(pathDoArquivo);

        const image_response = await axios({
            url: image_src,
            method: "GET",
            responseType: "stream"
        });

        image_response.data.pipe(writer);
                
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (err) {
        console.log(`Error downloading image: ${err}`);
    }
}

// function principal que orquestra o login, o loop de download e a postagem no Bluesky
async function main() {
    const links = await get_random_galleries(base_url);
    if (links.length === 0) return;

    await agent.login({ identifier: process.env.BLUESKY_USERNAME, password: process.env.BLUESKY_PASSWORD});

    for (const link of links) {
        try {
            const info = await gallery_infos(link);
            if (!info || !info.url) continue;

            await download_image(info.url);

            const imagePath = path.join(__dirname, 'imagem_baixada.webp');
            const imageBytes = fs.readFileSync(imagePath);
            const uploadedImage = await agent.uploadBlob(imageBytes, { encoding: 'image/jpeg' });

            const cleanedTitle = info.title
                .replace(/\[[^\]]*\]/g, '') 
                .replace(/\([^)]*\)/g, '')
                .replace(/[\[\]\(\)]/g, '') 
                .replace(/\s+/g, ' ') 
                .trim();
            
            const postText = `Title: ${cleanedTitle}\nArtist: ${info.artist}\n ${process.env.POST_HASHTAG}`;
            const rt = new RichText({ text: postText });
            const dimensions = probe.sync(imageBytes);
            await rt.detectFacets(agent);

            const postRecord = {
                $type: 'app.bsky.feed.post',
                text: rt.text,
                facets: rt.facets,
                createdAt: new Date().toISOString(),
                embed: {
                    $type: 'app.bsky.embed.images',
                    images: [
                        {
                            image: uploadedImage.data.blob,
                            alt: `${info.title} by ${info.artist}`,
                            aspectRatio: {
                                width: dimensions.width, 
                                height: dimensions.height
                            }        
                        },
                    ],
                },
            };

            await agent.post(postRecord);
            saveToHistory(link); 
            console.log(`Post de "${cleanedTitle}" realizado com sucesso!`);
            
        } catch (error) {
            console.error("Erro ao processar post:", error);
        }
    }
}

main();