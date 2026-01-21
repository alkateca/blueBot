module.exports = {
  apps: [
    {
      name: "bot-postagem",
      script: "./main.js",
      watch: false,
      env: {
        NODE_ENV: "production",
      }
    },
    {
      name: "bot-repost",
      script: "./hashtagShare.js",
      watch: false,
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};