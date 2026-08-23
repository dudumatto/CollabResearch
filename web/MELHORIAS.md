# Melhorias futuras — Dashboard do orientador

Este arquivo registra as integrações que ainda precisam ser implementadas para que os novos blocos do dashboard exibam dados reais. Enquanto o backend não fornecer essas informações, a interface apresenta estados vazios explícitos e não inventa prazos ou atividades.

## Agenda / próximos prazos

- Adicionar ao contrato do dashboard uma lista de próximos prazos ou criar um endpoint específico para essa consulta.
- Usar como fonte somente datas já registradas no sistema, como prazos das etapas de progresso e datas de entregas. Reuniões de orientação só devem aparecer quando existir um modelo próprio para elas.
- Sugestão de contrato mínimo:

```json
{
  "agenda": [
    {
      "id": 1,
      "titulo": "Entrega da etapa",
      "data": "2026-08-26T23:59:00-03:00",
      "tipo": "ETAPA",
      "projetoId": 10,
      "destino": "/app/progress",
      "status": "PENDENTE"
    }
  ]
}
```

- Ordenar no backend pelos prazos futuros mais próximos e definir uma quantidade máxima para o resumo do dashboard.
- Manter a página completa de prazos em `/app/deadlines` como destino do botão **Abrir agenda**.

## Atividade recente

- Criar uma fonte consolidada de atividades relevantes para o orientador. Exemplos possíveis: nova inscrição, nova entrega, alteração de etapa e ciência de avaliação.
- Evitar montar o histórico apenas com o estado atual das tabelas; o ideal é registrar eventos ou usar uma trilha de auditoria para não perder a ordem real das ações.
- Sugestão de contrato mínimo:

```json
{
  "atividadesRecentes": [
    {
      "id": 1,
      "titulo": "Nova entrega recebida",
      "descricao": "Versão 2 do projeto Exemplo",
      "data": "2026-08-23T10:30:00-03:00",
      "tipo": "ENTREGA",
      "destino": "/app/deliveries"
    }
  ]
}
```

- Ordenar da atividade mais recente para a mais antiga e definir retenção e paginação para a tela completa.
- Enquanto esse histórico não existir, o botão **Ver notificações** leva para `/app/notifications`, que já faz parte da aplicação.

## Integração e testes

- Atualizar `mapOrientadorDashboard` quando os novos campos forem adicionados ao backend, mantendo valores padrão para compatibilidade com respostas antigas.
- Testar os estados vazio, carregando, erro e com dados.
- Validar datas considerando o fuso horário configurado pela aplicação.
- Adicionar testes de contrato no backend e testes de renderização no frontend antes de remover os estados vazios atuais.
