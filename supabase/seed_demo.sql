-- Smart Menu — Données de démo pour /menu/demo
-- À exécuter APRÈS avoir créé un compte via l'app (inscription)
-- Remplacez USER_ID par l'UUID de votre utilisateur (Authentication > Users)

-- Exemple : activer le restaurant existant avec le slug "demo"
-- UPDATE restaurants SET slug = 'demo', name = 'Le Bistrot Démo', is_active = true
-- WHERE user_id = 'VOTRE_USER_UUID';

-- Ou créer manuellement si le trigger n'a pas tourné :
-- INSERT INTO restaurants (user_id, name, slug, is_active)
-- VALUES ('VOTRE_USER_UUID', 'Le Bistrot Démo', 'demo', true);
