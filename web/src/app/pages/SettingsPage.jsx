import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  User, Lock,
  Palette, LogOut, ChevronRight,
  ArrowLeft, Check, Monitor, Moon, Sun,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../providers/ThemeProvider";
import { userService } from "../services/userService";
import { authService } from "../services/authService";
import { formatUserType } from "../utils/formatters";
import { getUserPhotoUrl } from "../utils/adapters";
import "./SettingsPage.css";

function getInitials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function Avatar({ name, src, size = 52 }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [src]);

  const showImage = Boolean(src) && !imageFailed;

  return (
    <div className="cfg-avatar" style={{ width: size, height: size, fontSize: size * 0.33 }}>
      {showImage ? (
        <img src={src} alt={name ? `Foto de perfil de ${name}` : "Foto de perfil"} onError={() => setImageFailed(true)} />
      ) : (
        getInitials(name) || "?"
      )}
    </div>
  );
}

function NavItem({ icon: Icon, iconClass = "", title, sub, badge, onClick }) {
  return (
    <button className="cfg-nav-item" onClick={onClick}>
      <span className={`cfg-nav-item__icon ${iconClass}`}><Icon size={18} /></span>
      <span className="cfg-nav-item__text">
        <span className="cfg-nav-item__title">{title}</span>
        {sub && <span className="cfg-nav-item__sub">{sub}</span>}
      </span>
      {badge != null && <span className="cfg-nav-item__badge">{badge}</span>}
      <ChevronRight size={16} className="cfg-nav-item__chevron" />
    </button>
  );
}

function SectionLabel({ children }) {
  return <p className="cfg-section-label">{children}</p>;
}

function SectionGroup({ children }) {
  return <div className="cfg-section-group">{children}</div>;
}

function PanelPortal({ children }) {
  const el = document.querySelector(".pagina-app__principal");
  if (!el) return null;
  return createPortal(children, el);
}

