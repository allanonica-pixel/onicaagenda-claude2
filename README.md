# Ônica Pro — Portal do Profissional

> Portal mobile-first para profissionais de saúde visualizarem sua agenda cross-clínica, estimativa de faturamento e relatórios de atendimento.

| | DEV | PROD |
|-|-----|------|
| **URL** | https://onicaprofissional-claude-git-dev-allan-roberts-projects.vercel.app | https://onicaprofissional-claude.vercel.app |
| **Branch** | `dev` | `main` |
| **Supabase** | `pecbwtiypupttkqfjwbr` | `tjfkdaiqycextcvmryks` |

**Repositório**: https://github.com/allanonica-pixel/onicaagenda-claude2

---

## Stack

| Tecnologia | Versão | Papel |
|-----------|--------|-------|
| React | 19 | UI |
| TypeScript | 6 | Tipagem |
| Vite | 8 | Build |
| Tailwind CSS | 3 | Estilos |
| React Router | 7 | Navegação |
| Supabase JS | 2 | Auth + Data |
| otplib | 13 | TOTP (MFA) |

---

## Arquitetura

### Foco Mobile-First
- Layout com **bottom navigation bar** fixa + `safe-area-inset-bottom` (suporte ao iPhone notch)
- Desktop: top navigation bar horizontal
- `viewport-fit=cover` + meta tags PWA/Apple no `index.html`
- Padding padrão das páginas: `pb-28 pt-16 md:pb-10 md:pt-20`

### Fluxo de Autenticação (`PortalAuthContext`)

```
Abrir app
    │
    ▼
Supabase Auth (email + senha) ──── unauthenticated → Tela de login
    │ autenticado
    ▼
Verificar MFA pessoal (localStorage: onica-portal-mfa-verified, 8h)
    │ não verificado
    ▼
professional-mfa-enroll ──── sem MFA → Setup: QR Code + verificação
    │ MFA ok
    ▼
authenticated → App liberado
```

**Estados do contexto**: `loading | unauthenticated | needs-mfa | authenticated`

**Sessão MFA**: armazenada no localStorage com validade de 8 horas:
```json
{ "sessionId": "uuid", "expiresAt": 1745000000000 }
```

### Dados por Página

| Página | View SQL | Filtro |
|--------|----------|--------|
| Agenda (`/`) | `vw_professional_schedule` | `p.email = auth.email()` |
| Faturamento (`/faturamento`) | `vw_professional_billing_estimate` | `p.email = auth.email()` |
| Relatórios (`/relatorios`) | `vw_professional_attendance_report` | `p.email = auth.email()` |

As views **não expõem dados clínicos do paciente** (sem nome, CPF, prontuário). Mostram apenas: data, horário, status, tipo, clínica, unidade, convênio, procedimento.

---

## Variáveis de Ambiente

O Vercel injeta automaticamente a variável correta por ambiente. Localmente use o `.env.local` com as chaves **DEV**:

```env
# .env.local  ← não commitar
VITE_SUPABASE_URL=https://pecbwtiypupttkqfjwbr.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_T54CjAWyD8lG0XYhmYn92Q_dLf1fFSF
```

| Ambiente Vercel | Branch | Supabase |
|----------------|--------|----------|
| `production` | `main` | PROD (`tjfkdaiqycextcvmryks`) |
| `preview` / `development` | `dev` / local | DEV (`pecbwtiypupttkqfjwbr`) |

---

## Desenvolvimento Local

```bash
npm install
npm run dev
# → http://localhost:5173
```

---

## Fluxo de Deploy

```bash
# 1. Desenvolva e teste na branch dev
git checkout dev
git commit -m "feat: ..."
git push origin dev
# → Vercel gera preview automático com Supabase DEV

# 2. Quando pronto, abra PR: dev → main
#    https://github.com/allanonica-pixel/onicaagenda-claude2/compare/dev

# 3. Após merge em main → Vercel faz deploy PROD automaticamente
```

---

## Estrutura de Pastas

```
src/
├── contexts/
│   └── PortalAuthContext.tsx   # Auth + MFA + estado global
├── components/
│   └── Header.tsx              # Top bar (desktop) + Bottom nav (mobile)
├── pages/
│   ├── login/page.tsx          # Tela de login
│   ├── mfa-setup/page.tsx      # Setup TOTP (QR code + verificação)
│   ├── agenda/page.tsx         # Agenda cross-clínica
│   ├── faturamento/page.tsx    # Estimativa de faturamento
│   └── relatorios/page.tsx     # Relatórios de atendimento
└── lib/
    └── supabase.ts             # Cliente Supabase (storageKey isolado)
```

---

## Acesso do Profissional

O profissional usa o **mesmo e-mail e senha** em todas as clínicas onde está cadastrado. O vínculo é feito automaticamente pelo e-mail — sem necessidade de configuração manual por clínica.

- **Conta criada**: quando a clínica cadastra o profissional em `NewProfessionalModal`, a edge function `admin-create-professional-user` cria automaticamente a conta com senha provisória `onica123`
- **MFA**: configurado uma única vez no portal (pessoal, não por clínica)
- **Troca de senha**: deve ser feita no primeiro acesso via `profissional.onica.com.br`
