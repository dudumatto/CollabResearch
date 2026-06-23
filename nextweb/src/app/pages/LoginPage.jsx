"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import AuthShell from "../components/AuthShell";
import { Button, TextField } from "../components/ui";

const loginHighlights = [
  {
    title: "Fluxo acadêmico completo",
    description: "Tarefas, entregas e progresso em uma área segura.",
    icon: <Workflow size={16} />,
  },
  {
    title: "Acesso protegido",
    description: "Sessão preservada para retomar o trabalho com menos atrito.",
    icon: <ShieldCheck size={16} />,
  },
  {
    title: "Rotina mais clara",
    description: "Uma experiência focada para aluno e orientador.",
    icon: <Sparkles size={16} />,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login({ email, senha: password });
      router.push("/app");
    } catch (err) {
      setError(err.message || "Não foi possível entrar. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      className="pagina-login"
      eyebrow="Acesso seguro"
      title="Entrar no CollabResearch"
      description="Use seu e-mail institucional para acompanhar entregas, orientações e decisões do projeto."
      sideTitle="Sua pesquisa no mesmo ritmo da orientação."
      sideDescription="Uma base visual mais clara para entrar rápido, voltar ao painel e manter o trabalho acadêmico sob controle."
      sideItems={loginHighlights}
      footer={
        <span>
          Não tem conta? <Link href="/register">Criar cadastro</Link>
        </span>
      }
    >
      <form onSubmit={handleLogin} className="auth-form login-form">
        {error ? (
          <p className="auth-form__error" role="alert">
            {error}
          </p>
        ) : null}

        <TextField
          label="E-mail institucional"
          leftIcon={<Mail size={16} />}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@universidade.br"
          autoComplete="email"
          required
        />

        <TextField
          label="Senha"
          leftIcon={<Lock size={16} />}
          rightSlot={
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              title={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          }
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Digite sua senha"
          autoComplete="current-password"
          required
        />

        <div className="auth-form__row">
          <label className="auth-form__checkbox-row" htmlFor="remember">
            <input id="remember" type="checkbox" className="auth-form__checkbox" defaultChecked />
            <span>Manter conectado</span>
          </label>
          <Link href="#">Esqueceu a senha?</Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={loading}
          rightIcon={!loading ? <ArrowRight size={17} /> : null}
        >
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </AuthShell>
  );
}

