"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CheckCircle,
  Eye,
  EyeOff,
  FlaskConical,
  GraduationCap,
  Hash,
  Lock,
  Mail,
  Sparkles,
  User,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import AuthShell from "../components/AuthShell";
import { Badge, Button, TextField } from "../components/ui";

const institutions = [
  "Universidade Federal do Brasil (UFB)",
  "Universidade Estadual de Sao Paulo (UNESP)",
  "Universidade de Sao Paulo (USP)",
  "Universidade Federal de Minas Gerais (UFMG)",
  "Pontificia Universidade Catolica (PUC)",
  "Outra",
];

const institutionLabels = {
  "Universidade Estadual de Sao Paulo (UNESP)": "Universidade Estadual de São Paulo (UNESP)",
  "Universidade de Sao Paulo (USP)": "Universidade de São Paulo (USP)",
  "Pontificia Universidade Catolica (PUC)": "Pontifícia Universidade Católica (PUC)",
};

const academicTitleLabels = {
  "Pos-doutor": "Pós-doutor",
};

const registerHighlights = [
  {
    title: "Cadastro em três passos",
    description: "Perfil, dados pessoais e contexto acadêmico sem ruído.",
    icon: <CheckCircle size={16} />,
  },
  {
    title: "Aluno ou orientador",
    description: "Campos adaptados ao papel selecionado.",
    icon: <GraduationCap size={16} />,
  },
  {
    title: "Base pronta para o painel",
    description: "Após criar a conta, o fluxo segue direto para o app.",
    icon: <Sparkles size={16} />,
  },
];