function Panel({ panelId, activePanel, title, onBack, children, collapsed }) {
  const open = activePanel === panelId;
  return (
    <PanelPortal>
      <AnimatePresence>
        {open && (
          <motion.div
            className={`cfg-panel ${collapsed ? "cfg-panel--recolhida" : ""}`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
          >
            <div className="cfg-panel__header">
              <button className="cfg-panel__back" onClick={onBack} aria-label="Voltar para configurações">
                <span className="cfg-panel__back-icon"><ArrowLeft size={16} /></span>
                <span className="cfg-panel__back-text">Voltar</span>
              </button>
              <span className="cfg-panel__title">{title}</span>
            </div>
            <div className="cfg-panel__body">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </PanelPortal>
  );
}

function FormGroup({ label, children }) {
  return (
    <div className="cfg-form-group">
      <label className="cfg-form-label">{label}</label>
      {children}
    </div>
  );
}

function Input(props) {
  return <input className="cfg-input" {...props} />;
}

function PrimaryBtn({ children, ...props }) {
  return <button className="cfg-btn cfg-btn--primary" {...props}>{children}</button>;
}

function DangerBtn({ children, ...props }) {
  return <button className="cfg-btn cfg-btn--danger" {...props}>{children}</button>;
}

const THEME_OPTIONS = [
  { key: "light", label: "Claro", description: "Interface com fundo claro", icon: Sun },
  { key: "dark", label: "Escuro", description: "Interface com fundo escuro", icon: Moon },
  { key: "system", label: "Seguir o sistema", description: "Usa a preferência do dispositivo", icon: Monitor },
];

function ThemeSelector({ value, onChange }) {
  return (
    <div className="cfg-theme-grid" role="radiogroup" aria-label="Tema da interface">
      {THEME_OPTIONS.map(({ key, label, description, icon: Icon }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            className={`cfg-theme-option ${active ? "cfg-theme-option--active" : ""}`}
            onClick={() => onChange(key)}
          >
            <span className="cfg-theme-option__icon">
              <Icon size={18} />
            </span>
            <span className="cfg-theme-option__text">
              <span className="cfg-theme-option__title">{label}</span>
              <span className="cfg-theme-option__description">{description}</span>
            </span>
            <span className="cfg-theme-option__check" aria-hidden="true">
              {active && <Check size={15} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SettingsSkeleton() {
  const Sk = ({ w = "100%", h = 14, r = "0.5rem" }) => (
    <div className="skeleton" style={{ width: w, height: h, borderRadius: r }} />
  );
  return (
    <div className="cfg-skeleton-wrap">
      {[1, 2, 3].map((i) => (
        <div key={i} className="cfg-skeleton-block">
          <div className="cfg-skeleton-block__row">
            <Sk w={18} h={18} r="50%" />
            <Sk w={120} h={14} />
          </div>
          <Sk w="100%" h={48} r="12px" />
          <Sk w="100%" h={48} r="12px" />
        </div>
      ))}
    </div>
  );
}

import { useSidebarContext } from "../layouts/DashboardLayout";

function readProfileValue(profile, field, fallback = "") {
  return profile?.[field] ?? fallback;
}

function resolveRegistration(profile, fallbackUser) {
  return profile?.ra ?? profile?.matricula ?? profile?.registration ?? fallbackUser?.ra ?? fallbackUser?.matricula ?? "";
}

export default function SettingsPage() {
  const { collapsed } = useSidebarContext();
  const { user, logout, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nome: "", email: "", fotoPerfilUrl: "",
    senhaAtual: "", senhaNova: "", confirmarSenha: "",
  });
  const [tipoPerfil, setTipoPerfil] = useState("ALUNO");
  const [matricula, setMatricula] = useState("");

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setForm((prev) => ({
      ...prev,
      nome: readProfileValue(user, "nome", ""),
      email: readProfileValue(user, "email", ""),
      fotoPerfilUrl: getUserPhotoUrl(user),
    }));
    setTipoPerfil(user?.tipo ?? "ALUNO");
    setMatricula(resolveRegistration(user, user));

    userService.getById(user.id)
      .then((profile) => {
        setForm((prev) => ({
          ...prev,
          nome: readProfileValue(profile, "nome", user?.nome ?? ""),
          email: readProfileValue(profile, "email", user?.email ?? ""),
          fotoPerfilUrl: getUserPhotoUrl(profile) || getUserPhotoUrl(user),
        }));
        setTipoPerfil(profile.tipo ?? user?.tipo ?? "ALUNO");
        setMatricula(resolveRegistration(profile, user));
      })
      .catch(() => {
        setTipoPerfil(user?.tipo ?? "ALUNO");
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!activePanel) {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      return;
    }
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [activePanel]);

  const handleInput = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const saveProfile = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await userService.update(user.id, {
        nome: form.nome,
        email: form.email,
      });
      await refreshUser();
      toast.success("Configurações salvas com sucesso.");
      setActivePanel(null);
    } catch (err) {
      toast.error(err.message || "Não foi possível salvar as configurações.");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!form.senhaAtual || !form.senhaNova || !form.confirmarSenha) {
      toast.error("Preencha todos os campos de senha.");
      return;
    }
    if (form.senhaNova !== form.confirmarSenha) {
      toast.error("A confirma\u00e7\u00e3o de senha n\u00e3o confere.");
      return;
    }

    setSaving(true);
    try {
      await authService.changePassword({
        senhaAtual: form.senhaAtual,
        novaSenha: form.senhaNova,
      });
      setForm((prev) => ({ ...prev, senhaAtual: "", senhaNova: "", confirmarSenha: "" }));
      toast.success("Senha alterada com sucesso.");
      setActivePanel(null);
    } catch (err) {
      toast.error(err.message || "N\u00e3o foi poss\u00edvel alterar a senha.");
    } finally {
      setSaving(false);
    }
  };

  const open = (id) => setActivePanel(id);
  const close = () => setActivePanel(null);

  const panelProps = { activePanel, onBack: close, collapsed };

  if (loading) return <SettingsSkeleton />;

  return (
    <div className="pagina-configuracoes">

      <div className="cfg-profile-card">
        <Avatar name={form.nome} src={form.fotoPerfilUrl} size={52} />
        <div>
          <p className="cfg-profile-card__name">{form.nome || "—"}</p>
          <p className="cfg-profile-card__sub">{form.email} · {formatUserType(tipoPerfil)}</p>
        </div>
      </div>

      <div className="cfg-section">
        <SectionLabel>Conta</SectionLabel>
        <SectionGroup>
          <NavItem icon={User} iconClass="icon-blue" title="Informações da conta" sub="Nome, e-mail e função" onClick={() => open("conta")} />
          <NavItem icon={Lock} iconClass="icon-purple" title="Senha" sub="Alterar senha de acesso" onClick={() => open("senha")} />
        </SectionGroup>
      </div>

      <div className="cfg-section">
        <SectionLabel>Aparência</SectionLabel>
        <SectionGroup>
          <NavItem icon={Palette} iconClass="icon-pink" title="Aparência" sub="Tema, modo escuro" onClick={() => open("aparencia")} />
        </SectionGroup>
      </div>
      <div className="cfg-section">
        <SectionGroup>
          <button className="cfg-nav-item cfg-nav-item--danger" onClick={() => open("logout")}>
            <span className="cfg-nav-item__icon icon-red"><LogOut size={18} /></span>
            <span className="cfg-nav-item__text">
              <span className="cfg-nav-item__title cfg-nav-item__title--danger">Sair da conta</span>
            </span>
          </button>
        </SectionGroup>
      </div>

      {/* Panels */}
      <Panel panelId="conta" title="Informações da conta" {...panelProps}>
        <div className="cfg-panel-avatar-row">
          <Avatar name={form.nome} src={form.fotoPerfilUrl} size={64} />
          <div>
            <p className="cfg-profile-card__name">{form.nome}</p>
          </div>
        </div>
        <FormGroup label="Nome completo">
          <Input value={form.nome} onChange={(e) => handleInput("nome", e.target.value)} />
        </FormGroup>
        <FormGroup label="Email">
          <Input value={form.email} onChange={(e) => handleInput("email", e.target.value)} />
        </FormGroup>
        {tipoPerfil === "ALUNO" && (
          <FormGroup label="Matrícula">
            <p className="cfg-readonly">{matricula || "—"}</p>
          </FormGroup>
        )}
        <FormGroup label="Função">
          <p className="cfg-readonly">{formatUserType(tipoPerfil)}</p>
        </FormGroup>
        <PrimaryBtn onClick={saveProfile} disabled={saving}>
          {saving ? "Salvando..." : "Salvar alterações"}
        </PrimaryBtn>
      </Panel>

      <Panel panelId="senha" title="Alterar senha" {...panelProps}>
        <FormGroup label="Senha atual">
          <Input type="password" placeholder="••••••••" value={form.senhaAtual} onChange={(e) => handleInput("senhaAtual", e.target.value)} />
        </FormGroup>
        <FormGroup label="Nova senha">
          <Input type="password" placeholder="••••••••" value={form.senhaNova} onChange={(e) => handleInput("senhaNova", e.target.value)} />
        </FormGroup>
        <FormGroup label="Confirmar nova senha">
          <Input type="password" placeholder="••••••••" value={form.confirmarSenha} onChange={(e) => handleInput("confirmarSenha", e.target.value)} />
        </FormGroup>
        <div className="cfg-password-hint">
          <p className="cfg-password-hint__title">A senha deve conter:</p>
          <p>· Mínimo 8 caracteres</p>
          <p>· Letras maiúsculas e minúsculas</p>
          <p>· Pelo menos um número</p>
        </div>
        <PrimaryBtn onClick={changePassword} disabled={saving}>{saving ? "Alterando..." : "Alterar senha"}</PrimaryBtn>
      </Panel>
      <Panel panelId="aparencia" title="Aparência" {...panelProps}>
        <SectionLabel>Tema</SectionLabel>
        <SectionGroup>
          <ThemeSelector value={theme} onChange={setTheme} />
        </SectionGroup>
      </Panel>

      <Panel panelId="logout" title="Sair da conta" {...panelProps}>
        <div className="cfg-logout-confirm">
          <div className="cfg-logout-confirm__icon"><LogOut size={28} /></div>
          <p className="cfg-logout-confirm__title">Sair da conta?</p>
          <p className="cfg-logout-confirm__desc">
            Você precisará fazer login novamente para acessar a plataforma.
          </p>
          <DangerBtn onClick={logout}>Confirmar saída</DangerBtn>
          <button className="cfg-logout-confirm__cancel" onClick={close}>Cancelar</button>
        </div>
      </Panel>

    </div>
  );
}
