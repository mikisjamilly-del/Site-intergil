# Camisas do Intergil

```
camisas-intergil/
├── render.yaml      receita de publicação (site + banco de dados em um clique)
├── frontend/        o site (HTML, CSS e JS puro)
└── backend/         servidor Node + banco PostgreSQL (também entrega o site)
```

## Publicar (resumo)
1. Envie esta pasta para um repositório no GitHub (o `.env` não vai: está no .gitignore).
2. No render.com: **New → Blueprint** → escolha o repositório → digite `SENHA_REPRESENTANTE` e `SENHA_ADM` → **Apply**.
3. Quando terminar, abra o endereço `https://camisas-intergil.onrender.com` (o Render mostra o endereço exato).

Se preferir um banco que não expira, crie um PostgreSQL grátis em outro serviço (ex.: Neon), copie o endereço de conexão
e use-o como `DATABASE_URL` (veja `backend/.env.example`).

## Variáveis (cadastradas no painel da hospedagem)
| Variável | Para que serve |
|---|---|
| `DATABASE_URL` | endereço do banco PostgreSQL |
| `JWT_SECRET` | segredo do login (o Render gera sozinho) |
| `SENHA_REPRESENTANTE` | senha de entrada dos representantes |
| `SENHA_ADM` | senha de entrada da administração |

## Testar no seu computador (opcional)
Precisa do Node 20+ e de um PostgreSQL (pode usar o mesmo endereço do Neon).
```
cd backend
cp .env.example .env     # preencha o .env
npm install
npm run dev              # http://localhost:3000
```

## Camisas
Cada representante envia a imagem da camisa pelo Painel; ela fica guardada no banco, então não some quando o servidor reinicia.
