"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  User, Lock, Laptop, Shield, MessageCircle, Ban,
  Bell, Palette, HelpCircle, Info, LogOut, ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../providers/ThemeProvider";
import { useSidebarContext } from "../layouts/DashboardLayout";
import { userService } from "../services/userService";
import { StatusView } from "../components/StatusView";
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
  const [target, setTarget] = useState(null);

  useEffect(() => {
    setTarget(document.querySelector(".pagina-app__principal"));
  }, []);

  if (!target) return null;
  return createPortal(children, target);
}

function Panel({ panelId, activePanel, title, onBack, children }) {
  const open = activePanel === panelId;
  return (
    <PanelPortal>
      <AnimatePresence>
        {open && (
          <motion.div
            className="cfg-panel"
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

function Select({ children, ...props }) {
  return <select className="cfg-select" {...props}>{children}</select>;
}

function PrimaryBtn({ children, ...props }) {
  return <button className="cfg-btn cfg-btn--primary" {...props}>{children}</button>;
}

function DangerBtn({ children, ...props }) {
  return <button className="cfg-btn cfg-btn--danger" {...props}>{children}</button>;
}

function SessionCard({ device, location, time, ip, current, onEnd }) {
  return (
    <div className="cfg-session-card">
      <div className="cfg-session-card__header">
        <Laptop size={18} className="cfg-session-card__icon" />
        <span className="cfg-session-card__device">{device}</span>
        {current && <span className="cfg-session-card__badge">Atual</span>}
      </div>
      <p className="cfg-session-card__detail">{location} Â· {time}</p>
      <p className="cfg-session-card__detail">IP: {ip}</p>
      {!current && (
        <button className="cfg-session-card__end" onClick={onEnd}>
          Encerrar sessÃ£o
        </button>
      )}
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

function RadioGroup({ options, value, onChange }) {
  return (
    <div className="cfg-radio-group">
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`cfg-radio-item ${value === opt.value ? "cfg-radio-item--selected" : ""}`}
          onClick={() => onChange(opt.value)}
        >
          <span className="cfg-radio-circle">
            {value === opt.value && <span className="cfg-radio-dot" />}
          </span>
          <span className="cfg-radio-text">
            <span className="cfg-radio-label">{opt.label}</span>
            {opt.sub && <span className="cfg-radio-sub">{opt.sub}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

function ChipGroup({ options, value, onChange }) {
  return (
    <div className="cfg-chip-group">
      {options.map((opt) => {
        const option = typeof opt === "string" ? { value: opt, label: opt } : opt;
        return (
          <button
            key={option.value}
            className={`cfg-chip ${value === option.value ? "cfg-chip--active" : ""}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
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

export default function SettingsPage() {
  const router = useRouter();
  const { collapsed } = useSidebarContext();
  const { user, refreshUser, logout } = useAuth();
  const {
    accentColor,
    followSystem,
    fontSize,
    isDark,
    setAccentColor,
    setFontSize,
    setThemeMode,
    toggleTheme,
  } = useTheme();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nome: "", email: "", matricula: "", tipoPerfil: "Aluno",
    senhaAtual: "", senhaNova: "", confirmarSenha: "",
  });

  const [priv, setPriv] = useState({
    visibilidade: "publico",
    mostrarEmail: false, mostrarMatricula: false, mostrarProjetos: true,
  });

  const [mensagensPermissao, setMensagensPermissao] = useState("projetos");

  const [notif, setNotif] = useState({
    geral: true, sons: true, vibracao: false,
    mensagens: true, mencoes: true, projetos: true,
    comentarios: false, prazos: true,
    emailResumo: true, emailAvisos: true,
  });

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    userService.getById(user.id)
      .then((profile) => {
        if (cancelled) return;
        setForm({
          nome: profile.nome ?? "",
          email: profile.email ?? "",
          matricula: profile.matricula ?? "",
          tipoPerfil: profile.tipoPerfil ?? "Aluno",
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => { cancelled = true; };
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
        matricula: form.matricula,
        tipoPerfil: form.tipoPerfil,
      });
      await refreshUser();
      toast.success("ConfiguraÃ§Ãµes salvas com sucesso.");
      setActivePanel(null);
    } catch (err) {
      toast.error(err.message || "NÃ£o foi possÃ­vel salvar as configuraÃ§Ãµes.");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = () => {
    if (!form.senhaAtual || !form.senhaNova || !form.confirmarSenha) {
      toast.error("Preencha todos os campos de senha.");
      return;
    }
    if (form.senhaNova !== form.confirmarSenha) {
      toast.error("A confirmaÃ§Ã£o de senha nÃ£o confere.");
      return;
    }
    toast.info("Backend sem rota de troca de senha â interface preparada.");
    setActivePanel(null);
  };

  const open = (id) => setActivePanel(id);
  const close = () => setActivePanel(null);

  const panelProps = { activePanel, onBack: close };

  if (loading) return <SettingsSkeleton />;

  if (loadError) {
    return <StatusView title="Falha ao carregar configuraÃ§Ãµes" description={loadError.message || "NÃ£o foi possÃ­vel carregar suas configuraÃ§Ãµes."} />;
  }

  return (
    <div className="pagina-configuracoes">

      <div className="cfg-profile-card">
        <Avatar name={form.nome} size={52} />
        <div>
          <p className="cfg-profile-card__name">{form.nome || "\u2014"}</p>
          <p className="cfg-profile-card__sub">{form.email} Â· {form.tipoPerfil}</p>
        </div>
      </div>

      <div className="cfg-section">
        <SectionLabel>Conta</SectionLabel>
        <SectionGroup>
          <NavItem icon={User} iconClass="icon-blue" title="InformaÃ§Ãµes da conta" sub="Nome, email, tipo de perfil" onClick={() => open("conta")} />
          <NavItem icon={Lock} iconClass="icon-purple" title="Senha" sub="Alterar senha de acesso" onClick={() => open("senha")} />
          <NavItem icon={Laptop} iconClass="icon-teal" title="SessÃµes ativas" sub="Dispositivos conectados" onClick={() => open("sessoes")} />
        </SectionGroup>
      </div>

      <div className="cfg-section">
        <SectionLabel>Privacidade</SectionLabel>
        <SectionGroup>
          <NavItem icon={Shield} iconClass="icon-green" title="Privacidade da conta" sub="Visibilidade do perfil" onClick={() => open("privacidade")} />
          <NavItem icon={MessageCircle} iconClass="icon-blue" title="Quem pode me enviar mensagens" sub="Qualquer um, pessoas do projeto..." onClick={() => open("mensagens")} />
          <NavItem icon={Ban} iconClass="icon-red" title="UsuÃ¡rios bloqueados" sub="Gerenciar bloqueios" onClick={() => open("bloqueados")} />
        </SectionGroup>
      </div>

      <div className="cfg-section">
        <SectionLabel>NotificaÃ§Ãµes</SectionLabel>
        <SectionGroup>
          <NavItem icon={Bell} iconClass="icon-yellow" title="NotificaÃ§Ãµes" sub="Alertas, menÃ§Ãµes, projetos" onClick={() => open("notificacoes")} />
        </SectionGroup>
      </div>

      <div className="cfg-section">
        <SectionLabel>AparÃªncia</SectionLabel>
        <SectionGroup>
          <NavItem icon={Palette} iconClass="icon-pink" title="AparÃªncia" sub="Tema, modo escuro" onClick={() => open("aparencia")} />
        </SectionGroup>
      </div>

      <div className="cfg-section">
        <SectionLabel>Suporte</SectionLabel>
        <SectionGroup>
          <NavItem icon={HelpCircle} iconClass="icon-teal" title="Ajuda" sub="Central de ajuda, reportar problema" onClick={() => open("ajuda")} />
          <NavItem icon={Info} iconClass="icon-gray" title="Sobre o app" sub="VersÃ£o, termos, licenÃ§as" onClick={() => open("sobre")} />
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

      <Panel panelId="conta" title="InformaÃ§Ãµes da conta" {...panelProps}>
        <div className="cfg-panel-avatar-row">
          <Avatar name={form.nome} size={64} />
          <div>
            <p className="cfg-profile-card__name">{form.nome}</p>
            <span className="cfg-panel-avatar-change">Alterar foto de perfil</span>
          </div>
        </div>
        <FormGroup label="Nome completo">
          <Input value={form.nome} onChange={(e) => handleInput("nome", e.target.value)} />
        </FormGroup>
        <FormGroup label="Email">
          <Input value={form.email} onChange={(e) => handleInput("email", e.target.value)} />
        </FormGroup>
        <FormGroup label="MatrÃ­cula">
          <Input value={form.matricula} onChange={(e) => handleInput("matricula", e.target.value)} />
        </FormGroup>
        <FormGroup label="Tipo de perfil">
          <Select value={form.tipoPerfil} onChange={(e) => handleInput("tipoPerfil", e.target.value)}>
            <option>Aluno</option>
            <option>Professor</option>
            <option>Coordenador</option>
          </Select>
        </FormGroup>
        <PrimaryBtn onClick={saveProfile} disabled={saving}>
          {saving ? "Salvando..." : "Salvar alteraÃ§Ãµes"}
        </PrimaryBtn>
      </Panel>

      <Panel panelId="senha" title="Alterar senha" {...panelProps}>
        <FormGroup label="Senha atual">
          <Input type="password" placeholder="â¢â¢â¢â¢â¢â¢â¢â¢" value={form.senhaAtual} onChange={(e) => handleInput("senhaAtual", e.target.value)} />
        </FormGroup>
        <FormGroup label="Nova senha">
          <Input type="password" placeholder="â¢â¢â¢â¢â¢â¢â¢â¢" value={form.senhaNova} onChange={(e) => handleInput("senhaNova", e.target.value)} />
        </FormGroup>
        <FormGroup label="Confirmar nova senha">
          <Input type="password" placeholder="â¢â¢â¢â¢â¢â¢â¢â¢" value={form.confirmarSenha} onChange={(e) => handleInput("confirmarSenha", e.target.value)} />
        </FormGroup>
        <div className="cfg-password-hint">
          <p className="cfg-password-hint__title">A senha deve conter:</p>
          <p>Â· MÃ­nimo 8 caracteres</p>
          <p>Â· Letras maiÃºsculas e minÃºsculas</p>
          <p>Â· Pelo menos um nÃºmero</p>
        </div>
        <PrimaryBtn onClick={changePassword}>Alterar senha</PrimaryBtn>
      </Panel>

      <Panel panelId="sessoes" title="SessÃµes ativas" {...panelProps}>
        <SessionCard device="Chrome Â· Windows" location="SÃ£o Paulo, BR" time="Agora" ip="187.64.xxx.xxx" current />
        <SessionCard device="Safari Â· iPhone" location="SÃ£o Paulo, BR" time="HÃ¡ 2 dias" ip="187.64.xxx.xxx" onEnd={() => toast.success("SessÃ£o encerrada.")} />
        <DangerBtn style={{ marginTop: 8 }} onClick={() => toast.success("Outras sessÃµes encerradas.")}>
          Encerrar todas as outras sessÃµes
        </DangerBtn>
      </Panel>

      <Panel panelId="privacidade" title="Privacidade da conta" {...panelProps}>
        <p className="cfg-panel-desc">Controle quem pode ver seu perfil e suas informaÃ§Ãµes.</p>
        <SectionLabel>Visibilidade do perfil</SectionLabel>
        <RadioGroup
          value={priv.visibilidade}
          onChange={(v) => setPriv((p) => ({ ...p, visibilidade: v }))}
          options={[
            { value: "publico", label: "PÃºblico", sub: "Qualquer usuÃ¡rio pode ver seu perfil" },
            { value: "projetos", label: "Apenas projetos", sub: "SÃ³ membros dos seus projetos" },
            { value: "privado", label: "Privado", sub: "Somente vocÃª" },
          ]}
        />
        <SectionLabel>InformaÃ§Ãµes visÃ­veis</SectionLabel>
        <SectionGroup>
          <ToggleRow title="Mostrar email" on={priv.mostrarEmail} onToggle={() => setPriv((p) => ({ ...p, mostrarEmail: !p.mostrarEmail }))} />
          <ToggleRow title="Mostrar matrÃ­cula" on={priv.mostrarMatricula} onToggle={() => setPriv((p) => ({ ...p, mostrarMatricula: !p.mostrarMatricula }))} />
          <ToggleRow title="Mostrar projetos" on={priv.mostrarProjetos} onToggle={() => setPriv((p) => ({ ...p, mostrarProjetos: !p.mostrarProjetos }))} />
        </SectionGroup>
        <PrimaryBtn style={{ marginTop: 16 }} onClick={() => toast.success("PreferÃªncias salvas.")}>
          Salvar preferÃªncias
        </PrimaryBtn>
      </Panel>

      <Panel panelId="mensagens" title="Quem pode me enviar mensagens" {...panelProps}>
        <p className="cfg-panel-desc">Escolha quem tem permissÃ£o para iniciar uma conversa com vocÃª.</p>
        <RadioGroup
          value={mensagensPermissao}
          onChange={setMensagensPermissao}
          options={[
            { value: "todos", label: "Qualquer pessoa", sub: "Qualquer usuÃ¡rio da plataforma" },
            { value: "projetos", label: "Pessoas do projeto", sub: "Apenas membros dos seus projetos" },
            { value: "seguindo", label: "Pessoas que sigo", sub: "Apenas quem vocÃª segue" },
            { value: "ninguem", label: "NinguÃ©m", sub: "Desativar mensagens diretas" },
          ]}
        />
        <PrimaryBtn style={{ marginTop: 16 }} onClick={() => toast.success("PreferÃªncia salva.")}>
          Salvar
        </PrimaryBtn>
      </Panel>

      <Panel panelId="bloqueados" title="UsuÃ¡rios bloqueados" {...panelProps}>
        <div className="cfg-empty-state">
          <Ban size={36} className="cfg-empty-state__icon" />
          <p className="cfg-empty-state__title">Nenhum usuÃ¡rio bloqueado</p>
          <p className="cfg-empty-state__sub">UsuÃ¡rios bloqueados nÃ£o conseguem ver seu perfil ou enviar mensagens</p>
        </div>
      </Panel>

      <Panel panelId="notificacoes" title="NotificaÃ§Ãµes" {...panelProps}>
        <SectionLabel>Geral</SectionLabel>
        <SectionGroup>
          <ToggleRow title="Ativar notificaÃ§Ãµes" sub="Todas as notificaÃ§Ãµes do app" on={notif.geral} onToggle={() => setNotif((n) => ({ ...n, geral: !n.geral }))} />
          <ToggleRow title="Sons" on={notif.sons} onToggle={() => setNotif((n) => ({ ...n, sons: !n.sons }))} />
          <ToggleRow title="VibraÃ§Ã£o" on={notif.vibracao} onToggle={() => setNotif((n) => ({ ...n, vibracao: !n.vibracao }))} />
        </SectionGroup>
        <SectionLabel>Atividade</SectionLabel>
        <SectionGroup>
          <ToggleRow title="Mensagens diretas" on={notif.mensagens} onToggle={() => setNotif((n) => ({ ...n, mensagens: !n.mensagens }))} />
          <ToggleRow title="MenÃ§Ãµes" on={notif.mencoes} onToggle={() => setNotif((n) => ({ ...n, mencoes: !n.mencoes }))} />
          <ToggleRow title="AtualizaÃ§Ãµes de projetos" on={notif.projetos} onToggle={() => setNotif((n) => ({ ...n, projetos: !n.projetos }))} />
          <ToggleRow title="ComentÃ¡rios" on={notif.comentarios} onToggle={() => setNotif((n) => ({ ...n, comentarios: !n.comentarios }))} />
          <ToggleRow title="Prazos e lembretes" on={notif.prazos} onToggle={() => setNotif((n) => ({ ...n, prazos: !n.prazos }))} />
        </SectionGroup>
        <SectionLabel>Email</SectionLabel>
        <SectionGroup>
          <ToggleRow title="Resumo semanal" on={notif.emailResumo} onToggle={() => setNotif((n) => ({ ...n, emailResumo: !n.emailResumo }))} />
          <ToggleRow title="Avisos importantes" on={notif.emailAvisos} onToggle={() => setNotif((n) => ({ ...n, emailAvisos: !n.emailAvisos }))} />
        </SectionGroup>
      </Panel>

      <Panel panelId="aparencia" title="AparÃªncia" {...panelProps}>
        <SectionLabel>Tema</SectionLabel>
        <SectionGroup>
          <ToggleRow title="Modo escuro" sub={followSystem ? "Seguindo preferência do dispositivo" : "Salvo no navegador"} on={isDark} onToggle={toggleTheme} />
          <ToggleRow title="Seguir sistema" sub="Usar preferência do dispositivo" on={followSystem} onToggle={() => setThemeMode(followSystem ? (isDark ? "dark" : "light") : "system")} />
        </SectionGroup>
        <SectionLabel>Cor de destaque</SectionLabel>
        <ChipGroup
          options={[
            { value: "azul", label: "Azul" },
            { value: "verde", label: "Verde" },
            { value: "roxo", label: "Roxo" },
            { value: "laranja", label: "Laranja" },
            { value: "rosa", label: "Rosa" },
          ]}
          value={accentColor}
          onChange={setAccentColor}
        />
        <SectionLabel>Tamanho da fonte</SectionLabel>
        <ChipGroup
          options={[
            { value: "pequena", label: "Pequena" },
            { value: "media", label: "Média" },
            { value: "grande", label: "Grande" },
          ]}
          value={fontSize}
          onChange={setFontSize}
        />
        <PrimaryBtn style={{ marginTop: 20 }} onClick={() => toast.success("PreferÃªncias salvas.")}>
          Salvar preferÃªncias
        </PrimaryBtn>
      </Panel>

      <Panel panelId="ajuda" title="Ajuda" {...panelProps}>
        <SectionGroup>
          {[
            { title: "Central de ajuda", sub: "Tutoriais e documentaÃ§Ã£o" },
            { title: "Reportar um problema", sub: "Nos ajude a melhorar" },
            { title: "Avaliar o app", sub: "Sua opiniÃ£o importa" },
            { title: "Falar com suporte", sub: "suporte@universidade.edu.br" },
          ].map((item) => (
            <button key={item.title} className="cfg-help-item">
              <span className="cfg-help-item__text">
                <span className="cfg-help-item__title">{item.title}</span>
                <span className="cfg-help-item__sub">{item.sub}</span>
              </span>
              <ChevronRight size={16} className="cfg-nav-item__chevron" />
            </button>
          ))}
        </SectionGroup>
      </Panel>

      <Panel panelId="sobre" title="Sobre o app" {...panelProps}>
        <div className="cfg-about-header">
          <div className="cfg-about-logo"><Info size={28} /></div>
          <p className="cfg-about-name">CollabResearch</p>
          <p className="cfg-about-version">VersÃ£o 1.0.0 Â· Build 2026.06</p>
          <p className="cfg-about-desc">Plataforma colaborativa universitÃ¡ria para gestÃ£o de projetos de iniciaÃ§Ã£o cientÃ­fica.</p>
        </div>
        <SectionGroup>
          {["Termos de uso", "PolÃ­tica de privacidade", "LicenÃ§as de cÃ³digo aberto"].map((item) => (
            <button key={item} className="cfg-help-item">
              <span className="cfg-help-item__text">
                <span className="cfg-help-item__title">{item}</span>
              </span>
              <ChevronRight size={16} className="cfg-nav-item__chevron" />
            </button>
          ))}
          <div className="cfg-help-item cfg-help-item--info">
            <span className="cfg-help-item__text">
              <span className="cfg-help-item__title">Ãltima atualizaÃ§Ã£o</span>
            </span>
            <span className="cfg-help-item__value">07/06/2026</span>
          </div>
        </SectionGroup>
      </Panel>

      <Panel panelId="logout" title="Sair da conta" {...panelProps}>
        <div className="cfg-logout-confirm">
          <div className="cfg-logout-confirm__icon"><LogOut size={28} /></div>
          <p className="cfg-logout-confirm__title">Sair da conta?</p>
          <p className="cfg-logout-confirm__desc">
            VocÃª precisarÃ¡ fazer login novamente para acessar a plataforma.
          </p>
          <DangerBtn onClick={async () => { await logout(); router.push("/login"); }}>Confirmar saÃ­da</DangerBtn>
          <button className="cfg-logout-confirm__cancel" onClick={close}>Cancelar</button>
        </div>
      </Panel>

    </div>
  );
}
