import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  User, Lock,
  Bell, Palette, LogOut, ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../providers/ThemeProvider";
import { userService } from "../services/userService";
import { authService } from "../services/authService";
import { formatUserType } from "../utils/formatters";
import "./SettingsPage.css";

function getInitials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function Avatar({ name, size = 52 }) {
  return (
    <div className="cfg-avatar" style={{ width: size, height: size, fontSize: size * 0.33 }}>
      {getInitials(name) || "?"}
    </div>
  );
}

function Toggle({ on, onToggle, label }) {
  return (
    <button
      className={`cfg-toggle ${on ? "cfg-toggle--on" : ""}`}
      onClick={onToggle}
      aria-pressed={on}
      aria-label={label}
    >
      <span className="cfg-toggle__knob" />
    </button>
  );
}

function ToggleRow({ title, sub, on, onToggle }) {
  return (
    <div className="cfg-toggle-row">
      <div className="cfg-toggle-row__text">
        <span className="cfg-toggle-row__title">{title}</span>
        {sub && <span className="cfg-toggle-row__sub">{sub}</span>}
      </div>
      <Toggle on={on} onToggle={onToggle} label={title} />
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
              <button className="cfg-panel__back" onClick={onBack}>
                <div className="cfg-panel__back-icon"><ArrowLeft size={16} /></div>
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

function ChipGroup({ options, value, onChange }) {
  return (
    <div className="cfg-chip-group">
      {options.map((opt) => (
        <button
          key={opt}
          className={`cfg-chip ${value === opt ? "cfg-chip--active" : ""}`}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
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

export default function SettingsPage() {
  const { collapsed } = useSidebarContext();
  const { user, logout, refreshUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nome: "", email: "",
    senhaAtual: "", senhaNova: "", confirmarSenha: "",
  });
  const [tipoPerfil, setTipoPerfil] = useState("ALUNO");
  const [matricula, setMatricula] = useState("");

  const [notif, setNotif] = useState({
    geral: true, sons: true, vibracao: false,
    mensagens: true, mencoes: true, projetos: true,
    comentarios: false, prazos: true,
    emailResumo: true, emailAvisos: true,
  });
  const [aparencia, setAparencia] = useState({ cor: "Azul", fonte: "Média", seguirSistema: false });

  useEffect(() => {
    if (!user?.id) return;
    userService.getById(user.id)
      .then((profile) => {
        setForm((prev) => ({
          ...prev,
          nome: profile.nome ?? "",
          email: profile.email ?? "",
        }));
        setTipoPerfil(profile.tipo ?? user?.tipo ?? "ALUNO");
        setMatricula(profile.ra ?? "");
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

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
      toast.error("A confirma��o de senha n�o confere.");
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
      toast.error(err.message || "N�o foi poss�vel alterar a senha.");
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
        <Avatar name={form.nome} size={52} />
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
        <SectionLabel>Notificações</SectionLabel>
        <SectionGroup>
          <NavItem icon={Bell} iconClass="icon-yellow" title="Notificações" sub="Alertas, menções, projetos" badge={3} onClick={() => open("notificacoes")} />
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
          <Avatar name={form.nome} size={64} />
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

      <Panel panelId="notificacoes" title="Notificações" {...panelProps}>
        <SectionLabel>Geral</SectionLabel>
        <SectionGroup>
          <ToggleRow title="Ativar notificações" sub="Todas as notificações do app" on={notif.geral} onToggle={() => setNotif((n) => ({ ...n, geral: !n.geral }))} />
          <ToggleRow title="Sons" on={notif.sons} onToggle={() => setNotif((n) => ({ ...n, sons: !n.sons }))} />
          <ToggleRow title="Vibração" on={notif.vibracao} onToggle={() => setNotif((n) => ({ ...n, vibracao: !n.vibracao }))} />
        </SectionGroup>
        <SectionLabel>Atividade</SectionLabel>
        <SectionGroup>
          <ToggleRow title="Mensagens diretas" on={notif.mensagens} onToggle={() => setNotif((n) => ({ ...n, mensagens: !n.mensagens }))} />
          <ToggleRow title="Menções" on={notif.mencoes} onToggle={() => setNotif((n) => ({ ...n, mencoes: !n.mencoes }))} />
          <ToggleRow title="Atualizações de projetos" on={notif.projetos} onToggle={() => setNotif((n) => ({ ...n, projetos: !n.projetos }))} />
          <ToggleRow title="Comentários" on={notif.comentarios} onToggle={() => setNotif((n) => ({ ...n, comentarios: !n.comentarios }))} />
          <ToggleRow title="Prazos e lembretes" on={notif.prazos} onToggle={() => setNotif((n) => ({ ...n, prazos: !n.prazos }))} />
        </SectionGroup>
        <SectionLabel>Email</SectionLabel>
        <SectionGroup>
          <ToggleRow title="Resumo semanal" on={notif.emailResumo} onToggle={() => setNotif((n) => ({ ...n, emailResumo: !n.emailResumo }))} />
          <ToggleRow title="Avisos importantes" on={notif.emailAvisos} onToggle={() => setNotif((n) => ({ ...n, emailAvisos: !n.emailAvisos }))} />
        </SectionGroup>
      </Panel>

      <Panel panelId="aparencia" title="Aparência" {...panelProps}>
        <SectionLabel>Tema</SectionLabel>
        <SectionGroup>
          <ToggleRow title="Modo escuro" sub="Salvo no navegador" on={isDark} onToggle={toggleTheme} />
          <ToggleRow title="Seguir sistema" sub="Usar preferência do dispositivo" on={aparencia.seguirSistema} onToggle={() => setAparencia((a) => ({ ...a, seguirSistema: !a.seguirSistema }))} />
        </SectionGroup>
        <SectionLabel>Cor de destaque</SectionLabel>
        <ChipGroup options={["Azul", "Verde", "Roxo", "Laranja", "Rosa"]} value={aparencia.cor} onChange={(v) => setAparencia((a) => ({ ...a, cor: v }))} />
        <SectionLabel>Tamanho da fonte</SectionLabel>
        <ChipGroup options={["Pequena", "Média", "Grande"]} value={aparencia.fonte} onChange={(v) => setAparencia((a) => ({ ...a, fonte: v }))} />
        <PrimaryBtn style={{ marginTop: 20 }} onClick={() => toast.success("Preferências salvas.")}>
          Salvar preferências
        </PrimaryBtn>
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