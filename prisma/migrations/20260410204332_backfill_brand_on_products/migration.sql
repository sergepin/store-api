UPDATE "products"
SET "brand" = split_part("name", ' ', 1)
WHERE "brand" IS NULL OR btrim("brand") = '';
