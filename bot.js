import { BskyAgent } from '@atproto/api';
import * as dotenv from 'dotenv';

dotenv.config();

// Create a Bluesky Agent 
const agent = new BskyAgent({
    service: 'https://bsky.social',
  })


async function main() {
    await agent.login({ BLUESKY_USERNAME, BLUESKY_PASSWORD})
    await agent.post({
        text: "🙂"
    });
    console.log("Just posted!");
}

main();