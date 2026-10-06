require("dotenv").config();

async function main() {
  const token = process.env.TELEGRAM_USER_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const backendUrl = process.env.BACKEND_PUBLIC_URL;
  const info = process.argv.includes("--info");
  const remove = process.argv.includes("--delete");

  if (!token) throw new Error("TELEGRAM_USER_BOT_TOKEN is required");
  if (!info && !remove && !secret) throw new Error("TELEGRAM_WEBHOOK_SECRET is required");
  if (!info && !remove && !backendUrl) throw new Error("BACKEND_PUBLIC_URL is required");

  let endpoint;
  let payload = {};
  if (info) {
    endpoint = "getWebhookInfo";
  } else if (remove) {
    endpoint = "deleteWebhook";
  } else {
    const url = new URL("/api/telegram/webhook", backendUrl);
    if (url.protocol !== "https:") throw new Error("BACKEND_PUBLIC_URL must use HTTPS");
    endpoint = "setWebhook";
    payload = {
      url: url.toString(),
      secret_token: secret,
      allowed_updates: ["message", "callback_query"],
    };
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
    method: endpoint === "getWebhookInfo" ? "GET" : "POST",
    ...(endpoint === "getWebhookInfo" ? {} : {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    signal: AbortSignal.timeout(15_000),
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(`Telegram API returned an invalid response (HTTP ${response.status})`);
  }
  if (!response.ok || !result.ok) {
    throw new Error(`Telegram API request failed (HTTP ${response.status})`);
  }
  if (info) console.log(JSON.stringify(result.result, null, 2));
  else console.log(remove ? "Telegram webhook deleted." : "Telegram webhook configured.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
