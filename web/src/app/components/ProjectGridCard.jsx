import { memo } from "react";
import { motion } from "framer-motion";
import { CaretRight, Clock, FolderOpen, Users } from "@phosphor-icons/react";
import { getProjectSlotsUsage } from "../utils/adapters";
import { formatProjectStatus } from "../utils/formatters";
import { AdvisorAvatar } from "./ProjectGridCardAvatar";

function ProjectGridCard({ project, index, onOpen }) {
  const slots = getProjectSlotsUsage(project);
  const isFull = slots.remaining <= 0;
  const statusClass = project.status === "FINALIZADO"
    ? "projeto-card__status--encerrado"
    : project.status === "EM_ANDAMENTO"
      ? "projeto-card__status--andamento"
      : isFull
        ? "projeto-card__status--encerrado"
        : "projeto-card__status--aberto";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      whileHover={{ y: -2, boxShadow: "0 18px 30px rgba(37,99,235,0.14)" }}
      onClick={() => onOpen(project.id)}
      className="projeto-card"
    >
      <div className="projeto-card__corpo">
        <div className="projeto-card__cabecalho">
          <span className={`projeto-card__status ${statusClass}`}>
            {isFull && project.status === "ABERTO" ? "Cheio" : formatProjectStatus(project.status)}
          </span>
        </div>
        <h3 className="projeto-card__titulo">{project.title}</h3>
        <p className="projeto-card__descricao">{project.description}</p>
        <div className="projeto-card__tags">
          {project.tags.slice(0, 3).map((tag) => <span key={tag} className="projeto-card__etiqueta">{tag}</span>)}
        </div>
        <div className="projeto-card__informacoes">
          <div className="projeto-card__info-item">
            <div className="projeto-card__info-icone"><Users size={12} /></div>
            <p className="projeto-card__info-valor">{`${slots.used} / ${slots.total}`}</p>
            <p className="projeto-card__info-rotulo">vagas ocupadas</p>
          </div>
          <div className="projeto-card__info-item">
            <div className="projeto-card__info-icone"><Clock size={12} /></div>
            <p className="projeto-card__info-valor">{project.createdAt ? new Date(project.createdAt).toLocaleDateString("pt-BR") : "-"}</p>
            <p className="projeto-card__info-rotulo">publicado</p>
          </div>
          <div className="projeto-card__info-item">
            <div className="projeto-card__info-icone"><FolderOpen size={12} /></div>
            <p className="projeto-card__info-valor">{project.area}</p>
            <p className="projeto-card__info-rotulo">área</p>
          </div>
        </div>
        <div className="projeto-card__orientador">
          <div className="projeto-card__orientador-dados">
            <AdvisorAvatar advisor={project.advisor} />
            <span className="projeto-card__nome-orientador">
              {project.advisor?.name ? `${project.advisor.name} (orientador)` : "Sem orientador"}
            </span>
          </div>
          <CaretRight size={14} className="projeto-card__seta-acesso" />
        </div>
      </div>
    </motion.div>
  );
}

export default memo(ProjectGridCard);
