ALTER TABLE mensagem ADD COLUMN IF NOT EXISTS data_leitura TIMESTAMP WITH TIME ZONE;
UPDATE mensagem SET data_leitura = COALESCE(data_envio, now()) WHERE data_leitura IS NULL;
