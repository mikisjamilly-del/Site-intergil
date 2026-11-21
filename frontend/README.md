# Camisas do Intergil

```
camisas-intergil/
├── frontend/
│   ├── index.html        página única (só estrutura)
│   ├── css/style.css     todo o visual
│   ├── assets/
│   │   └── mascote.png   imagem do mascote (veja abaixo)
│   └── js/
│       ├── config.js     turmas, papéis, tamanhos, senhas
│       ├── utils.js      funções pequenas ($, esc)
│       ├── storage.js    dados (localStorage hoje; API amanhã)
│       ├── sprites.js    desenhos em pixel art
│       ├── mascote.js    fala do mascote
│       ├── telas.js      HTML de cada tela
│       ├── eventos.js    cliques e formulários de cada tela
│       └── app.js        estado, navegação e início
└── backend/              API + banco de dados (SQLite)
```

Abra `frontend/index.html` no navegador para testar.

## Mascote
Salve a imagem do mascote em `frontend/assets/mascote.png`
(no site antigo: botão direito no mascote > Salvar imagem como).
