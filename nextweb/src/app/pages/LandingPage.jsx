"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  CheckCircle,
  ChevronRight,
  ClipboardCheck,
  FileText,
  FlaskConical,
  GraduationCap,
  Menu,
  MessageSquare,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

const navItems = [
  { label: "Plataforma", id: "plataforma" },
  { label: "Recursos", id: "funcionalidades" },
  { label: "Fluxo", id: "como-funciona" },
  { label: "Benefícios", id: "beneficios" },
];

const painPoints = [
  {
    icon: MessageSquare,
    title: "Comunicação com contexto",
    description: "Conversas, decisões e documentos ficam ligados ao projeto, não perdidos em canais paralelos.",
  },
  {
    icon: Search,
    title: "Projetos fáceis de comparar",
    description: "Alunos encontram oportunidades por área, curso e perfil acadêmico antes de se candidatar.",
  },
  {
    icon: ClipboardCheck,
    title: "Acompanhamento sem retrabalho",
    description: "Orientadores veem inscrições, etapas, documentos e feedbacks em uma visão única.",
  },
];

const features = [
  {
    icon: Search,
    title: "Busca de projetos",
    description: "Filtros e cards objetivos ajudam alunos a identificar pesquisas alinhadas ao seu perfil.",
  },
  {
    icon: FileText,
    title: "Inscrição organizada",
    description: "Candidaturas, documentos e status seguem o mesmo fluxo, sem controles paralelos.",
  },
  {
    icon: TrendingUp,
    title: "Progresso rastreável",
    description: "Etapas, atualizações e entregas mostram a evolução real de cada trabalho acadêmico.",
  },
  {
    icon: MessageSquare,
    title: "Feedback em contexto",
    description: "A orientação fica conectada ao histórico do projeto e às contribuições registradas.",
  },
  {
    icon: Bell,
    title: "Alertas relevantes",
    description: "Notificações destacam mudanças em inscrições, mensagens, feedbacks e etapas.",
  },
  {
    icon: Shield,
    title: "Base institucional",
    description: "Papéis, documentos e histórico permanecem preservados em uma experiência segura.",
  },
];

const flowSteps = [
  {
    step: "01",
    title: "Monte o perfil",
    description: "Aluno ou orientador entra com os dados essenciais para participar do fluxo acadêmico.",
  },
  {
    step: "02",
    title: "Conecte projeto e pessoa",
    description: "Projetos ganham clareza, candidatos se inscrevem e orientadores acompanham decisões.",
  },
  {
    step: "03",
    title: "Acompanhe a evolução",
    description: "Etapas, documentos, atualizações e feedbacks permanecem conectados ao trabalho real.",
  },
];

const roleCards = [
  {
    icon: GraduationCap,
    title: "Para alunos",
    items: ["Encontrar projetos com clareza", "Acompanhar inscrições", "Receber feedback em contexto"],
  },
  {
    icon: Users,
    title: "Para orientadores",
    items: ["Publicar oportunidades", "Selecionar candidatos", "Monitorar evolução acadêmica"],
  },
];

const productMetrics = [
  { label: "Projetos ativos", value: "12" },
  { label: "Inscrições em análise", value: "08" },
  { label: "Atualizações recentes", value: "28" },
];

const sectionFadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const itemFadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const buttonMotion = { whileHover: { y: -1 }, whileTap: { scale: 0.98 } };

