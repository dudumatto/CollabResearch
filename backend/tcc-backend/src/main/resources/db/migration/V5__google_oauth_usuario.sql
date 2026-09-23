ALTER TABLE usuario
    ADD COLUMN IF NOT EXISTS google_subject VARCHAR(120),
    ADD COLUMN IF NOT EXISTS google_email VARCHAR(100),
    ADD COLUMN IF NOT EXISTS google_vinculado_em TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS uk_usuario_google_subject
    ON usuario (google_subject)
    WHERE google_subject IS NOT NULL;
