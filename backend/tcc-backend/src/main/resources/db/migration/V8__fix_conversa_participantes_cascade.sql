-- conversa_participantes.id_usuario: criada pelo JPA sem ON DELETE CASCADE
DO $$
DECLARE v_con text;
BEGIN
    SELECT conname INTO v_con FROM pg_constraint
    WHERE conrelid = 'conversa_participantes'::regclass AND contype = 'f'
      AND conkey = ARRAY(SELECT attnum FROM pg_attribute
                         WHERE attrelid = 'conversa_participantes'::regclass AND attname = 'id_usuario');
    IF v_con IS NOT NULL THEN
        EXECUTE format('ALTER TABLE conversa_participantes DROP CONSTRAINT %I', v_con);
    END IF;
END $$;
ALTER TABLE conversa_participantes
    ADD CONSTRAINT conversa_participantes_id_usuario_fkey
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE;
