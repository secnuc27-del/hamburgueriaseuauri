════════════════════════════════════════════════════════
  HAMBURGUERIA SEU AURI — Sistema Completo v2.0
════════════════════════════════════════════════════════

ESTRUTURA DE ARQUIVOS:
─────────────────────
📁 (raiz)
├── index.html       ← Site principal
├── style.css        ← Estilos (já inclui vídeo + feedback)
├── script.js        ← Lógica do pedido + analytics integrado
├── analytics.js     ← Motor de rastreamento (localStorage)
├── _nojekyll        ← Necessário para GitHub Pages
📁 admin/
└── index.html       ← Painel administrativo protegido
📁 img/
├── aurix.mp4        ← Vídeo hero (corrija o nome se necessário)
├── hero-burger.jpg  ← Poster fallback do vídeo
├── classico.png
├── turbinado.png
├── duplo.png
└── oii_amo_vcs.png

ACESSO AO ADMIN:
────────────────
URL: seusite.com/admin/
Usuário: admin
Senha:   admin123   ← MUDE ANTES DE PUBLICAR!

COMO MUDAR A SENHA:
───────────────────
1. Abra o admin/index.html em um editor
2. Abra o console do navegador
3. Execute: sha256("suaNovaSenha").then(console.log)
4. Substitua o valor em CREDENTIALS.passwordHash

O QUE O PAINEL MOSTRA:
───────────────────────
✅ Total de visitas e visitas de hoje
✅ Produtos mais clicados e mais pedidos
✅ Cliques no WhatsApp (intenções de compra)
✅ Feedbacks com avaliação em estrelas
✅ Gráficos interativos (Chart.js)
✅ Exportação em Word (.txt), CSV e JSON

SEGURANÇA:
──────────
✅ Autenticação com hash SHA-256 (WebCrypto API)
✅ Limite de 5 tentativas de login
✅ Bloqueio de 5 minutos após exceder tentativas
✅ Sessão expira em 8 horas
✅ Bloqueio de F12, Ctrl+U, Ctrl+Shift+I
✅ Clique direito desabilitado
✅ Detecção de DevTools aberto
✅ Sanitização de HTML (XSS)
✅ Dados nunca enviados a terceiros (apenas localStorage)

VÍDEO CORRIGIDO:
────────────────
✅ autoplay + muted + playsinline (necessário para iOS)
✅ preload="metadata" (otimizado)
✅ Poster de fallback (hero-burger.jpg)
✅ Retenta reprodução no primeiro toque (Safari iOS)
✅ Aspect ratio responsivo (16:9 desktop / 4:3 mobile)

════════════════════════════════════════════════════════
