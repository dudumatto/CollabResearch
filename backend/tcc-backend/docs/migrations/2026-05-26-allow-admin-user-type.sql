BEGIN;

ALTER TABLE public.usuario
    DROP CONSTRAINT IF EXISTS usuario_tipo_check;

ALTER TABLE public.usuario
    ADD CONSTRAINT usuario_tipo_check
    CHECK (tipo IN ('ALUNO', 'ORIENTADOR', 'ADMIN'));

COMMIT;
