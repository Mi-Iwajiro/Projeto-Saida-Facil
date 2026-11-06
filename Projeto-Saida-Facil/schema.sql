-- =====================================================================
-- Saída Fácil – criação das tabelas (modelo normalizado até a 3ª FN)
-- Banco: SQLite
-- =====================================================================
PRAGMA foreign_keys = ON;

-- Perfis de acesso (aluno, coordenação)
CREATE TABLE IF NOT EXISTS perfis (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  nome  TEXT NOT NULL UNIQUE
);

-- Pessoas que usam o sistema (alunos e coordenação)
CREATE TABLE IF NOT EXISTS usuarios (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  matricula  TEXT NOT NULL UNIQUE,
  nome       TEXT NOT NULL,
  salt       TEXT NOT NULL,
  hash       TEXT NOT NULL,
  perfil_id  INTEGER NOT NULL REFERENCES perfis(id)
);

-- Tipos de pedido (sair, sair e voltar, ficar no contraturno)
CREATE TABLE IF NOT EXISTS tipos_pedido (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  nome  TEXT NOT NULL UNIQUE
);

-- Motivos disponíveis para cada tipo de pedido
CREATE TABLE IF NOT EXISTS motivos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo_id    INTEGER NOT NULL REFERENCES tipos_pedido(id),
  descricao  TEXT NOT NULL,
  UNIQUE (tipo_id, descricao)
);

-- Situação do pedido (pendente, aprovado, recusado)
CREATE TABLE IF NOT EXISTS status_pedido (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  nome  TEXT NOT NULL UNIQUE
);

-- Pedidos feitos pelos alunos
-- (o tipo do pedido é obtido pelo motivo, evitando dependência transitiva)
CREATE TABLE IF NOT EXISTS pedidos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  aluno_id      INTEGER NOT NULL REFERENCES usuarios(id),
  motivo_id     INTEGER NOT NULL REFERENCES motivos(id),
  status_id     INTEGER NOT NULL DEFAULT 1 REFERENCES status_pedido(id),
  data_pedido   TEXT NOT NULL,
  hora_saida    TEXT,                -- vazio em "Ficar no contraturno"
  hora_retorno  TEXT,                -- só em "Sair e voltar"
  responsavel   TEXT NOT NULL,       -- quem autorizou
  observacao    TEXT NOT NULL DEFAULT '',
  criado_em     TEXT NOT NULL DEFAULT (datetime('now')),
  decidido_em   TEXT,
  decidido_por  INTEGER REFERENCES usuarios(id)   -- coordenação que decidiu
);

-- Dados de referência (fixos)
INSERT OR IGNORE INTO perfis (id, nome) VALUES (1,'aluno'), (2,'coord');
INSERT OR IGNORE INTO status_pedido (id, nome) VALUES (1,'Pendente'), (2,'Aprovado'), (3,'Recusado');
INSERT OR IGNORE INTO tipos_pedido (id, nome) VALUES (1,'Sair da escola'), (2,'Sair e voltar'), (3,'Ficar no contraturno');
INSERT OR IGNORE INTO motivos (id, tipo_id, descricao) VALUES
  (1,1,'Consulta médica'), (2,1,'Compromisso familiar'), (3,1,'Mal-estar'), (4,1,'Outro'),
  (5,2,'Consulta médica rápida'), (6,2,'Almoço em casa'), (7,2,'Compromisso rápido'), (8,2,'Outro'),
  (9,3,'Aula de reforço'), (10,3,'Projeto escolar'), (11,3,'Biblioteca / estudo'), (12,3,'Treino esportivo');