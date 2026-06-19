import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ProjectCard.css';

const ProjectCard = ({ projeto }) => {
  const navigate = useNavigate();

  const handleManageParticipants = () => {
    navigate(`/app/projects/${projeto.id}/applications`);
  };

  return (
    <div className="project-card">
      <h3>{projeto.titulo}</h3>
      <p>{projeto.descricao}</p>
      <button onClick={handleManageParticipants}>Gerenciar Participantes</button>
    </div>
  );
};

export default ProjectCard;
