-- Seed memasukkan id eksplisit; sequence BIGSERIAL tidak naik → INSERT berikutnya bisa bentrok pkey.

SELECT setval(
  pg_get_serial_sequence('animal_trackings', 'id'),
  CASE WHEN EXISTS (SELECT 1 FROM animal_trackings LIMIT 1)
    THEN (SELECT MAX(id) FROM animal_trackings) ELSE 1 END,
  EXISTS (SELECT 1 FROM animal_trackings LIMIT 1)
);

SELECT setval(
  pg_get_serial_sequence('delivery_manifests', 'id'),
  CASE WHEN EXISTS (SELECT 1 FROM delivery_manifests LIMIT 1)
    THEN (SELECT MAX(id) FROM delivery_manifests) ELSE 1 END,
  EXISTS (SELECT 1 FROM delivery_manifests LIMIT 1)
);

SELECT setval(
  pg_get_serial_sequence('logistics_trips', 'id'),
  CASE WHEN EXISTS (SELECT 1 FROM logistics_trips LIMIT 1)
    THEN (SELECT MAX(id) FROM logistics_trips) ELSE 1 END,
  EXISTS (SELECT 1 FROM logistics_trips LIMIT 1)
);

SELECT setval(
  pg_get_serial_sequence('farm_inventories', 'id'),
  CASE WHEN EXISTS (SELECT 1 FROM farm_inventories LIMIT 1)
    THEN (SELECT MAX(id) FROM farm_inventories) ELSE 1 END,
  EXISTS (SELECT 1 FROM farm_inventories LIMIT 1)
);
