const { BskyAgent } = require('@atproto/api');
const fs = require("fs");
const process = require("process");
require('dotenv').config();



// Create a Bluesky Agent 
const agent = new BskyAgent({
    service: 'https://bsky.social',
  })


async function main() {
    await agent.login({ identifier: process.env.BLUESKY_USERNAME, password: process.env.BLUESKY_PASSWORD})


    const imageBytes = fs.readFileSync("/home/alkateca/Documentos/projects/node/erobot/imagem_baixada.webp")

    const uploadedImage = await agent.uploadBlob(imageBytes, { encoding: 'image/jpeg' });
    
    if (!uploadedImage) 
        throw new Error("Failed to upload blob");

    const imageRef = uploadedImage.data.blob;

    const postRecord = {
    $type: 'app.bsky.feed.post',
    text: 'This is my bot\'s image post!',
    createdAt: new Date().toISOString(),
    embed: {
        $type: 'app.bsky.embed.images',
        images: [
            {
                image: imageRef,
                alt: 'A description of the image for accessibility',
            },
        ],
    },
};

await agent.post(postRecord);
console.log("Image post successful!");

}


main();