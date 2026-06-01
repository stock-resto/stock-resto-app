-- ============================================================
-- SEED — Données de démo pour le restaurant de test
-- À exécuter dans Supabase > SQL Editor APRÈS avoir créé un compte patron.
-- Cible automatiquement le premier restaurant créé.
-- Ré-exécutable sans risque : ne fait rien si des produits existent déjà.
-- ============================================================

do $$
declare
  r            uuid;
  c_verduras   uuid;
  c_carnes     uuid;
  c_abarrotes  uuid;
  c_lacteos    uuid;
  c_bebidas    uuid;
  c_mar        uuid;
  f_verdura    uuid;
  f_carne      uuid;
  f_mar        uuid;
  f_abarrote   uuid;
  f_bebida     uuid;
begin
  select id into r from public.restaurants order by created_at asc limit 1;
  if r is null then
    raise exception 'Ningún restaurante encontrado. Crea una cuenta de dueño primero.';
  end if;

  if exists (select 1 from public.produits where restaurant_id = r) then
    raise notice 'El restaurante ya tiene productos — seed omitido.';
    return;
  end if;

  -- Catégories
  insert into public.categories (restaurant_id, nom) values (r, 'Verduras')              returning id into c_verduras;
  insert into public.categories (restaurant_id, nom) values (r, 'Carnes')                returning id into c_carnes;
  insert into public.categories (restaurant_id, nom) values (r, 'Abarrotes')             returning id into c_abarrotes;
  insert into public.categories (restaurant_id, nom) values (r, 'Lácteos')               returning id into c_lacteos;
  insert into public.categories (restaurant_id, nom) values (r, 'Bebidas')               returning id into c_bebidas;
  insert into public.categories (restaurant_id, nom) values (r, 'Pescados y mariscos')   returning id into c_mar;

  -- Fournisseurs
  insert into public.fournisseurs (restaurant_id, nom, contact) values (r, 'Verdura La Terminal', '5512-3456') returning id into f_verdura;
  insert into public.fournisseurs (restaurant_id, nom, contact) values (r, 'Carnes El Novillo',   '5598-7711') returning id into f_carne;
  insert into public.fournisseurs (restaurant_id, nom, contact) values (r, 'Mariscos del Pacífico','5544-2299') returning id into f_mar;
  insert into public.fournisseurs (restaurant_id, nom, contact) values (r, 'Distribuidora Central','2233-4455') returning id into f_abarrote;
  insert into public.fournisseurs (restaurant_id, nom, contact) values (r, 'Bebidas y Más',        '5577-8800') returning id into f_bebida;

  -- Produits (stock variés pour illustrer En stock / Stock bajo / Agotado)
  insert into public.produits
    (restaurant_id, categorie_id, fournisseur_id, nom, presentation, unite, stock_actuel, stock_minimum, stock_maximum, valeur_unitaire)
  values
    (r, c_verduras,  f_verdura,  'Tomate',            'caja',    'kg', 26, 8,  40, 12.50),
    (r, c_verduras,  f_verdura,  'Cebolla',           'saco',    'kg', 7,  10, 50, 8.00),
    (r, c_verduras,  f_verdura,  'Papa',              'saco',    'kg', 34, 20, 80, 6.50),
    (r, c_verduras,  f_verdura,  'Lechuga romana',    'caja',    'unidad', 48, 12, 60, 5.00),
    (r, c_carnes,    f_carne,    'Pechuga de pollo',  'caja',    'kg', 0,  8,  35, 38.00),
    (r, c_carnes,    f_carne,    'Lomo de res',       'caja',    'kg', 9,  6,  30, 72.00),
    (r, c_carnes,    f_carne,    'Costilla de cerdo', 'caja',    'kg', 14, 6,  28, 45.00),
    (r, c_mar,       f_mar,      'Camarón',           'caja',    'kg', 2,  3,  15, 95.00),
    (r, c_mar,       f_mar,      'Filete de tilapia', 'caja',    'kg', 11, 5,  22, 48.00),
    (r, c_abarrotes, f_abarrote, 'Aceite vegetal',    'caja',    'L',  31, 10, 40, 22.00),
    (r, c_abarrotes, f_abarrote, 'Harina',            'saco',    'kg', 22, 15, 60, 7.50),
    (r, c_abarrotes, f_abarrote, 'Arroz',             'saco',    'kg', 38, 10, 45, 9.00),
    (r, c_abarrotes, f_abarrote, 'Sal',               'caja',    'kg', 1,  5,  25, 4.00),
    (r, c_abarrotes, f_abarrote, 'Café en grano',     'saco',    'kg', 17, 6,  24, 55.00),
    (r, c_lacteos,   f_abarrote, 'Mantequilla',       'caja',    'kg', 19, 8,  30, 34.00),
    (r, c_lacteos,   f_abarrote, 'Crema',             'caja',    'L',  11, 6,  28, 18.00),
    (r, c_lacteos,   f_abarrote, 'Queso fresco',      'caja',    'kg', 6,  4,  18, 42.00),
    (r, c_bebidas,   f_bebida,   'Agua con gas',      'tarima',  'L',  86, 30, 120, 6.00),
    (r, c_bebidas,   f_bebida,   'Vino blanco',       'tarima',  'L',  44, 12, 50, 65.00);

  raise notice 'Seed completado para el restaurante %', r;
end $$;
