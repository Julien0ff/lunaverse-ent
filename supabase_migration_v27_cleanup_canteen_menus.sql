-- Migration v27: Nettoyage des anciens menus fantômes ou sans date de la cantine
-- Supprime les menus qui n'ont pas de date valide ou qui datent de plus de 7 jours

DELETE FROM canteen_menus 
WHERE menu_date IS NULL 
   OR menu_date < (CURRENT_DATE - INTERVAL '7 days');