const formatInstitutionLabel = (institution) => institutionLabels[institution] || institution;
const formatAcademicTitleLabel = (title) => academicTitleLabels[title] || title;

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    institution: "",
    semester: "",
    ra: "",
    department: "",
    academicTitle: "",
  });

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleNext = () => {
    setError("");
    if (step === 2 && form.password !== form.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (step === 2 && userType === "student" && !form.ra.trim()) {
      setError("Informe o RA para continuar.");
      return;
    }
    if (step < 3) setStep(step + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (userType === "student" && !form.ra.trim()) {
      setError("Informe o RA para criar sua conta.");
      return;
    }
    if (userType === "advisor" && (!form.department.trim() || !form.academicTitle.trim())) {
      setError("Informe departamento e titulação para criar a conta de orientador.");
      return;
    }
    setLoading(true);

    try {
      const payload = {
        nome: form.name,
        email: form.email,
        senha: form.password,
        instituicao: form.institution,
        tipo: userType === "advisor" ? "ORIENTADOR" : "ALUNO",
      };

      if (userType === "advisor") {
        payload.departamento = form.department;
        payload.titulacao = form.academicTitle;
      } else {
        payload.ra = form.ra;
        payload.semestre = form.semester ? Number(form.semester) : undefined;
      }

      await register(payload);
      router.push("/app");
    } catch (err) {
      setError(err.message || "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  };

  const stepLabel = (value) => {
    if (value === 1) return "Tipo de conta";
    if (value === 2) return "Dados pessoais";
    return userType === "advisor" ? "Dados profissionais" : "Informações acadêmicas";
  };

  return (
    <AuthShell
      className="pagina-cadastro"
      eyebrow="Novo cadastro"
      title="Criar sua conta"
      description="Configure o acesso com as informações essenciais para entrar no fluxo de TCC."
      sideTitle="Comece com uma base limpa para orientar ou desenvolver pesquisa."
      sideDescription="O cadastro mantém a experiência objetiva, com etapas curtas e escolhas claras para cada perfil."
      sideItems={registerHighlights}
      wide
      footer={
        <span>
          Já tem conta? <Link href="/login">Fazer login</Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="cadastro-form">
        <div className="pagina-cadastro__progresso" aria-label="Etapas do cadastro">
          {[1, 2, 3].map((s) => (
            <div key={s} className="pagina-cadastro__passo">
              <div className={`pagina-cadastro__circulo-passo ${s <= step ? "pagina-cadastro__circulo-passo--ativo" : "pagina-cadastro__circulo-passo--inativo"}`}>
                {s < step ? <CheckCircle size={14} /> : s}
              </div>
              <span className={`pagina-cadastro__label-passo ${s === step ? "pagina-cadastro__label-passo--ativo" : "pagina-cadastro__label-passo--inativo"}`}>
                {stepLabel(s)}
              </span>
              {s < 3 ? <div className={`pagina-cadastro__linha-passo ${s < step ? "pagina-cadastro__linha-passo--ativa" : "pagina-cadastro__linha-passo--inativa"}`} /> : null}
            </div>
          ))}
        </div>

        {step === 1 && (
          <section className="cadastro-step" aria-labelledby="cadastro-step-tipo">
            <div className="cadastro-step__cabecalho">
              <Badge tone="brand" size="sm">Etapa 1</Badge>
              <h2 id="cadastro-step-tipo" className="cadastro-step__titulo">Como você vai usar a plataforma?</h2>
              <p className="cadastro-step__subtitulo">Escolha o tipo de conta que melhor descreve seu papel.</p>
            </div>

            <div className="cadastro-tipo__grade">
              {[
                {
                  type: "student",
                  icon: <GraduationCap size={22} />,
                  name: "Aluno",
                  description: "Busco projetos de IC para participar",
                },
                {
                  type: "advisor",
                  icon: <FlaskConical size={22} />,
                  name: "Orientador",
                  description: "Tenho projetos e quero orientar alunos",
                },
              ].map((option) => {
                const selected = userType === option.type;
                return (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => setUserType(option.type)}
                    className={`cadastro-tipo__opcao ${selected ? "cadastro-tipo__opcao--selecionado" : "cadastro-tipo__opcao--disponivel"}`}
                    aria-pressed={selected}
                  >
                    <span className="cadastro-tipo__icone" aria-hidden="true">{option.icon}</span>
                    <span className="cadastro-tipo__texto">
                      <span className="cadastro-tipo__nome">{option.name}</span>
                      <span className="cadastro-tipo__descricao">{option.description}</span>
                    </span>
                    {selected ? (
                      <Badge tone="brand" size="sm" icon={<CheckCircle size={12} />}>
                        Selecionado
                      </Badge>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <Button type="button" variant="primary" size="lg" fullWidth onClick={handleNext} rightIcon={<ArrowRight size={17} />}>
              Continuar
            </Button>
          </section>
        )}

        {step === 2 && (
          <section className="cadastro-step" aria-labelledby="cadastro-step-pessoais">
            <div className="cadastro-step__cabecalho">
              <Badge tone="brand" size="sm">Etapa 2</Badge>
              <h2 id="cadastro-step-pessoais" className="cadastro-step__titulo">Dados pessoais</h2>
              <p className="cadastro-step__subtitulo">Preencha suas informações básicas.</p>
            </div>

            <div className="auth-form__grid cadastro-campos">
              <TextField
                label="Nome completo"
                leftIcon={<User size={16} />}
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Seu nome completo"
                autoComplete="name"
                required
              />

              <TextField
                label="E-mail institucional"
                leftIcon={<Mail size={16} />}
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="seu@universidade.br"
                autoComplete="email"
                required
              />

              {userType === "student" ? (
                <TextField
                  label="RA"
                  leftIcon={<Hash size={16} />}
                  type="text"
                  value={form.ra}
                  onChange={(e) => update("ra", e.target.value)}
                  placeholder="Seu registro acadêmico"
                  required
                />
              ) : null}

              <TextField
                label="Senha"
                leftIcon={<Lock size={16} />}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="auth-password-toggle"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                required
              />

              <TextField
                label="Confirmar senha"
                leftIcon={<Lock size={16} />}
                type="password"
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
                placeholder="Repita a senha"
                autoComplete="new-password"
                required
              />
            </div>

            {error ? (
              <p className="cadastro-form__error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="cadastro-step__acoes">
              <Button type="button" variant="secondary" size="md" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button type="button" variant="primary" size="md" onClick={handleNext} rightIcon={<ArrowRight size={15} />}>
                Continuar
              </Button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="cadastro-step" aria-labelledby="cadastro-step-final">
            <div className="cadastro-step__cabecalho">
              <Badge tone="brand" size="sm">Etapa 3</Badge>
              <h2 id="cadastro-step-final" className="cadastro-step__titulo">
                {userType === "advisor" ? "Dados profissionais" : "Informações acadêmicas"}
              </h2>
              <p className="cadastro-step__subtitulo">
                {userType === "advisor"
                  ? "Esses dados identificam sua área de orientação."
                  : "Esses dados ajudam na organização do perfil."}
              </p>
            </div>

            <div className="auth-form__grid cadastro-campos">
              <div className="auth-select-field auth-form__full">
                <label htmlFor="institution">Instituição de ensino</label>
                <div className="auth-select-shell auth-select-shell--with-icon">
                  <Building2 size={16} className="auth-select-icon" aria-hidden="true" />
                  <select
                    id="institution"
                    value={form.institution}
                    onChange={(e) => update("institution", e.target.value)}
                    className="campo-cadastro__select"
                    required
                  >
                    <option value="">Selecione sua instituição</option>
                    {institutions.map((institution) => (
                      <option key={institution} value={institution}>
                        {formatInstitutionLabel(institution)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {userType === "advisor" ? (
                <>
                  <TextField
                    label="Departamento"
                    leftIcon={<Building2 size={16} />}
                    type="text"
                    value={form.department}
                    onChange={(e) => update("department", e.target.value)}
                    placeholder="Ex: Computação"
                    required
                  />

                  <div className="auth-select-field">
                    <label htmlFor="academicTitle">Titulação</label>
                    <div className="auth-select-shell">
                      <select
                        id="academicTitle"
                        value={form.academicTitle}
                        onChange={(e) => update("academicTitle", e.target.value)}
                        className="campo-cadastro__select"
                        required
                      >
                        <option value="">Selecione a titulação</option>
                        {["Especialista", "Mestre", "Doutor", "Pos-doutor"].map((title) => (
                          <option key={title} value={title}>
                            {formatAcademicTitleLabel(title)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="cadastro-note auth-form__full">
                    O curso será definido pela administração após a criação da conta.
                  </div>

                  <div className="auth-select-field">
                    <label htmlFor="semester">Semestre atual</label>
                    <div className="auth-select-shell">
                      <select
                        id="semester"
                        value={form.semester}
                        onChange={(e) => update("semester", e.target.value)}
                        className="campo-cadastro__select"
                      >
                        <option value="">Selecione o semestre</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((semester) => (
                          <option key={semester} value={semester}>
                            {semester}º semestre
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="cadastro-form__terms auth-form__full">
                <input type="checkbox" id="terms" className="campo-cadastro__checkbox" required />
                <label htmlFor="terms">
                  Concordo com os <a href="#">Termos de Uso</a> e a <a href="#">Política de Privacidade</a>
                </label>
              </div>
            </div>

            {error ? (
              <p className="cadastro-form__error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="cadastro-step__acoes">
              <Button type="button" variant="secondary" size="md" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                disabled={loading}
                rightIcon={!loading ? <ArrowRight size={15} /> : null}
              >
                {loading ? "Criando..." : "Criar conta"}
              </Button>
            </div>
          </section>
        )}
      </form>
    </AuthShell>
  );
}
