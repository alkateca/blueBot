const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

require('dotenv').config();


base_url = process.env.BASE_URL;


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

async function gallery_infos(first_link) {
    

    return axios.get(first_link)

        .then(response => {
            console.log("Recebendo dados");

            const html = response.data;

            const $ = cheerio.load(html);

            const artist_name = $('.tc:contains("artist:")').next().text().trim();

            const titleName = $('h1').first().text().trim();

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
            return pageData.links.url;

        })
        .catch(err => {
            console.log("Error fetching data: ", err);
            return null;
    });

};

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

    const image_url = await gallery_infos(first_link);

    download_image(image_url)

}

main();

