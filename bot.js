import { BskyAgent } from '@atproto/api';
import * as dotenv from 'dotenv';

dotenv.config();

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