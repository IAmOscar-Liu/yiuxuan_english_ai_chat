import { OA_ID } from "./constants.js";
import { getProfile, initWithSearchParams, isLoggedIn, login } from "./liff.js";

async function main() {
  //   const topic = getTopic();
  //   if (!topic) {
  //     document.getElementById("status").textContent = "Missing topic.";
  //     return;
  //   }
  let topic;
  const initError = await initWithSearchParams((urlParams) => {
    topic = urlParams.get("topic");
  });
  if (initError) {
    document.getElementById("status").textContent =
      `Liff init failed - ${initError}`;
  } else if (!topic) {
    document.getElementById("status").textContent = "Missing topic.";
    return;
  }

  if (!isLoggedIn()) {
    // In most in-LINE cases user is already logged in, but keep this for external browser
    login({ redirectUri: location.href });
    return;
  }

  // Requires LIFF scope "profile"
  const profile = await getProfile();
  const userId = profile.userId;

  // Tell your backend: "userId entered with topic"
  await fetch("/api/entry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, topic }),
  });

  // Then send user to OA chat screen (open chat)
  // LINE URL scheme: open OA chat screen :contentReference[oaicite:3]{index=3}
  location.href = `https://line.me/R/ti/p/${encodeURIComponent(OA_ID)}`;
}

main().catch((e) => {
  document.getElementById("status").textContent = "Error: " + e.message;
});