export default function LandingPage() {
  const router = useRouter();
  const navigate = (path) => router.push(path);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="landing tema-fixo-claro">
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className={`landing__nav ${isScrolled ? "landing__nav--scrollado" : ""}`}
        aria-label="Navegação principal"
      >
        <div className="landing__nav-interno">
          <button
            type="button"
            className="landing__logo"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Ir para o início"
          >
            <span className="landing__logo-icone" aria-hidden="true">
              <FlaskConical size={18} />
            </span>
            <span className="landing__logo-nome">CollabResearch</span>
          </button>

          <div className="landing__nav-links">
            {navItems.map((item) => (
              <a key={item.id} href={`#${item.id}`} className="landing__nav-link">
                {item.label}
              </a>
            ))}
          </div>

          <div className="landing__nav-acoes">
            <motion.button {...buttonMotion} type="button" onClick={() => navigate("/login")} className="landing__botao-entrar">
              Entrar
            </motion.button>
            <motion.button {...buttonMotion} type="button" onClick={() => navigate("/register")} className="landing__botao-criar">
              Criar conta
            </motion.button>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="landing__botao-menu-mobile"
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileMenuOpen ? (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="landing__menu-mobile">
            {navItems.map((item) => (
              <a key={item.id} href={`#${item.id}`} className="landing__menu-mobile-link" onClick={closeMobileMenu}>
                {item.label}
              </a>
            ))}
            <div className="landing__menu-mobile-acoes">
              <button type="button" onClick={() => navigate("/login")} className="landing__menu-mobile-entrar">
                Entrar
              </button>
              <button type="button" onClick={() => navigate("/register")} className="landing__menu-mobile-criar">
                Criar conta
              </button>
            </div>
          </motion.div>
        ) : null}
      </motion.nav>

      <main>
        <section className="landing__hero" aria-labelledby="landing-hero-title">
          <div className="landing__hero-interno">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.36, ease: "easeOut" }}
              className="landing__hero-copy"
            >
              <span className="landing__hero-badge">
                <Sparkles size={14} /> Plataforma acadêmica integrada
              </span>
              <h1 id="landing-hero-title" className="landing__hero-titulo">
                Conecte pesquisa, orientação e progresso acadêmico.
              </h1>
              <p className="landing__hero-subtitulo">
                CollabResearch organiza projetos, inscrições, documentos e acompanhamento em uma experiência única para alunos e orientadores.
              </p>
              <div className="landing__hero-botoes">
                <motion.button {...buttonMotion} type="button" onClick={() => navigate("/register")} className="landing__hero-botao-primario">
                  Criar conta <ArrowRight size={17} />
                </motion.button>
                <motion.button {...buttonMotion} type="button" onClick={() => navigate("/login")} className="landing__hero-botao-secundario">
                  Entrar na plataforma
                </motion.button>
              </div>
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, ease: "easeOut", delay: 0.08 }}
              className="landing__hero-visual"
              aria-label="Prévia do painel CollabResearch"
            >
              <div className="landing__product-shell">
                <div className="landing__product-topbar">
                  <span className="landing__product-mark" aria-hidden="true">
                    <FlaskConical size={14} />
                  </span>
                  <span>Painel acadêmico</span>
                  <span className="landing__product-status">Ativo</span>
                </div>
                <div className="landing__product-grid">
                  {productMetrics.map((metric) => (
                    <div key={metric.label} className="landing__product-metric">
                      <span>{metric.label}</span>
                      <strong>{metric.value}</strong>
                    </div>
                  ))}
                </div>
                <div className="landing__product-progress">
                  <div className="landing__product-progress-header">
                    <span>Projeto em andamento</span>
                    <strong>62%</strong>
                  </div>
                  <div className="landing__product-track">
                    <span />
                  </div>
                  <div className="landing__product-feed">
                    <div className="landing__product-feed-item landing__product-feed-item--active">
                      <CheckCircle size={15} /> Feedback registrado pelo orientador
                    </div>
                    <div className="landing__product-feed-item">
                      <FileText size={15} /> Documento anexado ao projeto
                    </div>
                    <div className="landing__product-feed-item">
                      <Bell size={15} /> Nova inscrição aguardando análise
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </section>

        <section className="landing__proof" aria-label="Resumo da plataforma">
          <div className="landing__proof-interno">
            <div className="landing__proof-item">
              <strong>Fluxo único</strong>
              <span>Projetos, inscrições e progresso conectados.</span>
            </div>
            <div className="landing__proof-item">
              <strong>Perfis claros</strong>
              <span>Experiência pensada para alunos e orientadores.</span>
            </div>
            <div className="landing__proof-item">
              <strong>Histórico preservado</strong>
              <span>Atualizações, documentos e feedbacks com contexto.</span>
            </div>
          </div>
        </section>

        <motion.section id="plataforma" variants={sectionFadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} className="landing__secao">
          <div className="landing__secao-interno landing__split">
            <div className="landing__section-copy">
              <span className="landing__eyebrow">Plataforma</span>
              <h2 className="landing__secao-titulo">A iniciação científica precisa de menos improviso e mais visibilidade.</h2>
              <p className="landing__secao-subtitulo">
                Quando cada etapa vive em um canal diferente, alunos perdem clareza e orientadores gastam tempo reconstruindo histórico.
              </p>
            </div>
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="landing__problem-list">
              {painPoints.map((item) => (
                <motion.article key={item.title} variants={itemFadeUp} className="landing__problem-card">
                  <span className="landing__problem-icon" aria-hidden="true">
                    <item.icon size={18} />
                  </span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </motion.section>

        <motion.section id="beneficios" variants={sectionFadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} className="landing__secao landing__secao--solucao">
          <div className="landing__secao-interno landing__solution-grid">
            <div className="landing__solution-card landing__solution-card--main">
              <span className="landing__eyebrow">Benefícios</span>
              <h2>Uma base operacional para acompanhar pesquisa do começo ao fim.</h2>
              <p>CollabResearch conecta descoberta de projetos, candidatura, orientação e evolução em uma interface coesa.</p>
            </div>
            {roleCards.map((card) => (
              <article key={card.title} className="landing__solution-card">
                <span className="landing__solution-icon" aria-hidden="true">
                  <card.icon size={20} />
                </span>
                <h3>{card.title}</h3>
                <ul>
                  {card.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </motion.section>

        <motion.section id="funcionalidades" variants={sectionFadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="landing__secao">
          <div className="landing__secao-interno">
            <div className="landing__section-copy landing__section-copy--center">
              <span className="landing__eyebrow">Recursos</span>
              <h2 className="landing__secao-titulo">Os blocos essenciais para uma rotina acadêmica rastreável.</h2>
              <p className="landing__secao-subtitulo">Cada recurso reduz ruído e mantém o trabalho de pesquisa fácil de acompanhar.</p>
            </div>
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} className="landing__feature-bento">
              {features.map((feature, index) => (
                <motion.article key={feature.title} variants={itemFadeUp} className={`landing__feature-card ${index === 2 ? "landing__feature-card--wide" : ""}`}>
                  <span className="landing__feature-icon" aria-hidden="true">
                    <feature.icon size={19} />
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </motion.section>

        <motion.section id="como-funciona" variants={sectionFadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} className="landing__secao landing__secao--fluxo">
          <div className="landing__secao-interno">
            <div className="landing__section-copy">
              <span className="landing__eyebrow">Fluxo</span>
              <h2 className="landing__secao-titulo">Um caminho simples para tirar a pesquisa do improviso.</h2>
            </div>
            <div className="landing__flow-list">
              {flowSteps.map((step) => (
                <article key={step.step} className="landing__flow-item">
                  <span>{step.step}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                  <ChevronRight size={17} aria-hidden="true" />
                </article>
              ))}
            </div>
          </div>
        </motion.section>

        <section className="landing__cta" aria-labelledby="landing-cta-title">
          <div className="landing__cta-interno">
            <div>
              <span className="landing__eyebrow">Comece agora</span>
              <h2 id="landing-cta-title">Leve seus projetos acadêmicos para um fluxo mais claro.</h2>
              <p>Crie sua conta ou entre para acompanhar projetos, inscrições e progresso em uma plataforma única.</p>
            </div>
            <div className="landing__cta-botoes">
              <button type="button" onClick={() => navigate("/register")} className="landing__cta-botao-primario">
                Criar conta <ArrowRight size={17} />
              </button>
              <button type="button" onClick={() => navigate("/login")} className="landing__cta-botao-secundario">
                Entrar
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing__rodape">
        <div className="landing__rodape-interno">
          <div className="landing__rodape-brand">
            <span className="landing__rodape-logo" aria-hidden="true">
              <FlaskConical size={15} />
            </span>
            <div>
              <strong>CollabResearch</strong>
              <p>Pesquisa acadêmica, orientação e progresso no mesmo produto.</p>
            </div>
          </div>
          <div className="landing__rodape-colunas">
            <nav className="landing__rodape-links" aria-label="Links da landing page">
              <a href="#plataforma">Plataforma</a>
              <a href="#funcionalidades">Recursos</a>
              <a href="#como-funciona">Fluxo</a>
            </nav>
            <nav className="landing__rodape-links landing__rodape-links--acoes" aria-label="Acesso">
              <button type="button" onClick={() => navigate("/login")}>
                Entrar
              </button>
              <button type="button" onClick={() => navigate("/register")}>
                Criar conta
              </button>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
