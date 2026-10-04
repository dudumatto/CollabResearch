import { memo, useEffect, useState } from "react";
import { getUserPhotoUrl } from "../utils/adapters";

export const AdvisorAvatar = memo(function AdvisorAvatar({ advisor }) {
  const photoUrl = getUserPhotoUrl(advisor);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [photoUrl]);

  return (
    <div className="projeto-card__avatar-orientador">
      {photoUrl && !failed ? (
        <img
          src={photoUrl}
          alt={`Foto de perfil de ${advisor?.name ?? "orientador"}`}
          loading="lazy"
          decoding="async"
          className={loaded ? "loaded" : undefined}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="projeto-card__iniciais-orientador">
          {(advisor?.name ?? "IC").split(" ").slice(0, 2).map((part) => part[0]).join("")}
        </span>
      )}
    </div>
  );
});
