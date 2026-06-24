# Security Infrastructure Testing

Phase 4 da suíte de segurança E2E.

## Visão Geral

Esta pasta contém scripts para testes de infraestrutura de segurança, incluindo:

- **Nmap**: Descoberta de portas e serviços
- **Gobuster**: Descoberta de rotas e diretórios
- **Baselines**: Padrões para comparação
- **Relatórios**: Documentação dos resultados

## Requisitos

### Nmap

```bash
# Ubuntu/Debian
sudo apt-get install nmap

# macOS
brew install nmap

# Windows
# Download de: https://nmap.org/download.html
```

### Gobuster

```bash
# Instalar Go (se não instalado)
# https://golang.org/doc/install

# Instalar Gobuster
go install github.com/OJ/gobuster/v3@latest
```

## Estrutura

```
scripts/security/
├── nmap/
│   └── nmap-scan.sh          # Script de scan Nmap
├── gobuster/
│   ├── gobuster-scan.sh      # Script de scan Gobuster
│   └── wordlists/
│       └── common.txt        # Wordlist padrão
├── baselines/
│   ├── ports-baseline.json   # Baseline de portas
│   └── routes-baseline.json  # Baseline de rotas
├── reports/                   # Relatórios gerados
├── run-all.sh                # Script combinado
└── README.md                 # Este arquivo
```

## Uso

### Configurar Target

```bash
# Definir alvo
export SECURITY_TARGET="https://collab-research.vercel.app"

# Ou para backend
export SECURITY_TARGET="https://tcc-backend-jqod.onrender.com"
```

### Executar Scripts Individualmente

```bash
# Nmap scan
bash scripts/security/nmap/nmap-scan.sh

# Gobuster scan
bash scripts/security/gobuster/gobuster-scan.sh

# Scan combinado
bash scripts/security/run-all.sh
```

### via npm

```bash
# Nmap
npm run security:nmap

# Gobuster
npm run security:gobuster

# Infraestrutura completa
npm run security:infra
```

## Baselines

### Criar Baseline

Após o primeiro scan, copie os resultados para os arquivos baseline:

```bash
# Editar baselines
vim scripts/security/baselines/ports-baseline.json
vim scripts/security/baselines/routes-baseline.json
```

### Formato dos Baselines

**ports-baseline.json**:
```json
{
  "target": "http://127.0.0.1:5173",
  "allowed_ports": [80, 443],
  "dangerous_ports": [21, 22, 23, 3306, 5432, 6379, 27017, 8080],
  "created": "2026-06-23"
}
```

**routes-baseline.json**:
```json
{
  "target": "http://127.0.0.1:5173",
  "allowed": ["/", "/login", "/register", "/app"],
  "dangerous": ["/admin", "/swagger", "/.env", "/.git"],
  "created": "2026-06-23"
}
```

## Relatórios

Os relatórios são gerados em `scripts/security/reports/` com formato:

```
nmap-report-YYYYMMDD_HHMMSS.md
gobuster-report-YYYYMMDD_HHMMSS.md
infra-report-YYYYMMDD_HHMMSS.md
```

### Interpretação

- **OK**: Porta/rota conforme esperado
- **Warning**: Exposição que deve ser revisada
- **Critical**: Exposição que deve ser corrigida imediatamente

## Portas Perigosas

| Porta | Serviço | Risco |
|-------|---------|-------|
| 21 | FTP | Cleartext credentials |
| 22 | SSH | Brute force |
| 23 | Telnet | Cleartext everything |
| 3306 | MySQL | Database exposed |
| 5432 | PostgreSQL | Database exposed |
| 6379 | Redis | No auth by default |
| 27017 | MongoDB | No auth by default |
| 8080 | HTTP Alt | Often unsecured |

## Rotas Perigosas

| Rota | Risco |
|------|-------|
| /admin | Admin panel exposed |
| /swagger | API docs exposed |
| /swagger-ui | Swagger UI exposed |
| /api-docs | API docs exposed |
| /debug | Debug endpoints |
| /internal | Internal routes |
| /backup | Backup files |
| /uploads | Upload directory |
| /.env | Environment variables |
| /.git | Source code exposed |

## Automação CI/CD

### GitHub Actions

```yaml
- name: Security Infrastructure Scan
  run: |
    export SECURITY_TARGET=${{ secrets.PRODUCTION_URL }}
    bash scripts/security/run-all.sh
  if: github.ref == 'refs/heads/main'
```

### Cron Job

```bash
# Scan diário
0 2 * * * cd /path/to/project && bash scripts/security/run-all.sh
```

## Solução de Problemas

### Nmap não encontrado

```bash
# Verificar instalação
nmap --version

# Instalar
sudo apt-get install nmap
```

### Gobuster não encontrado

```bash
# Verificar instalação
gobuster version

# Instalar
go install github.com/OJ/gobuster/v3@latest
```

### Permissões negadas

```bash
# Tornar scripts executáveis
chmod +x scripts/security/*.sh
chmod +x scripts/security/nmap/*.sh
chmod +x scripts/security/gobuster/*.sh
```

## Contribuição

1. Executar scan inicial
2. Criar baselines
3. Documentar findings
4. Submeter para revisão
