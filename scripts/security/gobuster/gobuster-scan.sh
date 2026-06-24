#!/bin/bash

# Security Infrastructure Scan - Gobuster
# Phase 4: Security Infrastructure Testing

set -e

SECURITY_TARGET="${SECURITY_TARGET:-http://127.0.0.1:5173}"
WORDLIST="${WORDLIST:-$(dirname "$0")/wordlists/common.txt}"
REPORT_DIR="$(dirname "$0")/reports"
BASELINE_DIR="$(dirname "$0")/baselines"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$REPORT_DIR/gobuster-report-${TIMESTAMP}.md"

mkdir -p "$REPORT_DIR" "$(dirname "$0")/wordlists"

echo "=== Security Infrastructure Scan - Gobuster ==="
echo "Target: $SECURITY_TARGET"
echo "Wordlist: $WORDLIST"
echo "Timestamp: $TIMESTAMP"
echo ""

# Function to check if gobuster is installed
check_gobuster() {
    if ! command -v gobuster &> /dev/null; then
        echo "ERROR: gobuster is not installed"
        echo "Install with:"
        echo "  go install github.com/OJ/gobuster/v3@latest"
        echo "  or download from: https://github.com/OJ/gobuster/releases"
        exit 1
    fi
}

# Function to check if wordlist exists
check_wordlist() {
    if [ ! -f "$WORDLIST" ]; then
        echo "ERROR: Wordlist not found at $WORDLIST"
        echo "Creating minimal wordlist..."
        create_default_wordlist
    fi
}

# Function to create default wordlist
create_default_wordlist() {
    cat > "$WORDLIST" << 'EOF'
/
/admin
/api
/api-docs
/backup
/blog
/config
/dashboard
/debug
/docs
/health
/healthcheck
/internal
/login
/logs
/monitor
/old
/private
/register
/robots.txt
/sitemap.xml
/staging
/swagger
/swagger-ui
/swagger-ui.html
/test
/uploads
/user
/users
/v1
/v2
/.env
/.git
/.git/config
/.git/HEAD
/.htaccess
/robots.txt
/sitemap.xml
/well-known/security.txt
EOF
    echo "Default wordlist created: $WORDLIST"
}

# Function to run gobuster
run_gobuster() {
    echo "--- Running Gobuster Directory Scan ---"
    
    gobuster dir \
        -u "$SECURITY_TARGET" \
        -w "$WORDLIST" \
        -t 10 \
        -q \
        --no-error \
        --timeout 10s \
        2>/dev/null || true
}

# Function to parse gobuster output
parse_gobuster_output() {
    local output=$1
    
    # Extract found paths
    FOUND_PATHS=$(echo "$output" | grep -oP '/[^\s]+' | sort -u)
    
    # Count results
    TOTAL_FOUND=$(echo "$FOUND_PATHS" | grep -c '^/' || true)
}

# Function to check for dangerous paths
check_dangerous_paths() {
    local paths=$1
    local warnings=0
    
    DANGEROUS_PATHS="/admin /swagger /swagger-ui /api-docs /debug /internal /test /backup /uploads /storage /.env /.git"
    
    for dangerous in $DANGEROUS_PATHS; do
        if echo "$paths" | grep -qw "$dangerous"; then
            echo "WARNING: Dangerous path found: $dangerous"
            ((warnings++))
        fi
    done
    
    echo $warnings
}

# Function to generate report
generate_report() {
    local scan_output=$1
    local warnings=$2
    
    cat > "$REPORT_FILE" << EOF
# Security Infrastructure Report - Gobuster

**Date**: $(date)
**Target**: $SECURITY_TARGET
**Wordlist**: $(basename "$WORDLIST")

## Scan Results

### Paths Found

| Path | Status |
|------|--------|
EOF
    
    echo "$FOUND_PATHS" | while read -r path; do
        if [ -n "$path" ]; then
            echo "| $path | FOUND |"
        fi
    done >> "$REPORT_FILE"
    
    cat >> "$REPORT_FILE" << EOF

### Statistics

- **Total Paths Scanned**: $(wc -l < "$WORDLIST")
- **Paths Found**: $TOTAL_FOUND
- **Warnings**: $warnings

### Dangerous Paths Check

| Path | Risk | Status |
|------|------|--------|
| /admin | Admin panel exposed | $([ $(echo "$FOUND_PATHS" | grep -cw "/admin") -gt 0 ] && echo "EXPOSED" || echo "OK") |
| /swagger | API docs exposed | $([ $(echo "$FOUND_PATHS" | grep -cw "/swagger") -gt 0 ] && echo "EXPOSED" || echo "OK") |
| /swagger-ui | Swagger UI exposed | $([ $(echo "$FOUND_PATHS" | grep -cw "/swagger-ui") -gt 0 ] && echo "EXPOSED" || echo "OK") |
| /api-docs | API docs exposed | $([ $(echo "$FOUND_PATHS" | grep -cw "/api-docs") -gt 0 ] && echo "EXPOSED" || echo "OK") |
| /debug | Debug endpoint | $([ $(echo "$FOUND_PATHS" | grep -cw "/debug") -gt 0 ] && echo "EXPOSED" || echo "OK") |
| /internal | Internal routes | $([ $(echo "$FOUND_PATHS" | grep -cw "/internal") -gt 0 ] && echo "EXPOSED" || echo "OK") |
| /backup | Backup files | $([ $(echo "$FOUND_PATHS" | grep -cw "/backup") -gt 0 ] && echo "EXPOSED" || echo "OK") |
| /uploads | Upload directory | $([ $(echo "$FOUND_PATHS" | grep -cw "/uploads") -gt 0 ] && echo "EXPOSED" || echo "OK") |
| /.env | Environment file | $([ $(echo "$FOUND_PATHS" | grep -cw "/.env") -gt 0 ] && echo "EXPOSED" || echo "OK") |
| /.git | Git repository | $([ $(echo "$FOUND_PATHS" | grep -cw "/.git") -gt 0 ] && echo "EXPOSED" || echo "OK") |

### Baseline Comparison

EOF
    
    if [ -f "$BASELINE_DIR/routes-baseline.json" ]; then
        echo "Comparing with baseline..." >> "$REPORT_FILE"
        echo "- Baseline file: routes-baseline.json" >> "$REPORT_FILE"
    else
        echo "- No baseline file found. Create with: \`npm run security:baseline\`" >> "$REPORT_FILE"
    fi
    
    cat >> "$REPORT_FILE" << EOF

### Recommendations

1. Restrict access to admin/swagger/debug endpoints
2. Remove .env and .git from production
3. Implement proper access controls
4. Regular security scans recommended

### Raw Gobuster Output

\`\`\`
$scan_output
\`\`\`

---
Generated by: Security Infrastructure Scan (Phase 4)
EOF
    
    echo ""
    echo "=== Report generated: $REPORT_FILE ==="
}

# Main execution
check_gobuster
check_wordlist

echo "Phase 1: Running directory scan..."
GOBUSTER_OUTPUT=$(run_gobuster)
echo "$GOBUSTER_OUTPUT"

echo ""
echo "Phase 2: Parsing results..."
parse_gobuster_output "$GOBUSTER_OUTPUT"

echo ""
echo "Phase 3: Checking for dangerous paths..."
WARNINGS=$(check_dangerous_paths "$FOUND_PATHS")

echo ""
echo "Phase 4: Generating report..."
generate_report "$GOBUSTER_OUTPUT" "$WARNINGS"

echo ""
echo "=== Scan Complete ==="
echo "Report: $REPORT_FILE"
echo "Paths found: $TOTAL_FOUND"
echo "Warnings: $WARNINGS"
