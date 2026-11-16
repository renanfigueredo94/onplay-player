# OnPlay+ Player

Player web minimalista adaptado do [Magnet Player](https://github.com/ferrolho/magnet-player), licenciado sob MIT. O mecanismo usa WebTorrent no navegador e peers WebRTC; não é um backend nem um serviço de transcodificação.

## Publicação

Hospede esta pasta em um domínio HTTPS, por exemplo como uma subpasta de um site GitHub Pages. HTTPS é necessário para registrar o Service Worker que entrega o fluxo de mídia ao elemento de vídeo.

No `src/config.js` do OnPlay+, defina `MAGNET_PLAYER_URL` como a URL pública desta pasta. O catálogo e o player podem ser hospedados no mesmo GitHub Pages.

O app envia o magnet pelo fragmento da URL. O player seleciona o maior arquivo com extensão de vídeo e mostra apenas o vídeo em toda a área disponível, com uma mensagem discreta durante o carregamento e controles nativos. O OnPlay+ esconde sua barra ao abrir a reprodução. O navegador pode exigir uma ação do usuário para o modo Fullscreen API; o vídeo, porém, já preenche o viewport do app.

## Créditos

`webtorrent.min.js` e `sw.min.js` vêm do projeto Magnet Player. Veja `LICENSE` para os termos MIT e o aviso de copyright.
