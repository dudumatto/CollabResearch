-- project_deliveries.author_user_id: adiciona ON DELETE CASCADE
DO $$
DECLARE v_con text;
BEGIN
    SELECT conname INTO v_con FROM pg_constraint
    WHERE conrelid = 'project_deliveries'::regclass AND contype = 'f'
      AND conkey = ARRAY(SELECT attnum FROM pg_attribute
                         WHERE attrelid = 'project_deliveries'::regclass AND attname = 'author_user_id');
    IF v_con IS NOT NULL THEN
        EXECUTE format('ALTER TABLE project_deliveries DROP CONSTRAINT %I', v_con);
    END IF;
END $$;
ALTER TABLE project_deliveries
    ADD CONSTRAINT project_deliveries_author_user_id_fkey
        FOREIGN KEY (author_user_id) REFERENCES usuario(id_usuario) ON DELETE CASCADE;

-- academic_evaluations.student_id: adiciona ON DELETE CASCADE
DO $$
DECLARE v_con text;
BEGIN
    SELECT conname INTO v_con FROM pg_constraint
    WHERE conrelid = 'academic_evaluations'::regclass AND contype = 'f'
      AND conkey = ARRAY(SELECT attnum FROM pg_attribute
                         WHERE attrelid = 'academic_evaluations'::regclass AND attname = 'student_id');
    IF v_con IS NOT NULL THEN
        EXECUTE format('ALTER TABLE academic_evaluations DROP CONSTRAINT %I', v_con);
    END IF;
END $$;
ALTER TABLE academic_evaluations
    ADD CONSTRAINT academic_evaluations_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES aluno(id_aluno) ON DELETE CASCADE;

-- academic_evaluations.advisor_id: adiciona ON DELETE CASCADE
DO $$
DECLARE v_con text;
BEGIN
    SELECT conname INTO v_con FROM pg_constraint
    WHERE conrelid = 'academic_evaluations'::regclass AND contype = 'f'
      AND conkey = ARRAY(SELECT attnum FROM pg_attribute
                         WHERE attrelid = 'academic_evaluations'::regclass AND attname = 'advisor_id');
    IF v_con IS NOT NULL THEN
        EXECUTE format('ALTER TABLE academic_evaluations DROP CONSTRAINT %I', v_con);
    END IF;
END $$;
ALTER TABLE academic_evaluations
    ADD CONSTRAINT academic_evaluations_advisor_id_fkey
        FOREIGN KEY (advisor_id) REFERENCES orientador(id_orientador) ON DELETE CASCADE;
