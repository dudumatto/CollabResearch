import { motion } from "framer-motion";

export default function ProjectCardSkeleton({ index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="projeto-card projeto-card--skeleton"
      aria-hidden="true"
    >
      {/* barra de cor no topo */}
      <div className="projeto-card__barra-topo skeleton" style={{ borderRadius: "0.75rem 0.75rem 0 0" }} />

      <div className="projeto-card__corpo">
        {/* badge de status */}
        <div className="projeto-card__cabecalho">
          <span className="skeleton" style={{ display: "inline-block", width: 72, height: 20 }} />
        </div>

        {/* título */}
        <div className="skeleton" style={{ width: "80%", height: 18, marginTop: 12 }} />
        <div className="skeleton" style={{ width: "55%", height: 18, marginTop: 8 }} />

        {/* descrição */}
        <div className="skeleton" style={{ width: "100%", height: 13, marginTop: 12 }} />
        <div className="skeleton" style={{ width: "90%", height: 13, marginTop: 6 }} />
        <div className="skeleton" style={{ width: "70%", height: 13, marginTop: 6 }} />

        {/* tags */}
        <div className="projeto-card__tags" style={{ marginTop: 14 }}>
          {[52, 68, 60].map((w, i) => (
            <span
              key={i}
              className="skeleton"
              style={{ display: "inline-block", width: w, height: 22 }}
            />
          ))}
        </div>

        {/* info row */}
        <div className="projeto-card__informacoes" style={{ marginTop: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="projeto-card__info-item">
              <div className="skeleton projeto-card__info-icone" style={{ borderRadius: "50%", width: 22, height: 22 }} />
              <div className="skeleton" style={{ width: 36, height: 12, marginTop: 4 }} />
              <div className="skeleton" style={{ width: 50, height: 10, marginTop: 4 }} />
            </div>
          ))}
        </div>

        {/* orientador */}
        <div className="projeto-card__orientador" style={{ marginTop: 16 }}>
          <div className="projeto-card__orientador-dados">
            <div
              className="skeleton projeto-card__avatar-orientador"
              style={{ borderRadius: "50%", flexShrink: 0 }}
            />
            <div className="skeleton" style={{ width: 120, height: 13 }} />
          </div>
          <div className="skeleton" style={{ width: 14, height: 14 }} />
        </div>
      </div>
    </motion.div>
  );
}
