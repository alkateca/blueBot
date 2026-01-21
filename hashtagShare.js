const { BskyAgent } = require('@atproto/api');
const dotenv = require('dotenv');
dotenv.config();

const agent = new BskyAgent({
    service: 'https://bsky.social',
  });


// Conjunto para armazenar IDs de posts já repostados (em produção, use um arquivo ou banco de dados)
const repostedCache = new Set();

async function botRepostByHashtag(hashtag) {
    try {
        await agent.login({ 
            identifier: process.env.BLUESKY_USERNAME, 
            password: process.env.BLUESKY_PASSWORD 
        });

        console.log(`Buscando posts com a hashtag: ${process.env.HASHTAG}...`);

        const search = await agent.app.bsky.feed.searchPosts({
            q: hashtag,
            limit: 1
        });

        const posts = search.data.posts;

        for (const post of posts) {
            if (!repostedCache.has(post.uri)) {
                
                console.log(`Repostando: ${post.uri}`);

                await agent.repost(post.uri, post.cid);

                repostedCache.add(post.uri);

                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

    } catch (error) {
        console.error("Erro no bot:", error);
    }
}

setInterval(() => botRepostByHashtag(process.env.HASHTAG), 10 * 60 * 1000);

botRepostByHashtag(process.env.HASHTAG);