import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import "./LoginPage.css";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.6.5 6.5 5.8 2.6 13.6l7.8 6.1C12.3 13.7 17.7 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.2 5.4-4.7 7l7.6 5.9c4.4-4.1 6.8-10.1 6.8-17.4Z" />
      <path fill="#FBBC05" d="M10.4 28.3a14.5 14.5 0 0 1 0-8.6l-7.8-6.1a23.5 23.5 0 0 0 0 20.8l7.8-6.1Z" />
      <path fill="#34A853" d="M24 47.5c6.2 0 11.5-2 15.3-5.5l-7.6-5.9c-2.1 1.4-4.8 2.3-7.7 2.3-6.3 0-11.7-4.2-13.6-10.1l-7.8 6.1C6.5 42.2 14.6 47.5 24 47.5Z" />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { googleLogin, login } = useAuth();
  const googleButtonRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleUnavailable, setGoogleUnavailable] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const googleAllowedDomains = import.meta.env.VITE_GOOGLE_HOSTED_DOMAIN || "unicamp.br,g.unicamp.br,cotil.unicamp.br";

  useEffect(() => {
    if (!googleClientId) {
      setGoogleUnavailable(true);
      return;
    }

    const container = googleButtonRef.current;
    if (!container) return;

    let cancelled = false;
    let renderedWidth = 0;
    let googleInitialized = false;

    const renderGoogleButton = () => {
      if (cancelled || !window.google?.accounts?.id) return;

      // O GSI só aceita largura entre 200px e 400px e desenha o botão exatamente
      // nessa medida, então ela precisa acompanhar a largura real do container.
      const width = Math.min(400, Math.max(200, Math.floor(container.clientWidth)));
      if (width === renderedWidth) return;

      if (!googleInitialized) {
        // Não usamos hosted_domain para permitir múltiplos domínios (unicamp.br, cotil.unicamp.br)
        // A validação de domínio é feita no backend
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async ({ credential }) => {
            if (!credential) {
              setError("Não foi possível validar sua conta Google.");
              return;
            }

            setError("");
            setGoogleLoading(true);
            try {
              await googleLogin({ idToken: credential });
              navigate("/app");
            } catch (err) {
              setError(err.message || "Conta Google não aceita. Use seu e-mail institucional cadastrado.");
            } finally {
              setGoogleLoading(false);
            }
          },
        });
        googleInitialized = true;
      }

      container.innerHTML = "";
      window.google.accounts.id.renderButton(container, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width,
      });
      renderedWidth = width;
    };

    const resizeObserver = new ResizeObserver(renderGoogleButton);
    resizeObserver.observe(container);

    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else {
      const existingScript = document.querySelector("script[src='https://accounts.google.com/gsi/client']");
      const script = existingScript || document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", renderGoogleButton, { once: true });
      script.addEventListener("error", () => {
        if (!cancelled) setGoogleUnavailable(true);
      }, { once: true });
      if (!existingScript) document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
    };
  }, [googleClientId, googleLogin, navigate]);

  const updateEmail = (value) => {
    setEmail(value);
    setFieldErrors((prev) => ({ ...prev, email: "" }));
  };

  const updatePassword = (value) => {
    setPassword(value);
    setFieldErrors((prev) => ({ ...prev, password: "" }));
  };

  const validateLogin = () => {
    const nextErrors = {};

    if (!email.trim()) nextErrors.email = "Informe seu e-mail institucional.";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Informe um e-mail válido.";
    }
    if (!password) nextErrors.password = "Informe sua senha.";

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateLogin()) return;

    setLoading(true);

    try {
      await login({ email, senha: password });
      navigate("/app");
    } catch (err) {
      setError(err.message || "Não foi possível entrar. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pagina-login tema-fixo-claro">
      <div className="pagina-login__painel-esquerdo">
        <div className="pagina-login__decoracao-esquerda">
          <div className="pagina-login__decoracao-circulo-topo" />
          <div className="pagina-login__decoracao-circulo-base" />
        </div>
        <Link to="/" className="pagina-login__logo-esquerda">
          <img className="pagina-login__logo-full" src="/brand/logo-full.svg" alt="CollabResearch" />
        </Link>
        <div className="pagina-login__conteudo-esquerdo">
          <h2 className="pagina-login__titulo-esquerdo">
            Bem-vindo de volta à sua plataforma de pesquisa
          </h2>
          <p className="pagina-login__descricao-esquerda">
            Gerencie seus projetos de iniciação científica, comunique-se com orientadores e acompanhe seu progresso.
          </p>
          <div className="pagina-login__lista-beneficios">
            {["Acesse seus projetos ativos", "Verifique o status das inscrições", "Converse com seu orientador"].map((item) => (
              <div key={item} className="pagina-login__item-beneficio">
                <div className="pagina-login__icone-beneficio">
                  <ArrowRight size={12} style={{ color: "var(--cor-branco)" }} />
                </div>
                <span className="pagina-login__texto-beneficio">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="pagina-login__rodape-esquerdo">© 2026 CollabResearch. Todos os direitos reservados.</p>
      </div>

      <div className="pagina-login__painel-direito">
        <div className="pagina-login__formulario-area">
          <Link to="/" className="pagina-login__logo-mobile">
            <img className="pagina-login__logo-full-mobile" src="/brand/logo-full.svg" alt="CollabResearch" />
          </Link>

          <div className="pagina-login__cabecalho">
            <h1 className="pagina-login__titulo">Entrar na plataforma</h1>
            <p className="pagina-login__subtitulo">Digite suas credenciais para acessar</p>
          </div>

          <form onSubmit={handleLogin} className="pagina-login__form" noValidate>
            <div className="campo-formulario">
              <label className="campo-formulario__rotulo">E-mail institucional</label>
              <div className="campo-formulario__area-input">
                <Mail size={16} className="campo-formulario__icone-esquerda" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => updateEmail(e.target.value)}
                  className={`campo-formulario__input ${fieldErrors.email ? "campo-formulario__input--erro" : ""}`}
                  placeholder="seu@universidade.br"
                  autoComplete="email"
                  aria-invalid={Boolean(fieldErrors.email)}
                />
              </div>
              {fieldErrors.email ? <p className="campo-formulario__erro">{fieldErrors.email}</p> : null}
            </div>

            <div className="campo-formulario">
              <div className="campo-formulario__cabecalho">
                <label className="campo-formulario__rotulo" style={{ margin: 0 }}>Senha</label>
              </div>
              <div className="campo-formulario__area-input">
                <Lock size={16} className="campo-formulario__icone-esquerda" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => updatePassword(e.target.value)}
                  className={`campo-formulario__input campo-formulario__input--com-icone-direita ${fieldErrors.password ? "campo-formulario__input--erro" : ""}`}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  aria-invalid={Boolean(fieldErrors.password)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="campo-formulario__botao-visibilidade"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password ? <p className="campo-formulario__erro">{fieldErrors.password}</p> : null}
            </div>

            {error ? <p className="pagina-login__erro-geral">{error}</p> : null}

            <div className="campo-formulario__linha-checkbox">
              <input type="checkbox" id="remember" className="campo-formulario__checkbox" defaultChecked />
              <label htmlFor="remember" className="campo-formulario__rotulo-checkbox">Manter conectado</label>
            </div>

            <button type="submit" disabled={loading} className="pagina-login__botao-entrar">
              {loading ? (
                <><div className="pagina-login__spinner" /> Entrando...</>
              ) : (
                <>Entrar <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="pagina-login__divisor" aria-hidden="true">
            <div className="pagina-login__divisor-linha" />
            <span className="pagina-login__divisor-texto">ou</span>
            <div className="pagina-login__divisor-linha" />
          </div>

          <div className="pagina-login__google-area">
            {googleUnavailable ? (
              <button type="button" className="pagina-login__botao-google" disabled>
                Login Google indisponível
              </button>
            ) : (
              // O botão do Google é renderizado num iframe com medidas próprias, então
              // ele fica invisível por cima do nosso botão, que define o visual e a largura.
              <div className="pagina-login__google-botao">
                <span className="pagina-login__botao-google" aria-hidden="true">
                  <GoogleIcon /> Continuar com o Google
                </span>
                <div
                  ref={googleButtonRef}
                  className={`pagina-login__google-render ${googleLoading ? "pagina-login__google-render--loading" : ""}`}
                  aria-busy={googleLoading}
                />
              </div>
            )}
            <p className="pagina-login__google-ajuda">
              Use sua conta Google institucional (@unicamp.br, @g.unicamp.br ou @cotil.unicamp.br) já cadastrada na plataforma.
            </p>
          </div>

          <p className="pagina-login__link-cadastro">
            Não tem conta?{" "}
            <Link to="/register" className="pagina-login__link-cadastro-link">Cadastre-se</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
