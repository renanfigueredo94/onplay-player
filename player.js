"use strict";

const statusText = document.getElementById("status");
const detailText = document.getElementById("detail");
const loading = document.getElementById("loading");
const videoHost = document.getElementById("videoHost");
const videoBack = document.getElementById("videoBack");
let backTimer = null;
const VIDEO_EXTENSIONS = /\.(mp4|m4v|mkv|webm|mov|avi|mpg|mpeg|ts|m3u8)$/i;
window.WEBTORRENT_ANNOUNCE = [
  "wss://tracker.openwebtorrent.com",
  "wss://tracker.webtorrent.dev",
  "wss://tracker.files.fm:7073/announce",
  "wss://tracker.novage.com.ua"
];

function revealBackButton() {
  if (window.parent !== window) {
    window.parent.postMessage({ type: "onplay:show-back" }, "*");
    return;
  }
  videoBack.classList.add("is-visible");
  videoBack.focus();
  clearTimeout(backTimer);
  backTimer = setTimeout(() => {
    videoBack.classList.remove("is-visible");
    videoBack.blur();
  }, 5000);
}

videoBack.addEventListener("click", () => {
  if (window.parent !== window) window.parent.postMessage({ type: "onplay:back" }, "*");
  else history.back();
});

document.addEventListener("keydown", event => {
  if (event.key === "ArrowUp" || event.keyCode === 38) {
    event.preventDefault();
    revealBackButton();
  } else if (["Escape", "Backspace", "BrowserBack", "GoBack"].includes(event.key) || [461, 10009].includes(event.keyCode)) {
    if (window.parent !== window) {
      event.preventDefault();
      window.parent.postMessage({ type: "onplay:back" }, "*");
    }
  } else if (["Enter", " ", "Spacebar"].includes(event.key) || [13, 23, 179].includes(event.keyCode)) {
    if (document.activeElement === videoBack) return;
    const video = videoHost.querySelector("video");
    if (!video) return;
    event.preventDefault();
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  } else if ([19, 415].includes(event.keyCode) || ["MediaPlay", "MediaPause"].includes(event.key)) {
    const video = videoHost.querySelector("video");
    if (!video) return;
    event.preventDefault();
    if (event.keyCode === 415 || event.key === "MediaPlay") video.play().catch(() => {});
    else video.pause();
  }
}, true);

function setStatus(title, detail = "", isError = false) {
  statusText.textContent = title;
  detailText.textContent = detail;
  loading.classList.toggle("error", isError);
  loading.classList.remove("hidden");
}

async function start() {
  const torrentId = decodeURIComponent(location.hash.slice(1)).trim();
  if (!torrentId) {
    setStatus("Nenhum magnet recebido", "Volte ao catálogo e escolha um título.", true);
    return;
  }
  if (!("serviceWorker" in navigator) || typeof WebTorrent !== "function") {
    setStatus("Este navegador não é compatível", "O player precisa de WebRTC e Service Worker.", true);
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register("./sw.min.js", { scope: "./" });
    await navigator.serviceWorker.ready;
    const worker = registration.active || registration.installing || registration.waiting;
    if (worker && worker.state !== "activated") {
      await new Promise(resolve => worker.addEventListener("statechange", () => {
        if (worker.state === "activated") resolve();
      }, { once: false }));
    }

    const client = new WebTorrent();
    client.on("error", error => setStatus("Falha no player", error.message || "Erro do WebTorrent.", true));
    client.createServer({ controller: registration });
    setStatus("Procurando fontes…", "Aguardando peers compatíveis com WebRTC.");
    const torrent = client.add(torrentId);
    const peerTimer = setTimeout(() => {
      if (!torrent.numPeers) setStatus("Ainda procurando fontes…", "Este magnet precisa de peers compatíveis com WebRTC.");
    }, 30000);

    torrent.on("error", error => {
      clearTimeout(peerTimer);
      setStatus("Não foi possível abrir este magnet", error.message || "Confira as fontes WebRTC do torrent.", true);
    });
    torrent.on("ready", () => {
      clearTimeout(peerTimer);
      const videos = torrent.files.filter(file => VIDEO_EXTENSIONS.test(file.name));
      const file = videos.sort((a, b) => b.length - a.length)[0];
      if (!file) {
        setStatus("Nenhum vídeo encontrado", "Este torrent não contém um arquivo de vídeo compatível.", true);
        return;
      }

      const video = document.createElement("video");
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.setAttribute("webkit-playsinline", "true");
      video.style.width = "100vw";
      video.style.height = "100vh";
      video.style.objectFit = "contain";
      video.setAttribute("aria-label", file.name);
      video.tabIndex = 0;
      video.addEventListener("playing", () => loading.classList.add("hidden"), { once: true });
      video.addEventListener("error", () => {
        setStatus("A TV não conseguiu reproduzir este vídeo", "O formato ou codec pode não ser compatível com o navegador webOS.", true);
      });
      videoHost.replaceChildren(video);
      video.focus();
      setStatus("Carregando vídeo…", file.name);
      file.streamTo(video);
      video.play().catch(() => {
        setStatus("Vídeo pronto", "Pressione OK ou Play no controle para começar.");
      });
    });
  } catch (error) {
    setStatus("Não foi possível iniciar o player", error.message || "Verifique a conexão e o suporte do navegador.", true);
  }
}

start();
