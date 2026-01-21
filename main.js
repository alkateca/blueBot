const { BskyAgent, RichText } = require('@atproto/api');const fs = require("fs");
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


base_url = process.env.BASE_URL;


// agendador de postagem

console.log("🤖 Bot iniciado! Agendado para rodar de hora em hora.");

cron.schedule("0,45 * * * *", async () => {
    console.log(`⏰ Executando agendamento: ${new Date().toLocaleString()}`);
    
    try {
        await main();
    } catch (error) {
        console.error("Erro na execução agendada:", error);
    };
});

// function para conseguir a primeira galeria da pesquisa
async function get_first_gallery(base_url){
    
    return await axios.get(base_url)
        .then(response => {
            console.log("Recebendo dados");

            const html = response.data;

            const $ = cheerio.load(html);

            const pageData = {
                links: []
            };

            $("a").each((index, element) => {
                const linkHref = $(element).attr("href");
                    
                    pageData.links.push({
                        url: linkHref
                    })
            })

            first_link = pageData.links.find(item => item.url.includes("/g/"));
            console.log(first_link);
            //console.log(pageData)
            return first_link.url;

        })
        .catch(err => {
            console.log("Error fetching data: ", err);
            return null;
    });
}

// function que pega os dados da galeria e o link para a pagina de download
async function gallery_infos(first_link) {
    

    return axios.get(first_link)

        .then(response => {
            console.log("Recebendo dados");

            const html = response.data;

            const $ = cheerio.load(html);

            const artist_name = $('.tc:contains("artist:")').next().text().trim();

            let titleName = $('h1').first().text().trim();

            if (titleName.length > 300) {
                titleName = titleName.substring(0, 230) + " (...)";
            }

            const pageData = {
                title: titleName,
                artist: artist_name,
                links: ""
            };

            const all_links = [];

            $("a").each((index, element) => {
    
                const linkHref = $(element).attr("href");
    
                    all_links.push({
                        url: linkHref
                    });
    
            });

            const target_link = all_links.find(item => item.url.endsWith("-1"));

            pageData.links = target_link;
            console.log(pageData);

            return {
                title: titleName,
                artist: artist_name,
                url: target_link.url
            };

        })
        .catch(err => {
            console.log("Error fetching data: ", err);
            return null;
    });

};


// function para baixar a imagem
async function download_image(imagem_url){
    try {
        const response = await axios.get(imagem_url)

                const html = response.data;

                const $ = cheerio.load(html);

                const image_src = $("#img").attr("src");

                const pathDoArquivo = path.resolve(__dirname, 'imagem_baixada.webp');
                
                const writer = fs.createWriteStream(pathDoArquivo);

        const image_response = await axios({
            url:image_src,
            method:"GET",
            responseType:"stream"
        });

        image_response.data.pipe(writer);
                
        return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    console.log("SUCESSO: Imagem salva em:", pathDoArquivo);
                    resolve();
                });
                writer.on('error', reject);
        });
    } catch (err) {
        console.log(`Error: ${err}`);
    }


}


async function main() {

    const first_link = await get_first_gallery(base_url);

    const info = await gallery_infos(first_link);

    await download_image(info.url);

    await agent.login({ identifier: process.env.BLUESKY_USERNAME, password: process.env.BLUESKY_PASSWORD})

    const imagePath = path.join(__dirname, 'imagem_baixada.webp');

    const imageBytes = fs.readFileSync(imagePath)

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

    if (!uploadedImage) 
        throw new Error("Failed to upload blob");

    const imageRef = uploadedImage.data.blob;

    //junta as infos e a imagem e cria um post
    const postRecord = {
    $type: 'app.bsky.feed.post',
    text: rt.text,
    facets: rt.facets,
    createdAt: new Date().toISOString(),
    embed: {
        $type: 'app.bsky.embed.images',
        images: [
            {
                image: imageRef,
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
console.log("Image post successful!");

}


main();