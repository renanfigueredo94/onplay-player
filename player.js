"use strict";

const statusText = document.getElementById("status");
const detailText = document.getElementById("detail");
const loading = document.getElementById("loading");
const videoHost = document.getElementById("videoHost");
const VIDEO_EXTENSIONS = /\.(mp4|m4v|mkv|webm|mov|avi|mpg|mpeg|ts|m3u8)$/i;
window.WEBTORRENT_ANNOUNCE = [
  "wss://tracker.openwebtorrent.com",
  "wss://tracker.webtorrent.dev",
  "wss://tracker.files.fm:7073/announce",
  "wss://tracker.novage.com.ua"
];

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
      video.addEventListener("playing", () => loading.classList.add("hidden"), { once: true });
      video.addEventListener("error", () => {
        setStatus("A TV não conseguiu reproduzir este vídeo", "O formato ou codec pode não ser compatível com o navegador webOS.", true);
      });
      videoHost.replaceChildren(video);
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
