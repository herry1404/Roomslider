const dotenv = require("dotenv");
dotenv.config();

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN is required");
    process.exitCode = 1;
    return;
  }

  console.log("Waiting for a message to the bot...");
  let offset;
  while (true) {
    const url = new URL(`https://api.telegram.org/bot${token}/getUpdates`);
    url.searchParams.set("timeout", "50");
    if (offset !== undefined) url.searchParams.set("offset", String(offset));

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(`Telegram API HTTP ${response.status}`);
      }
      for (const update of result.result || []) {
        offset = update.update_id + 1;
        const chatId = update.message?.chat?.id;
        if (chatId !== undefined) {
          console.log(`Your Telegram chat ID: ${chatId}`);
          return;
        }
      }
    } catch (error) {
      console.error(`Telegram polling failed: ${String(error.message || "request failed").slice(0, 160)}`);
      process.exitCode = 1;
      return;
    }
  }
}

main();
