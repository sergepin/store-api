UPDATE "products"
SET "brand" = CASE lower(btrim("brand"))
  WHEN 'logitech' THEN 'Logitech'
  WHEN 'razer' THEN 'Razer'
  WHEN 'steelseries' THEN 'SteelSeries'
  WHEN 'corsair' THEN 'Corsair'
  WHEN 'hyperx' THEN 'HyperX'
  WHEN 'lg' THEN 'LG'
  WHEN 'msi' THEN 'MSI'
  WHEN 'intel' THEN 'Intel'
  WHEN 'amd' THEN 'AMD'
  WHEN 'nvidia' THEN 'NVIDIA'
  WHEN 'samsung' THEN 'Samsung'
  WHEN 'secretlab' THEN 'Secretlab'
  WHEN 'g.skill' THEN 'G.Skill'
  WHEN 'gskill' THEN 'G.Skill'
  ELSE btrim("brand")
END
WHERE "brand" IS NOT NULL AND btrim("brand") <> '';
