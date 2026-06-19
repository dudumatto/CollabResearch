BEGIN;

WITH default_courses(nome) AS (
    VALUES
        ('Ciência da Computação'),
        ('Engenharia de Computação'),
        ('Sistemas de Informação'),
        ('Licenciatura em Computação'),
        ('Engenharia Elétrica')
)
INSERT INTO public.curso (nome)
SELECT defaults.nome
FROM default_courses defaults
WHERE NOT EXISTS (
    SELECT 1
    FROM public.curso curso
    WHERE LOWER(curso.nome) = LOWER(defaults.nome)
);

WITH default_areas(nome, curso_nome) AS (
    VALUES
        ('Ciência da Computação', 'Ciência da Computação'),
        ('Engenharia de Computação', 'Engenharia de Computação'),
        ('Sistemas de Informação', 'Sistemas de Informação'),
        ('Licenciatura em Computação', 'Licenciatura em Computação'),
        ('Engenharia Elétrica', 'Engenharia Elétrica')
)
INSERT INTO public.area_pesquisa (nome, id_curso)
SELECT defaults.nome, curso.id_curso
FROM default_areas defaults
JOIN public.curso curso ON LOWER(curso.nome) = LOWER(defaults.curso_nome)
WHERE NOT EXISTS (
    SELECT 1
    FROM public.area_pesquisa area
    WHERE LOWER(area.nome) = LOWER(defaults.nome)
      AND area.id_curso = curso.id_curso
);

COMMIT;
