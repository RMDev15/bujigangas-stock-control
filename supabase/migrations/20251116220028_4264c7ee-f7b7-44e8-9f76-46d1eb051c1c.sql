-- Ensure required extension for password hashing
create extension if not exists pgcrypto;

-- Seed or update Master Admin user and ensure profile has full permissions
DO $$
DECLARE
  uid UUID;
BEGIN
  -- Find existing user by email
  SELECT id INTO uid FROM auth.users WHERE email = 'ramonmatos390@gmail.com';

  IF uid IS NULL THEN
    -- Create the master user with confirmed email
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'ramonmatos390@gmail.com',
      crypt('M@415263s', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"nome":"Master Admin"}',
      NOW(),
      NOW(),
      '',
      ''
    ) RETURNING id INTO uid;
  ELSE
    -- Update password and confirm email
    UPDATE auth.users
      SET encrypted_password = crypt('M@415263s', gen_salt('bf')),
          email_confirmed_at = NOW(),
          updated_at = NOW()
      WHERE id = uid;
  END IF;

  -- Upsert the profile with full permissions expected by the app
  INSERT INTO public.profiles (id, nome, email, senha_temporaria, tipo_acesso, permissoes)
  VALUES (
    uid,
    'Master Admin',
    'ramonmatos390@gmail.com',
    FALSE,
    'admin',
    '{
      "visualizar_estoque": true,
      "visualizar_alertas": true,
      "visualizar_cadastro": true,
      "visualizar_terminal": true,
      "visualizar_pedidos": true,
      "editar_valores": true,
      "editar_alertas": true,
      "editar_estoque": true,
      "editar_pedidos": true,
      "gerenciar_admin": true
    }'::jsonb
  )
  ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    senha_temporaria = EXCLUDED.senha_temporaria,
    tipo_acesso = EXCLUDED.tipo_acesso,
    permissoes = EXCLUDED.permissoes,
    updated_at = NOW();
END $$;