-- Banco PostgreSQL. Roda sozinho toda vez que o servidor liga (IF NOT EXISTS: não apaga nada).

-- 12 salas (turmas), cada uma com sua camisa, preço e PIX
CREATE TABLE IF NOT EXISTS salas (
  id              INTEGER PRIMARY KEY,
  cor             TEXT NOT NULL UNIQUE,
  hex             TEXT NOT NULL,
  nome            TEXT NOT NULL,
  mascote         TEXT,
  preco_centavos  INTEGER NOT NULL DEFAULT 5000 CHECK (preco_centavos >= 0),
  camisa_imagem   TEXT,                     -- imagem guardada no banco (data URL)
  pix_chave       TEXT,
  contato         TEXT,                     -- WhatsApp do representante
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id              SERIAL PRIMARY KEY,
  nome            TEXT NOT NULL,
  numero_chamada  INTEGER NOT NULL,
  sala_id         INTEGER NOT NULL REFERENCES salas(id),
  papel           TEXT NOT NULL DEFAULT 'aluno' CHECK (papel IN ('aluno','representante','adm')),
  senha_hash      TEXT,                     -- senha do aluno (scrypt, nunca em texto)
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- mesma pessoa = mesmo nome (sem diferenciar maiúscula), número, sala e papel
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_unico ON usuarios (lower(nome), numero_chamada, sala_id, papel);

CREATE TABLE IF NOT EXISTS pedidos (
  id              SERIAL PRIMARY KEY,
  usuario_id      INTEGER NOT NULL REFERENCES usuarios(id),
  sala_id         INTEGER NOT NULL REFERENCES salas(id),
  nome_camisa     TEXT NOT NULL,
  numero_camisa   INTEGER CHECK (numero_camisa IS NULL OR numero_camisa BETWEEN 0 AND 99),
  tamanho         TEXT NOT NULL CHECK (tamanho IN ('P','M','G','GG','XG')),
  preco_centavos  INTEGER NOT NULL,         -- preço no momento da compra
  status          TEXT NOT NULL DEFAULT 'aguardando_pagamento'
                  CHECK (status IN ('aguardando_pagamento','pago','entregue','cancelado')),
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pedidos_sala    ON pedidos(sala_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id);

INSERT INTO salas (id, cor, hex, nome) VALUES
 (1,'Vermelha','#e11d1d','Turma Vermelha'),(2,'Azul','#1e4fd8','Turma Azul'),
 (3,'Verde','#16a34a','Turma Verde'),(4,'Preta','#000000','Turma Preta'),
 (5,'Laranja','#f97316','Turma Laranja'),(6,'Vinho','#722f37','Turma Vinho'),
 (7,'Verde Tiffany','#0abab5','Turma Verde Tiffany'),(8,'Azul Tiffany','#81d8d0','Turma Azul Tiffany'),
 (9,'Amarela','#ffd400','Turma Amarela'),(10,'Cinza','#9ca3af','Turma Cinza'),
 (11,'Roxa','#7e22ce','Turma Roxa'),(12,'Rosa','#ec4899','Turma Rosa')
ON CONFLICT (id) DO NOTHING;
