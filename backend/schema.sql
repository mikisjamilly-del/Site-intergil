-- Camisas do Intergil - banco MySQL (8.0 ou superior; MariaDB 10.5+ também serve)
-- Como usar: abra este arquivo no VS Code, conecte no seu MySQL e execute tudo (Run Query).
-- Pode rodar de novo sem medo: nada é apagado.

CREATE DATABASE IF NOT EXISTS intergil CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE intergil;

-- 12 salas (turmas), cada uma com sua camisa, preço e PIX
CREATE TABLE IF NOT EXISTS salas (
  id              INT PRIMARY KEY,
  cor             VARCHAR(30)  NOT NULL UNIQUE,            -- "Vermelha", "Azul"...
  hex             CHAR(7)      NOT NULL,                   -- "#e11d1d"
  nome            VARCHAR(60)  NOT NULL,                   -- "Turma Vermelha" (editável)
  mascote         VARCHAR(255) NULL,
  preco_centavos  INT UNSIGNED NOT NULL DEFAULT 5000,
  camisa_imagem   VARCHAR(255) NULL,                       -- caminho do arquivo (não base64)
  pix_chave       VARCHAR(140) NULL,
  contato         VARCHAR(30)  NULL,                       -- WhatsApp do representante
  atualizado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cada cadastro. A senha do aluno é guardada só como resumo (scrypt), nunca em texto.
CREATE TABLE IF NOT EXISTS usuarios (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  nome             VARCHAR(100) NOT NULL,
  numero_chamada   INT NOT NULL,
  sala_id          INT NOT NULL,
  papel            ENUM('aluno','representante','adm') NOT NULL DEFAULT 'aluno',
  senha_hash       VARCHAR(200) NULL,                      -- só alunos
  criado_em        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_conta (nome, numero_chamada, sala_id, papel),   -- não existe conta repetida
  CONSTRAINT fk_usuarios_sala FOREIGN KEY (sala_id) REFERENCES salas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cada compra
CREATE TABLE IF NOT EXISTS pedidos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id      INT NOT NULL,
  sala_id         INT NOT NULL,
  nome_camisa     VARCHAR(20) NOT NULL,
  tamanho         ENUM('P','M','G','GG','XG') NOT NULL,
  preco_centavos  INT UNSIGNED NOT NULL,                   -- preço no momento da compra
  status          ENUM('aguardando_pagamento','pago','entregue','cancelado') NOT NULL DEFAULT 'aguardando_pagamento',
  criado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_pedidos_sala (sala_id),
  KEY idx_pedidos_usuario (usuario_id),
  CONSTRAINT fk_pedidos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  CONSTRAINT fk_pedidos_sala    FOREIGN KEY (sala_id)    REFERENCES salas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cada aviso de pagamento. O aluno avisa que pagou (informado);
-- o representante confere e marca como confirmado ou recusado.
CREATE TABLE IF NOT EXISTS pagamentos (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id            INT NOT NULL,
  usuario_id           INT NOT NULL,                       -- quem pagou
  valor_centavos       INT UNSIGNED NOT NULL,
  metodo               ENUM('pix','dinheiro') NOT NULL DEFAULT 'pix',
  pix_chave_usada      VARCHAR(140) NULL,                  -- chave da sala na hora do pagamento
  comprovante_arquivo  VARCHAR(255) NULL,                  -- nome do arquivo (pasta privada)
  status               ENUM('informado','confirmado','recusado') NOT NULL DEFAULT 'informado',
  observacao           VARCHAR(255) NULL,                  -- motivo, se recusado
  informado_em         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  conferido_por        INT NULL,                           -- representante ou adm
  conferido_em         DATETIME NULL,
  -- MySQL não tem índice único "parcial", então usamos colunas calculadas:
  -- no máximo 1 pagamento aguardando conferência e 1 confirmado por pedido.
  chave_aberto      INT GENERATED ALWAYS AS (IF(status = 'informado',  pedido_id, NULL)) STORED,
  chave_confirmado  INT GENERATED ALWAYS AS (IF(status = 'confirmado', pedido_id, NULL)) STORED,
  UNIQUE KEY uq_pagamento_aberto     (chave_aberto),
  UNIQUE KEY uq_pagamento_confirmado (chave_confirmado),
  KEY idx_pagamentos_pedido (pedido_id),
  CONSTRAINT fk_pagamentos_pedido  FOREIGN KEY (pedido_id)     REFERENCES pedidos(id),
  CONSTRAINT fk_pagamentos_usuario FOREIGN KEY (usuario_id)    REFERENCES usuarios(id),
  CONSTRAINT fk_pagamentos_conf    FOREIGN KEY (conferido_por) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quem mudou o status de cada pedido, e quando
CREATE TABLE IF NOT EXISTS historico_pedidos (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id        INT NOT NULL,
  status_anterior  VARCHAR(30) NULL,
  status_novo      VARCHAR(30) NOT NULL,
  usuario_id       INT NULL,
  em               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_historico_pedido (pedido_id),
  CONSTRAINT fk_historico_pedido  FOREIGN KEY (pedido_id)  REFERENCES pedidos(id),
  CONSTRAINT fk_historico_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO salas (id, cor, hex, nome) VALUES
 (1,'Vermelha','#e11d1d','Turma Vermelha'),(2,'Azul','#1e4fd8','Turma Azul'),
 (3,'Verde','#16a34a','Turma Verde'),(4,'Preta','#000000','Turma Preta'),
 (5,'Laranja','#f97316','Turma Laranja'),(6,'Vinho','#722f37','Turma Vinho'),
 (7,'Verde Tiffany','#0abab5','Turma Verde Tiffany'),(8,'Azul Tiffany','#81d8d0','Turma Azul Tiffany'),
 (9,'Amarela','#ffd400','Turma Amarela'),(10,'Cinza','#9ca3af','Turma Cinza'),
 (11,'Roxa','#7e22ce','Turma Roxa'),(12,'Rosa','#ec4899','Turma Rosa');
