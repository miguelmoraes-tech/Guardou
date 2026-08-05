-- Dados de exemplo para demo do Guardou.
-- Roda com segurança várias vezes: sempre limpa os pratos de HOJE cadastrados
-- por este seed (identificados pelo nome) antes de inserir de novo.
-- Fotos são placeholders do Unsplash — troque por fotos reais no /admin quando tiver.

delete from pratos_do_dia
where data = current_date
  and nome in (
    'Frango grelhado, arroz, feijão e salada',
    'Feijoada completa',
    'Estrogonofe de carne'
  );

-- 1) Bastante disponível
insert into pratos_do_dia
  (nome, descricao, preco, foto_url, quantidade_total, quantidade_reservada, data, ativo)
values (
  'Frango grelhado, arroz, feijão e salada',
  'Peito de frango grelhado no ponto, arroz soltinho, feijão caseiro e salada fresca da horta.',
  18.90,
  'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80',
  20,
  3,
  current_date,
  true
);

-- 2) Quase esgotado (4 de 5)
insert into pratos_do_dia
  (nome, descricao, preco, foto_url, quantidade_total, quantidade_reservada, data, ativo)
values (
  'Feijoada completa',
  'Feijoada tradicional com linguiça, costelinha e bacon, acompanha arroz, couve e farofa.',
  24.90,
  'https://images.unsplash.com/photo-1543353071-873f17a7a088?w=800&q=80',
  5,
  4,
  current_date,
  true
);

-- 3) Esgotado
insert into pratos_do_dia
  (nome, descricao, preco, foto_url, quantidade_total, quantidade_reservada, data, ativo)
values (
  'Estrogonofe de carne',
  'Estrogonofe cremoso de carne com champignon, servido com arroz branco e batata palha.',
  21.90,
  'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80',
  10,
  10,
  current_date,
  true
);
