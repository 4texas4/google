"use strict";

// ======= CLEAN UP ANY DUPLICATE PROXY PREFIXES =======
(() => {
  const proxyBase = "https://tjs65t-8080.csb.app";
  let url = window.location.href;

  const firstIndex = url.indexOf(proxyBase);
  const secondIndex = url.indexOf(proxyBase, firstIndex + proxyBase.length);

  if (secondIndex !== -1) {
    // Determine if the extra proxy has a "?" right after it
    const extraChar = url[secondIndex + proxyBase.length] === "?" ? 1 : 0;
    const cleanedUrl =
      proxyBase + "/?" + url.slice(secondIndex + proxyBase.length + extraChar);
    window.location.replace(cleanedUrl);
    return; // stop further execution
  }
})();

// ======= SCRAMJET + BAREMUX SETUP =======
/**
 * @type {HTMLFormElement}
 */
const form = document.getElementById("sj-form");
/**
 * @type {HTMLInputElement}
 */
const address = document.getElementById("sj-address");
/**
 * @type {HTMLInputElement}
 */
const searchEngine = document.getElementById("sj-search-engine");
/**
 * @type {HTMLParagraphElement}
 */
const error = document.getElementById("sj-error");
/**
 * @type {HTMLPreElement}
 */
const errorCode = document.getElementById("sj-error-code");

const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({
  files: {
    wasm: "/scram/scramjet.wasm.wasm",
    all: "/scram/scramjet.all.js",
    sync: "/scram/scramjet.sync.js",
  },
});

scramjet.init();

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

async function loadGoogle(url) {
  try {
    await registerSW();
  } catch (err) {
    error.textContent = "Failed to register service worker.";
    errorCode.textContent = err.toString();
    throw err;
  }

  let wispUrl =
    (location.protocol === "https:" ? "wss" : "ws") +
    "://" +
    location.host +
    "/wisp/";

  if ((await connection.getTransport()) !== "/epoxy/index.mjs") {
    await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
  }

  const frame = scramjet.createFrame();
  frame.frame.id = "sj-frame";
  document.body.appendChild(frame.frame);
  frame.go(url);
}

// Automatically load site from URL query, default to Google
window.addEventListener("DOMContentLoaded", () => {
  const query = window.location.search.substring(1); // remove the "?"
  const urlToLoad = query ? query : "https://www.google.com";
  loadGoogle(urlToLoad).catch(console.error);
});

// Keep the form functional for manual searches
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const url = search(address.value, searchEngine.value);
  loadGoogle(url);
});
