-- =====================================================================
-- Saída Fácil – dados de teste
-- Logins: coord / coord123   |   2024001, 2024002, 2024003 / aluno123
-- =====================================================================
INSERT OR IGNORE INTO usuarios (matricula, nome, salt, hash, perfil_id) VALUES
  ('coord',   'Coordenação', 'salttest0001', '0f251d59d6f06e249b196f25f8a57e4f6996d18d4d6c1fdc6d65b353b0b7557a', 2),
  ('2024001', 'Ana Souza',   'salttest0002', '2528dc53ce9cd553a7597874265bc2fceae23294a9e9582f5e0ac0b3e79c5119', 1),
  ('2024002', 'Bruno Lima',  'salttest0002', '2528dc53ce9cd553a7597874265bc2fceae23294a9e9582f5e0ac0b3e79c5119', 1),
  ('2024003', 'Carla Mendes','salttest0002', '2528dc53ce9cd553a7597874265bc2fceae23294a9e9582f5e0ac0b3e79c5119', 1);

INSERT INTO pedidos (aluno_id, motivo_id, status_id, data_pedido, hora_saida, hora_retorno, responsavel, observacao, criado_em, decidido_em, decidido_por) VALUES
  ((SELECT id FROM usuarios WHERE matricula='2024001'),  1, 2, '2026-10-20', '10:30', NULL,    'Maria Souza',   '',                             '2026-10-19 18:00:00', '2026-10-19 20:10:00', (SELECT id FROM usuarios WHERE matricula='coord')),
  ((SELECT id FROM usuarios WHERE matricula='2024001'),  6, 2, '2026-11-04', '11:00', '13:30',   'Maria Souza',   '',                             '2026-11-03 19:00:00', '2026-11-03 21:00:00', (SELECT id FROM usuarios WHERE matricula='coord')),
  ((SELECT id FROM usuarios WHERE matricula='2024002'),  3, 3, '2026-11-03', '09:50', NULL,    'José Lima',     'Dor de cabeça',                '2026-11-03 08:40:00', '2026-11-03 09:00:00', (SELECT id FROM usuarios WHERE matricula='coord')),
  ((SELECT id FROM usuarios WHERE matricula='2024002'), 10, 1, '2026-11-10', NULL,    NULL,    'José Lima',     'Maquete da feira de ciências', '2026-11-06 07:30:00', NULL, NULL),
  ((SELECT id FROM usuarios WHERE matricula='2024003'),  7, 1, '2026-11-09', '14:00', '15:00',   'Paula Mendes',  '',                             '2026-11-06 08:15:00', NULL, NULL),
  ((SELECT id FROM usuarios WHERE matricula='2024003'),  9, 2, '2026-11-05', NULL,    NULL,    'Paula Mendes',  '',                             '2026-11-04 17:20:00', '2026-11-04 18:00:00', (SELECT id FROM usuarios WHERE matricula='coord'));