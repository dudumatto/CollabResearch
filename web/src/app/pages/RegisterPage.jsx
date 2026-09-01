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
  Hash,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import "./RegisterPage.css";
import { AppCombobox } from "../components/ui/AppCombobox";

const institutions = [
  "Universidade de Sao Paulo (USP)",
  "Universidade Estadual de Sao Paulo (UNESP)",
  "Universidade Estadual de Campinas (UNICAMP)",
  "Universidade Federal de Sao Paulo (UNIFESP)",
  "Universidade Federal de Minas Gerais (UFMG)",
  "Universidade Federal do Rio de Janeiro (UFRJ)",
  "Universidade Federal do Rio Grande do Sul (UFRGS)",
  "Universidade Federal de Santa Catarina (UFSC)",
  "Universidade Federal do Parana (UFPR)",
  "Universidade Federal de Pernambuco (UFPE)",
  "Universidade Federal da Bahia (UFBA)",
  "Universidade de Brasilia (UnB)",
  "Universidade Federal de Sao Carlos (UFSCar)",
  "Universidade Federal do ABC (UFABC)",
  "Pontificia Universidade Catolica de Sao Paulo (PUC-SP)",
  "Pontificia Universidade Catolica do Rio de Janeiro (PUC-Rio)",
  "Pontificia Universidade Catolica de Minas Gerais (PUC Minas)",
  "Universidade Presbiteriana Mackenzie",
  "Fundacao Getulio Vargas (FGV)",
  "Instituto Federal de Sao Paulo (IFSP)",
  "Instituto Federal do Rio de Janeiro (IFRJ)",
  "Centro Universitario Senac",
  "Outra",
];

