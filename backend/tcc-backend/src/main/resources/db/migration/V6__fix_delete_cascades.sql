-- project_deliveries.author_user_id: adiciona ON DELETE CASCADE
ALTER TABLE project_deliveries
    DROP CONSTRAINT project_deliveries_author_user_id_fkey,
    ADD CONSTRAINT project_deliveries_author_user_id_fkey
        FOREIGN KEY (author_user_id) REFERENCES usuario(id_usuario) ON DELETE CASCADE;

-- academic_evaluations.student_id: adiciona ON DELETE CASCADE
ALTER TABLE academic_evaluations
    DROP CONSTRAINT academic_evaluations_student_id_fkey,
    ADD CONSTRAINT academic_evaluations_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES aluno(id_aluno) ON DELETE CASCADE;

-- academic_evaluations.advisor_id: adiciona ON DELETE CASCADE
ALTER TABLE academic_evaluations
    DROP CONSTRAINT academic_evaluations_advisor_id_fkey,
    ADD CONSTRAINT academic_evaluations_advisor_id_fkey
        FOREIGN KEY (advisor_id) REFERENCES orientador(id_orientador) ON DELETE CASCADE;
