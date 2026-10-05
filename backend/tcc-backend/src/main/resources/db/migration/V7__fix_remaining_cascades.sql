-- delivery_reviews.reviewer_user_id: sem cascade original
DO $$
DECLARE v_con text;
BEGIN
    SELECT conname INTO v_con FROM pg_constraint
    WHERE conrelid = 'delivery_reviews'::regclass AND contype = 'f'
      AND conkey = ARRAY(SELECT attnum FROM pg_attribute
                         WHERE attrelid = 'delivery_reviews'::regclass AND attname = 'reviewer_user_id');
    IF v_con IS NOT NULL THEN
        EXECUTE format('ALTER TABLE delivery_reviews DROP CONSTRAINT %I', v_con);
    END IF;
END $$;
ALTER TABLE delivery_reviews
    ADD CONSTRAINT delivery_reviews_reviewer_user_id_fkey
        FOREIGN KEY (reviewer_user_id) REFERENCES usuario(id_usuario) ON DELETE CASCADE;

-- academic_evaluation_acknowledgements.student_user_id: sem cascade original
DO $$
DECLARE v_con text;
BEGIN
    SELECT conname INTO v_con FROM pg_constraint
    WHERE conrelid = 'academic_evaluation_acknowledgements'::regclass AND contype = 'f'
      AND conkey = ARRAY(SELECT attnum FROM pg_attribute
                         WHERE attrelid = 'academic_evaluation_acknowledgements'::regclass AND attname = 'student_user_id');
    IF v_con IS NOT NULL THEN
        EXECUTE format('ALTER TABLE academic_evaluation_acknowledgements DROP CONSTRAINT %I', v_con);
    END IF;
END $$;
ALTER TABLE academic_evaluation_acknowledgements
    ADD CONSTRAINT academic_evaluation_acknowledgements_student_user_id_fkey
        FOREIGN KEY (student_user_id) REFERENCES usuario(id_usuario) ON DELETE CASCADE;

-- auditoria_evento.id_admin: SET NULL para preservar o log
DO $$
DECLARE v_con text;
BEGIN
    SELECT conname INTO v_con FROM pg_constraint
    WHERE conrelid = 'auditoria_evento'::regclass AND contype = 'f'
      AND conkey = ARRAY(SELECT attnum FROM pg_attribute
                         WHERE attrelid = 'auditoria_evento'::regclass AND attname = 'id_admin');
    IF v_con IS NOT NULL THEN
        EXECUTE format('ALTER TABLE auditoria_evento DROP CONSTRAINT %I', v_con);
    END IF;
END $$;
ALTER TABLE auditoria_evento ALTER COLUMN id_admin DROP NOT NULL;
ALTER TABLE auditoria_evento
    ADD CONSTRAINT auditoria_evento_id_admin_fkey
        FOREIGN KEY (id_admin) REFERENCES usuario(id_usuario) ON DELETE SET NULL;
