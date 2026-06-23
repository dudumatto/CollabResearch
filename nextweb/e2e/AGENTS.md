# Regras locais — E2E Playwright

- Todo teste precisa ser independente, executável em paralelo e baseado em dados/contas E2E controlados.
- Teste o que o usuário vê e faz. Use `getByRole`, `getByLabel`, `getByText` ou `getByTestId` quando necessário.
- Proibidos: XPath, seletores por classe/DOM, `nth-child`, `ElementHandle`, `waitForTimeout`, sleeps e dependência entre specs.
- Após uma ação, valide o efeito: URL, estado, mensagem, valor salvo, item listado, download ou persistência após recarregar.
- Page Object somente para tela/fluxo reutilizado ou complexo. Assertions de negócio permanecem no spec.
- Sessões em `playwright/.auth/` e artefatos em `test-results/`/`playwright-report/` não entram no Git.
- A suíte funcional ignora `performance/**`. Benchmarks são manuais, build de produção, `workers: 1` e comando próprio.
- Ao editar testes, execute o spec afetado e a suíte do domínio. Em falhas, abra trace/HTML report antes de alterar timeout ou retry.
