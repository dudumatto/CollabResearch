import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  FlaskConical, Search, FileText, TrendingUp, MessageSquare,
  CheckCircle, ArrowRight, Star, Users, Zap, Shield,
  Globe, Menu, X, GraduationCap, Award,
} from "lucide-react";
import "./LandingPage.css";

const navItems = [
  { label: "Problema", id: "problema" },
  { label: "Solução", id: "solucao" },
  { label: "Funcionalidades", id: "funcionalidades" },
  { label: "Como Funciona", id: "como-funciona" },
];

const features = [
  { icon: Search,       title: "Busca Inteligente de Projetos",  description: "Encontre projetos alinhados ao seu perfil com filtros por área, curso e bolsa disponível.", colorClass: "landing__card-feature__icone-area--azul" },
  { icon: FileText,     title: "Inscrição 100% Online",          description: "Candidate-se a projetos, envie documentos e acompanhe tudo em um único lugar.", colorClass: "landing__card-feature__icone-area--violeta" },
  { icon: TrendingUp,   title: "Acompanhamento de Progresso",    description: "Visualize marcos, entregas e evolução do projeto com timelines interativas.", colorClass: "landing__card-feature__icone-area--esmeralda" },
  { icon: MessageSquare,title: "Chat com Orientadores",          description: "Comunicação direta e ágil com seu orientador sem precisar de e-mails.", colorClass: "landing__card-feature__icone-area--laranja" },
  { icon: Star,         title: "Sistema de Feedback",            description: "Receba avaliações detalhadas e construtivas ao longo da pesquisa.", colorClass: "landing__card-feature__icone-area--amarelo" },
  { icon: Shield,       title: "Gestão de Documentos",           description: "Faça upload e gerencie todos os seus documentos acadêmicos com segurança.", colorClass: "landing__card-feature__icone-area--rosa" },
];

const steps = [
  { number: "01", title: "Crie sua conta",            description: "Cadastre-se como aluno ou orientador e complete seu perfil acadêmico." },
  { number: "02", title: "Explore e candidate-se",    description: "Busque projetos por área de interesse e envie sua candidatura online." },
  { number: "03", title: "Desenvolva sua pesquisa",   description: "Acompanhe o progresso, comunique-se com seu orientador e entregue resultados." },
];

const benefits = {
  students: ["Acesso centralizado a projetos de IC","Candidatura simples e rápida","Comunicação direta com orientadores","Acompanhamento do seu progresso","Feedback estruturado e construtivo","Gestão de documentos integrada"],
  advisors: ["Publicação e gestão de projetos","Seleção eficiente de candidatos","Comunicação centralizada","Monitoramento de alunos em tempo real","Emissão de feedbacks organizados","Relatórios e métricas de progresso"],
};

const stats = [
  { value: "500+",   label: "Projetos publicados" },
  { value: "2.400+", label: "Alunos inscritos" },
  { value: "180+",   label: "Orientadores ativos" },
  { value: "94%",    label: "Taxa de satisfação" },
];

const mockupNavItems = [
  { id: "dashboard", active: true },
  { id: "projetos", active: false },
  { id: "mensagens", active: false },
  { id: "perfil", active: false },
];

const problemCards = [
  {
    id: "emails-planilhas",
    icon: "EMAIL",
    title: "E-mails e planilhas",
    desc: "Processos seletivos gerenciados por e-mail, causando perda de informações e atrasos.",
  },
  {
    id: "falta-visibilidade",
    icon: "BUSCA",
    title: "Falta de visibilidade",
    desc: "Alunos não sabem quais projetos estão disponíveis ou como candidatar-se.",
  },
  {
    id: "acompanhamento-manual",
    icon: "CHECK",
    title: "Acompanhamento manual",
    desc: "Sem sistema centralizado, progresso e feedbacks ficam perdidos ou esquecidos.",
  },
];

const sectionFadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemFadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const buttonMotion = { whileHover: { scale: 1.05 }, whileTap: { scale: 0.97 } };

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="landing tema-fixo-claro">
      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`landing__nav ${isScrolled ? "landing__nav--scrollado" : ""}`}
      >
        <div className="landing__nav-interno">
          <div className="landing__logo">
            <div className="landing__logo-icone">
              <FlaskConical size={18} style={{ color: "white" }} />
            </div>
            <span className="landing__logo-nome">CollabResearch</span>
          </div>

          <div className="landing__nav-links">
            {navItems.map((item) => (
              <a key={item.id} href={`#${item.id}`} className="landing__nav-link">{item.label}</a>
            ))}
          </div>

          <div className="landing__nav-acoes">
            <motion.button {...buttonMotion} onClick={() => navigate("/login")} className="landing__botao-entrar">
              Entrar
            </motion.button>
            <motion.button {...buttonMotion} onClick={() => navigate("/register")} className="landing__botao-criar">
              Criar conta
            </motion.button>
          </div>

          <motion.button {...buttonMotion} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="landing__botao-menu-mobile">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>
        </div>

        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="landing__menu-mobile">
            {navItems.map((item) => (
              <a key={item.id} href={`#${item.id}`} className="landing__menu-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                {item.label}
              </a>
            ))}
            <div className="landing__menu-mobile-acoes">
              <motion.button {...buttonMotion} onClick={() => navigate("/login")} className="landing__menu-mobile-entrar">Entrar</motion.button>
              <motion.button {...buttonMotion} onClick={() => navigate("/register")} className="landing__menu-mobile-criar">Criar conta grátis</motion.button>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* Hero */}
      <section className="landing__hero">
        <div className="landing__hero-decoracao-direita" aria-hidden="true" />
        <div className="landing__hero-decoracao-esquerda" aria-hidden="true" />

        <div className="landing__hero-interno">
          <div className="landing__hero-flex">
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="landing__hero-texto"
            >

              <h1 className="landing__hero-titulo">
                Sua pesquisa começa{" "}
                <span className="landing__hero-titulo-destaque">aqui.</span>
              </h1>

              <p className="landing__hero-subtitulo">
                A plataforma completa para alunos encontrarem projetos de iniciação científica e orientadores gerirem suas pesquisas de forma simples e eficiente.
              </p>

              <div className="landing__hero-botoes">
                <motion.button {...buttonMotion} onClick={() => navigate("/register")} className="landing__hero-botao-primario">
                  Criar conta grátis <ArrowRight size={18} />
                </motion.button>
                <motion.button {...buttonMotion} onClick={() => navigate("/login")} className="landing__hero-botao-secundario">
                  Fazer login
                </motion.button>
              </div>

              <div className="landing__hero-checklist">
                {["Gratuito para estudantes", "Seguro e confiável", "Suporte ativo"].map((item) => (
                  <div key={item} className="landing__hero-check-item">
                    <CheckCircle size={14} className="landing__hero-check-icone" />
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="landing__hero-visual"
            >
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }} className="landing__mockup">
                <div className="landing__mockup-janela">
                  <div className="landing__mockup-barra">
                    <div className="landing__mockup-circulo--vermelho" />
                    <div className="landing__mockup-circulo--amarelo" />
                    <div className="landing__mockup-circulo--verde" />
                    <div className="landing__mockup-url">
                      <span className="landing__mockup-url-texto">app.iniciacao.edu.br</span>
                    </div>
                  </div>
                  <div className="landing__mockup-conteudo">
                    <div className="landing__mockup-sidebar">
                      <div className="landing__mockup-logo">
                        <FlaskConical size={12} style={{ color: "white" }} />
                      </div>
                      {mockupNavItems.map((item) => (
                        <div key={item.id} className={`landing__mockup-nav-item ${item.active ? "landing__mockup-nav-item--ativo" : "landing__mockup-nav-item--inativo"}`}>
                          <div className="landing__mockup-nav-dot" />
                        </div>
                      ))}
                    </div>
                    <div className="landing__mockup-painel">
                      <div className="landing__mockup-grade">
                        {[
                          { label: "Projetos ativos", value: "1", colorClass: "landing__mockup-card-azul" },
                          { label: "Inscrições",       value: "3", colorClass: "landing__mockup-card-violeta" },
                          { label: "Mensagens",        value: "2", colorClass: "landing__mockup-card-verde" },
                          { label: "Notificações",     value: "3", colorClass: "landing__mockup-card-laranja" },
                        ].map((s) => (
                          <div key={s.label} className="landing__mockup-card-mini">
                            <span className="landing__mockup-card-label">{s.label}</span>
                            <p className={`landing__mockup-card-valor ${s.colorClass}`}>{s.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="landing__mockup-progresso">
                        <div className="landing__mockup-prog-linha">
                          <span className="landing__mockup-prog-nome">Projeto NLP</span>
                          <span className="landing__mockup-prog-badge">Aprovado</span>
                        </div>
                        <div className="landing__mockup-trilha">
                          <div className="landing__mockup-barra-prog" />
                        </div>
                        <p className="landing__mockup-prog-texto">35% concluído</p>
                      </div>
                    </div>
                  </div>
                </div>

                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="landing__toast landing__toast--esquerda">
                  <div className="landing__toast-interno">
                    <div className="landing__toast-icone landing__toast-icone--verde">
                      <CheckCircle size={16} />
                    </div>
                    <div>
                      <span className="landing__toast-titulo">Inscrição aprovada!</span>
                      <span className="landing__toast-subtitulo">Projeto NLP - agora</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }} className="landing__toast landing__toast--direita">
                  <div className="landing__toast-interno">
                    <div className="landing__toast-icone landing__toast-icone--azul">
                      <MessageSquare size={16} />
                    </div>
                    <div>
                      <span className="landing__toast-titulo">Nova mensagem</span>
                      <span className="landing__toast-subtitulo">Prof. Ana Carolina</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <motion.section variants={sectionFadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} className="landing__stats">
        <div className="landing__stats-interno">
          <div className="landing__stats-grade">
            {stats.map((stat) => (
              <div key={stat.label} className="landing__stat-item">
                <p className="landing__stat-valor">{stat.value}</p>
                <p className="landing__stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Problema */}
      <motion.section id="problema" variants={sectionFadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="landing__secao">
        <div className="landing__secao-interno">
          <div className="landing__secao-cabecalho">
            <span className="landing__secao-badge landing__secao-badge--vermelho">O Problema</span>
            <h2 className="landing__secao-titulo">
              A iniciação científica ainda é <span className="landing__secao-titulo-destaque--vermelho">caótica</span>
            </h2>
            <p className="landing__secao-subtitulo">
              Hoje, o processo envolve e-mails dispersos, planilhas desatualizadas e comunicações confusas.
            </p>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="landing__grade-3">
            {problemCards.map((item) => (
              <motion.div key={item.id} variants={itemFadeUp} whileHover={{ scale: 1.03 }} className="landing__card-problema">
                <div className="landing__card-problema__emoji">{item.marker}</div>
                <h3 className="landing__card-problema__titulo">{item.title}</h3>
                <p className="landing__card-problema__descricao">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Solução */}
      <motion.section id="solucao" variants={sectionFadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="landing__secao landing__secao--gradiente-azul">
        <div className="landing__secao-gradiente-decoracao">
          <div className="landing__secao-gradiente-bola-1" />
          <div className="landing__secao-gradiente-bola-2" />
        </div>
        <div className="landing__secao-interno" style={{ textAlign: "center", position: "relative" }}>
          <span className="landing__secao-badge landing__secao-badge--branco">A Solução</span>
          <h2 className="landing__secao-titulo landing__secao-titulo--branco">Uma plataforma feita para a pesquisa acadêmica</h2>
          <p className="landing__secao-subtitulo--azul-claro">
            O <strong style={{ color: "white" }}>CollabResearch</strong> centraliza todo o ecossistema de iniciação científica.
          </p>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} className="landing__grade-solucao">
            {[
              { icon: Users, label: "Para alunos e orientadores" },
              { icon: Globe, label: "100% online e acessível" },
              { icon: Zap,   label: "Rápido e fácil de usar" },
            ].map((item) => (
              <motion.div key={item.label} variants={itemFadeUp} whileHover={{ scale: 1.03 }} className="landing__card-solucao">
                <item.icon size={20} style={{ flexShrink: 0 }} />
                <span className="landing__card-solucao-texto">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Funcionalidades */}
      <motion.section id="funcionalidades" variants={sectionFadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="landing__secao">
        <div className="landing__secao-interno">
          <div className="landing__secao-cabecalho">
            <span className="landing__secao-badge landing__secao-badge--azul">Funcionalidades</span>
            <h2 className="landing__secao-titulo">Tudo que você precisa, em um só lugar</h2>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} className="landing__grade-3">
            {features.map((feature) => (
              <motion.div key={feature.title} variants={itemFadeUp} whileHover={{ scale: 1.03 }} className="landing__card-feature">
                <div className={`landing__card-feature__icone-area ${feature.colorClass}`}>
                  <feature.icon size={22} />
                </div>
                <h3 className="landing__card-feature__titulo">{feature.title}</h3>
                <p className="landing__card-feature__descricao">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Como funciona */}
      <motion.section id="como-funciona" variants={sectionFadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="landing__secao landing__secao--fundo">
        <div className="landing__secao-interno">
          <div className="landing__secao-cabecalho">
            <span className="landing__secao-badge landing__secao-badge--violeta">Como Funciona</span>
            <h2 className="landing__secao-titulo">Simples como 1, 2, 3</h2>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} className="landing__grade-3" style={{ position: "relative" }}>
            {steps.map((step) => (
              <motion.div key={step.number} variants={itemFadeUp} className="landing__passo">
                <div className="landing__passo-numero">
                  <span className="landing__passo-numero-texto">{step.number}</span>
                </div>
                <h3 className="landing__passo-titulo">{step.title}</h3>
                <p className="landing__passo-descricao">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Benefícios */}
      <motion.section variants={sectionFadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="landing__secao">
        <div className="landing__secao-interno">
          <div className="landing__secao-cabecalho">
            <span className="landing__secao-badge landing__secao-badge--esmeralda">Benefícios</span>
            <h2 className="landing__secao-titulo">Para toda a comunidade acadêmica</h2>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="landing__grade-2">
            <motion.div variants={itemFadeUp} whileHover={{ scale: 1.03 }} className="landing__card-beneficios landing__card-beneficios--alunos">
              <div className="landing__card-beneficios__cabecalho">
                <div className="landing__card-beneficios__icone landing__card-beneficios__icone--azul">
                  <GraduationCap size={22} style={{ color: "white" }} />
                </div>
                <h3 className="landing__card-beneficios__titulo">Para Alunos</h3>
              </div>
              <ul className="landing__card-beneficios__lista">
                {benefits.students.map((b) => (
                  <li key={b} className="landing__card-beneficios__item">
                    <CheckCircle size={16} className="landing__beneficio-icone--azul" />{b}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div variants={itemFadeUp} whileHover={{ scale: 1.03 }} className="landing__card-beneficios landing__card-beneficios--orientadores">
              <div className="landing__card-beneficios__cabecalho">
                <div className="landing__card-beneficios__icone landing__card-beneficios__icone--violeta">
                  <Award size={22} style={{ color: "white" }} />
                </div>
                <h3 className="landing__card-beneficios__titulo">Para Orientadores</h3>
              </div>
              <ul className="landing__card-beneficios__lista">
                {benefits.advisors.map((b) => (
                  <li key={b} className="landing__card-beneficios__item">
                    <CheckCircle size={16} className="landing__beneficio-icone--violeta" />{b}
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* CTA final */}
      <motion.section variants={sectionFadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="landing__secao landing__secao--escuro">
        <div className="landing__cta-decoracao" />
        <div className="landing__cta-interno">
          <h2 className="landing__cta-titulo">Comece sua jornada científica hoje</h2>
          <p className="landing__cta-subtitulo">Junte-se a milhares de estudantes e orientadores que ja transformaram sua experiência.</p>
          <div className="landing__cta-botoes">
            <motion.button {...buttonMotion} onClick={() => navigate("/register")} className="landing__cta-botao-primario">
              Criar conta gratis <ArrowRight size={18} />
            </motion.button>
            <motion.button {...buttonMotion} onClick={() => navigate("/login")} className="landing__cta-botao-secundario">
              Já tenho conta
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* Rodapé */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.3 }}
        className="landing__secao landing__secao--rodape"
      >
        <div className="landing__rodape-interno">
          <div className="landing__rodape-conteudo">
            <div className="landing__rodape-logo">
              <div className="landing__rodape-logo-icone">
                <FlaskConical size={15} style={{ color: "white" }} />
              </div>
              <span className="landing__rodape-logo-nome">CollabResearch</span>
            </div>
            <p className="landing__rodape-copyright">© 2025 CollabResearch. Plataforma de Gerenciamento de Iniciação Científica.</p>
            <div className="landing__rodape-links">
              {["Termos", "Privacidade", "Contato"].map((item) => (
                <a key={item} href="#" className="landing__rodape-link">{item}</a>
              ))}
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