const legalContent = {
  terms: {
    title: "Termos de Uso",
    intro: "Ao criar uma conta, você concorda em usar o CollabResearch de forma acadêmica, ética e compatível com as regras da sua instituição.",
    items: [
      "Você deve informar dados verdadeiros e manter seu acesso protegido.",
      "Projetos, documentos e mensagens devem respeitar autoria, propriedade intelectual e normas acadêmicas.",
      "A plataforma pode suspender contas usadas para fraude, spam, plágio, assédio ou acesso indevido.",
      "Orientadores e alunos são responsáveis pelo conteúdo que publicam, enviam ou compartilham.",
      "Recursos da plataforma podem mudar para melhorar segurança, desempenho ou fluxo acadêmico.",
    ],
  },
  privacy: {
    title: "Política de Privacidade",
    intro: "Usamos seus dados para criar sua conta, organizar vínculos acadêmicos e permitir comunicação entre alunos, orientadores e administração.",
    items: [
      "Coletamos dados de cadastro, instituição, perfil acadêmico e registros de uso necessários ao funcionamento da plataforma.",
      "Seus dados são usados para autenticação, segurança, gestão de projetos, notificações e suporte.",
      "Não vendemos dados pessoais. O compartilhamento ocorre apenas quando necessário para operar o serviço ou cumprir obrigação legal.",
      "Você pode solicitar correção, atualização ou exclusão de dados conforme as regras aplicáveis da instituição e da legislação brasileira.",
      "Medidas técnicas e administrativas são usadas para proteger contas, documentos e comunicações.",
    ],
  },
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [legalPanel, setLegalPanel] = useState(null);
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

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const updateRa = (value) => update("ra", value.replace(/\D/g, "").slice(0, 6));

  const validateStep = (targetStep = step) => {
    const nextErrors = {};

    if (targetStep === 2) {
      if (!form.name.trim()) nextErrors.name = "Informe seu nome completo.";
      if (!form.email.trim()) nextErrors.email = "Informe seu e-mail institucional.";
      if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        nextErrors.email = "Informe um e-mail válido.";
      }
      if (userType === "student" && !/^\d{6}$/.test(form.ra)) {
        nextErrors.ra = "Informe o RA com 6 dígitos.";
      }
      if (!form.password) nextErrors.password = "Informe uma senha.";
      if (form.password && form.password.length < 8) nextErrors.password = "Use no mínimo 8 caracteres.";
      if (!form.confirmPassword) nextErrors.confirmPassword = "Confirme sua senha.";
      if (form.confirmPassword && form.password !== form.confirmPassword) {
        nextErrors.confirmPassword = "As senhas não coincidem.";
      }
    }

    if (targetStep === 3) {
      if (!form.institution) nextErrors.institution = "Selecione sua instituição de ensino.";
      if (userType === "advisor" && !form.department.trim()) nextErrors.department = "Informe seu departamento.";
      if (userType === "advisor" && !form.academicTitle) nextErrors.academicTitle = "Selecione sua titulação.";
      if (!acceptedTerms) nextErrors.terms = "Aceite os termos para criar sua conta.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    setError("");
    if (step === 2 && !validateStep(2)) return;
    if (step < 3) setStep(step + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateStep(2) || !validateStep(3)) return;
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
    <div className="pagina-cadastro tema-fixo-claro">
      <div className="pagina-cadastro__container">
        <div className="pagina-cadastro__cabecalho">
          <Link to="/" className="pagina-cadastro__logo-link">
            <img className="pagina-cadastro__logo-full" src="/brand/logo-full.svg" alt="CollabResearch" />
          </Link>
          <h1 className="pagina-cadastro__titulo">Criar sua conta</h1>
          <p className="pagina-cadastro__subtitulo">Junte-se à plataforma de iniciação científica</p>
        </div>

        <div className="pagina-cadastro__progresso" aria-label={`Etapa ${step} de 3`}>
          {[1, 2, 3].map((s) => (
            <div key={s} className="pagina-cadastro__marcador-passo">
              <div
                className={`pagina-cadastro__circulo-passo ${
                  s === step
                    ? "pagina-cadastro__circulo-passo--ativo"
                    : "pagina-cadastro__circulo-passo--inativo"
                }`}
                aria-current={s === step ? "step" : undefined}
              >
                {s}
              </div>
              {s < 3 && <div className="pagina-cadastro__linha-passo" />}
            </div>
          ))}
        </div>

        <div className="pagina-cadastro__painel">
          <form onSubmit={handleSubmit} noValidate>
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
                        className={`campo-cadastro__input ${fieldErrors.name ? "campo-cadastro__input--erro" : ""}`}
                        placeholder="Seu nome completo"
                        autoComplete="name"
                        aria-invalid={Boolean(fieldErrors.name)}
                      />
                    </div>
                    {fieldErrors.name ? <p className="campo-cadastro__erro">{fieldErrors.name}</p> : null}
                  </div>

                  <div className="campo-cadastro">
                    <label className="campo-cadastro__label">E-mail institucional</label>
                    <div className="campo-cadastro__wrapper">
                      <Mail size={16} className="campo-cadastro__icone-esquerda" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        className={`campo-cadastro__input ${fieldErrors.email ? "campo-cadastro__input--erro" : ""}`}
                        placeholder="seu@universidade.br"
                        autoComplete="email"
                        aria-invalid={Boolean(fieldErrors.email)}
                      />
                    </div>
                    {fieldErrors.email ? <p className="campo-cadastro__erro">{fieldErrors.email}</p> : null}
                  </div>

                  {userType === "student" && (
                    <div className="campo-cadastro">
                      <label className="campo-cadastro__label">RA</label>
                      <div className="campo-cadastro__wrapper">
                        <Hash size={16} className="campo-cadastro__icone-esquerda" />
                        <input
                          type="text"
                          value={form.ra}
                          onChange={(e) => updateRa(e.target.value)}
                          onPaste={(e) => {
                            e.preventDefault();
                            updateRa(e.clipboardData.getData("text"));
                          }}
                          className={`campo-cadastro__input ${fieldErrors.ra ? "campo-cadastro__input--erro" : ""}`}
                          placeholder="6 dígitos"
                          inputMode="numeric"
                          maxLength={6}
                          pattern="\d{6}"
                          aria-invalid={Boolean(fieldErrors.ra)}
                        />
                      </div>
                      {fieldErrors.ra ? <p className="campo-cadastro__erro">{fieldErrors.ra}</p> : null}
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
                        className={`campo-cadastro__input campo-cadastro__input--com-acao ${fieldErrors.password ? "campo-cadastro__input--erro" : ""}`}
                        placeholder="Mínimo 8 caracteres"
                        autoComplete="new-password"
                        aria-invalid={Boolean(fieldErrors.password)}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="campo-cadastro__botao-senha">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldErrors.password ? <p className="campo-cadastro__erro">{fieldErrors.password}</p> : null}
                  </div>

                  <div className="campo-cadastro">
                    <label className="campo-cadastro__label">Confirmar senha</label>
                    <div className="campo-cadastro__wrapper">
                      <Lock size={16} className="campo-cadastro__icone-esquerda" />
                      <input
                        type="password"
                        value={form.confirmPassword}
                        onChange={(e) => update("confirmPassword", e.target.value)}
                        className={`campo-cadastro__input ${fieldErrors.confirmPassword ? "campo-cadastro__input--erro" : ""}`}
                        placeholder="Repita a senha"
                        autoComplete="new-password"
                        aria-invalid={Boolean(fieldErrors.confirmPassword)}
                      />
                    </div>
                    {fieldErrors.confirmPassword ? <p className="campo-cadastro__erro">{fieldErrors.confirmPassword}</p> : null}
                  </div>
                </div>

                {error ? <p className="cadastro-step__erro-geral">{error}</p> : null}

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
                      <AppCombobox
                        ariaLabel="Selecionar instituição de ensino"
                        className={`campo-cadastro__select app-combobox--with-leading-icon ${fieldErrors.institution ? "campo-cadastro__input--erro" : ""}`}
                        value={form.institution}
                        placeholder="Selecione sua instituicao"
                        onChange={(nextValue) => update("institution", nextValue)}
                        options={[
                          { value: "", label: "Selecione sua instituicao", disabled: true },
                          ...institutions.map((institution) => ({ value: institution, label: institution })),
                        ]}
                      />
                    </div>
                    {fieldErrors.institution ? <p className="campo-cadastro__erro">{fieldErrors.institution}</p> : null}
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
                            className={`campo-cadastro__input ${fieldErrors.department ? "campo-cadastro__input--erro" : ""}`}
                            placeholder="Ex: Computação"
                            aria-invalid={Boolean(fieldErrors.department)}
                          />
                        </div>
                        {fieldErrors.department ? <p className="campo-cadastro__erro">{fieldErrors.department}</p> : null}
                      </div>

                      <div className="campo-cadastro">
                        <label className="campo-cadastro__label">Titulação</label>
                        <AppCombobox
                          ariaLabel="Selecionar titulação"
                          className={`campo-cadastro__select--sem-icone ${fieldErrors.academicTitle ? "campo-cadastro__input--erro" : ""}`}
                          value={form.academicTitle}
                          placeholder="Selecione a titulacao"
                          onChange={(nextValue) => update("academicTitle", nextValue)}
                          options={[
                            { value: "", label: "Selecione a titulacao", disabled: true },
                            ...["Especialista", "Mestre", "Doutor", "Pos-doutor"].map((title) => ({ value: title, label: title })),
                          ]}
                        />
                        {fieldErrors.academicTitle ? <p className="campo-cadastro__erro">{fieldErrors.academicTitle}</p> : null}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="campo-cadastro campo-cadastro--largura-total">
                        <p className="cadastro-step__subtitulo cadastro-step__subtitulo--compacto">
                          O curso será definido pela administração após a criação da conta.
                        </p>
                      </div>

                      <div className="campo-cadastro">
                        <label className="campo-cadastro__label">Semestre atual</label>
                        <AppCombobox
                          ariaLabel="Selecionar semestre atual"
                          className="campo-cadastro__select--sem-icone"
                          value={form.semester}
                          placeholder="Selecione o semestre"
                          onChange={(nextValue) => update("semester", nextValue)}
                          options={[
                            { value: "", label: "Selecione o semestre" },
                            ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((semester) => ({ value: semester, label: `${semester}º semestre` })),
                          ]}
                        />
                      </div>
                    </>
                  )}

                  <div className="campo-cadastro__termos campo-cadastro--largura-total">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={acceptedTerms}
                      onChange={(e) => {
                        setAcceptedTerms(e.target.checked);
                        setFieldErrors((prev) => ({ ...prev, terms: "" }));
                      }}
                      className="campo-cadastro__checkbox"
                    />
                    <label htmlFor="terms" className="campo-cadastro__termos-texto">
Concordo com os{" "}
                      <button type="button" className="campo-cadastro__termos-link" onClick={() => setLegalPanel("terms")}>
                        Termos de Uso
                      </button>{" "}
                      e a{" "}
                      <button type="button" className="campo-cadastro__termos-link" onClick={() => setLegalPanel("privacy")}>
                        Política de Privacidade
                      </button>
                    </label>
                    {fieldErrors.terms ? <p className="campo-cadastro__erro campo-cadastro__erro--termos">{fieldErrors.terms}</p> : null}
                  </div>
                </div>

                {error ? <p className="cadastro-step__erro-geral">{error}</p> : null}
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


        {legalPanel ? (
          <div className="cadastro-legal" role="dialog" aria-modal="true" aria-labelledby="cadastro-legal-titulo">
            <div className="cadastro-legal__painel">
              <div className="cadastro-legal__cabecalho">
                <h2 id="cadastro-legal-titulo" className="cadastro-legal__titulo">{legalContent[legalPanel].title}</h2>
                <button type="button" className="cadastro-legal__fechar" onClick={() => setLegalPanel(null)}>
                  Fechar
                </button>
              </div>
              <p className="cadastro-legal__intro">{legalContent[legalPanel].intro}</p>
              <ul className="cadastro-legal__lista">
                {legalContent[legalPanel].items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
        <p className="pagina-cadastro__rodape">
          Já tem conta?{" "}
          <Link to="/login" className="pagina-cadastro__link-login">Fazer login</Link>
        </p>
      </div>
    </div>
  );
}
