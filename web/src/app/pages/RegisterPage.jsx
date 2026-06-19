import { useState } from "react";
import { useNavigate, Link } from "react-router";
import {
  FlaskConical,
  GraduationCap,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building2,
  ArrowRight,
  CheckCircle,
  Hash,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import "./RegisterPage.css";

const institutions = [
  "Universidade Federal do Brasil (UFB)",
  "Universidade Estadual de Sao Paulo (UNESP)",
  "Universidade de Sao Paulo (USP)",
  "Universidade Federal de Minas Gerais (UFMG)",
  "Pontificia Universidade Catolica (PUC)",
  "Outra",
];

export default function RegisterPage() {
  const navigate = useNavigate();
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
      navigate("/app");
    } catch (err) {
      setError(err.message || "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pagina-cadastro">
      <div className="pagina-cadastro__container">
        <div className="pagina-cadastro__cabecalho">
          <Link to="/" className="pagina-cadastro__logo-link">
            <div className="pagina-cadastro__logo-icone">
              <FlaskConical size={18} style={{ color: "white" }} />
            </div>
            <span className="pagina-cadastro__logo-nome">CollabResearch</span>
          </Link>
          <h1 className="pagina-cadastro__titulo">Criar sua conta</h1>
          <p className="pagina-cadastro__subtitulo">Junte-se à plataforma de iniciação científica</p>
        </div>

        <div className="pagina-cadastro__progresso">
          {[1, 2, 3].map((s) => (
            <div key={s} className="pagina-cadastro__passo">
              <div className={`pagina-cadastro__circulo-passo ${s <= step ? "pagina-cadastro__circulo-passo--ativo" : "pagina-cadastro__circulo-passo--inativo"}`}>
                {s < step ? <CheckCircle size={14} /> : s}
              </div>
              <span className={`pagina-cadastro__label-passo ${s === step ? "pagina-cadastro__label-passo--ativo" : "pagina-cadastro__label-passo--inativo"}`}>
                {s === 1 ? "Tipo de conta" : s === 2 ? "Dados pessoais" : userType === "advisor" ? "Dados profissionais" : "Informações acadêmicas"}
              </span>
              {s < 3 && <div className={`pagina-cadastro__linha-passo ${s < step ? "pagina-cadastro__linha-passo--ativa" : "pagina-cadastro__linha-passo--inativa"}`} />}
            </div>
          ))}
        </div>

        <div className="pagina-cadastro__painel">
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div>
                <h2 className="cadastro-step__titulo">Como você vai usar a plataforma?</h2>
                <p className="cadastro-step__subtitulo">Escolha o tipo de conta que melhor descreve seu papel.</p>
                <div className="cadastro-tipo__grade">
                  {["student", "advisor"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setUserType(type)}
                      className={`cadastro-tipo__opcao ${userType === type ? "cadastro-tipo__opcao--selecionado" : "cadastro-tipo__opcao--disponivel"}`}
                    >
                      <span className="cadastro-tipo__icone" aria-hidden="true">
                        {type === "student" ? <GraduationCap size={20} /> : <FlaskConical size={20} />}
                      </span>
                      <span className={`cadastro-tipo__nome ${userType === type ? "cadastro-tipo__nome--selecionado" : "cadastro-tipo__nome--disponivel"}`}>
                        {type === "student" ? "Aluno" : "Orientador"}
                      </span>
                      <span className={`cadastro-tipo__descricao ${userType === type ? "cadastro-tipo__descricao--selecionado" : "cadastro-tipo__descricao--disponivel"}`}>
                        {type === "student" ? "Busco projetos de IC para participar" : "Tenho projetos e quero orientar alunos"}
                      </span>
                    </button>
                  ))}
                </div>
                <button type="button" onClick={handleNext} className="cadastro-step__botao-continuar">
                  Continuar <ArrowRight size={16} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="cadastro-step__titulo">Dados pessoais</h2>
                <p className="cadastro-step__subtitulo">Preencha suas informações básicas.</p>
                <div className="cadastro-campos">
                  <div className="campo-cadastro">
                    <label className="campo-cadastro__label">Nome completo</label>
                    <div className="campo-cadastro__wrapper">
                      <User size={16} className="campo-cadastro__icone-esquerda" />
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                        className="campo-cadastro__input"
                        placeholder="Seu nome completo"
                        autoComplete="name"
                        required
                      />
                    </div>
                  </div>

                  <div className="campo-cadastro">
                    <label className="campo-cadastro__label">E-mail institucional</label>
                    <div className="campo-cadastro__wrapper">
                      <Mail size={16} className="campo-cadastro__icone-esquerda" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        className="campo-cadastro__input"
                        placeholder="seu@universidade.br"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  {userType === "student" && (
                    <div className="campo-cadastro">
                      <label className="campo-cadastro__label">RA</label>
                      <div className="campo-cadastro__wrapper">
                        <Hash size={16} className="campo-cadastro__icone-esquerda" />
                        <input
                          type="text"
                          value={form.ra}
                          onChange={(e) => update("ra", e.target.value)}
                          className="campo-cadastro__input"
                          placeholder="Seu registro acadêmico"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="campo-cadastro">
                    <label className="campo-cadastro__label">Senha</label>
                    <div className="campo-cadastro__wrapper">
                      <Lock size={16} className="campo-cadastro__icone-esquerda" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => update("password", e.target.value)}
                        className="campo-cadastro__input campo-cadastro__input--com-acao"
                        placeholder="Mínimo 8 caracteres"
                        autoComplete="new-password"
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="campo-cadastro__botao-senha">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="campo-cadastro">
                    <label className="campo-cadastro__label">Confirmar senha</label>
                    <div className="campo-cadastro__wrapper">
                      <Lock size={16} className="campo-cadastro__icone-esquerda" />
                      <input
                        type="password"
                        value={form.confirmPassword}
                        onChange={(e) => update("confirmPassword", e.target.value)}
                        className="campo-cadastro__input"
                        placeholder="Repita a senha"
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  </div>
                </div>

                {error ? (
                  <p className="cadastro-step__subtitulo" style={{ color: "var(--cor-erro)" }}>{error}</p>
                ) : null}

                <div className="cadastro-step__acoes">
                  <button type="button" onClick={() => setStep(1)} className="cadastro-step__botao-voltar">Voltar</button>
                  <button type="button" onClick={handleNext} className="cadastro-step__botao-avancar">
                    Continuar <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="cadastro-step__titulo">
                  {userType === "advisor" ? "Dados profissionais" : "Informações acadêmicas"}
                </h2>
                <p className="cadastro-step__subtitulo">
                  {userType === "advisor"
                    ? "Esses dados identificam sua área de orientação."
                    : "Esses dados ajudam na organização do perfil."}
                </p>
                <div className="cadastro-campos">
                  <div className="campo-cadastro">
                    <label className="campo-cadastro__label">Instituição de ensino</label>
                    <div className="campo-cadastro__wrapper">
                      <Building2 size={16} className="campo-cadastro__icone-esquerda" />
                      <select value={form.institution} onChange={(e) => update("institution", e.target.value)} className="campo-cadastro__select" required>
                        <option value="">Selecione sua instituicao</option>
                        {institutions.map((institution) => <option key={institution} value={institution}>{institution}</option>)}
                      </select>
                    </div>
                  </div>

                  {userType === "advisor" ? (
                    <>
                      <div className="campo-cadastro">
                        <label className="campo-cadastro__label">Departamento</label>
                        <div className="campo-cadastro__wrapper">
                          <Building2 size={16} className="campo-cadastro__icone-esquerda" />
                          <input
                            type="text"
                            value={form.department}
                            onChange={(e) => update("department", e.target.value)}
                            className="campo-cadastro__input"
                            placeholder="Ex: Computação"
                            required
                          />
                        </div>
                      </div>

                      <div className="campo-cadastro">
                        <label className="campo-cadastro__label">Titulação</label>
                        <select value={form.academicTitle} onChange={(e) => update("academicTitle", e.target.value)} className="campo-cadastro__select--sem-icone" required>
                          <option value="">Selecione a titulacao</option>
                          {["Especialista", "Mestre", "Doutor", "Pos-doutor"].map((title) => (
                            <option key={title} value={title}>{title}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="campo-cadastro campo-cadastro--largura-total">
                        <p className="cadastro-step__subtitulo">
                          O curso será definido pela administração após a criação da conta.
                        </p>
                      </div>

                      <div className="campo-cadastro">
                        <label className="campo-cadastro__label">Semestre atual</label>
                        <select value={form.semester} onChange={(e) => update("semester", e.target.value)} className="campo-cadastro__select--sem-icone">
                          <option value="">Selecione o semestre</option>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((semester) => (
                            <option key={semester} value={semester}>{semester}º semestre</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div className="campo-cadastro__termos campo-cadastro--largura-total">
                    <input type="checkbox" id="terms" className="campo-cadastro__checkbox" required />
                    <label htmlFor="terms" className="campo-cadastro__termos-texto">
                      Concordo com os <a href="#" className="campo-cadastro__termos-link">Termos de Uso</a> e a <a href="#" className="campo-cadastro__termos-link">Política de Privacidade</a>
                    </label>
                  </div>
                </div>

                {error ? (
                  <p className="cadastro-step__subtitulo" style={{ color: "var(--cor-erro)" }}>{error}</p>
                ) : null}
                <div className="cadastro-step__acoes">
                  <button type="button" onClick={() => setStep(2)} className="cadastro-step__botao-voltar">Voltar</button>
                  <button type="submit" disabled={loading} className="cadastro-step__botao-enviar">
                    {loading ? <div className="cadastro-step__spinner" /> : <>Criar conta <ArrowRight size={15} /></>}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <p className="pagina-cadastro__rodape">
          Já tem conta?{" "}
          <Link to="/login" className="pagina-cadastro__link-login">Fazer login</Link>
        </p>
      </div>
    </div>
  );
}
