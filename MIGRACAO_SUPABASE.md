# 🚀 Plano de Migração Firebase → Supabase

## ✅ Concluído

1. ✅ Projeto Supabase criado
2. ✅ Schema SQL executado
3. ✅ Row Level Security configurado
4. ✅ Cliente Supabase criado (`src/lib/supabase.ts`)
5. ✅ Tipos TypeScript criados (`src/types/supabase.ts`)
6. ✅ Dependência instalada (`@supabase/supabase-js`)

## 📋 Próximos Passos

### Fase 1: Migrar Autenticação (1-2 dias)
- [ ] Criar novo `authService.ts` com Supabase
- [ ] Atualizar `useAuthStore.ts`
- [ ] Migrar páginas de Login/Register
- [ ] Testar fluxo de autenticação

### Fase 2: Migrar Dados de Conteúdo (2-3 dias)
- [ ] Exportar dados do Firebase (universidades, disciplinas)
- [ ] Importar para Supabase
- [ ] Criar novo `contentService.ts`
- [ ] Atualizar `useContentStore.ts`
- [ ] Testar carregamento de conteúdo

### Fase 3: Migrar Modo Aprender (3-4 dias)
- [ ] Exportar sections, steps, questions do Firebase
- [ ] Importar para Supabase
- [ ] Reescrever `practiceService.ts`
- [ ] Atualizar todas as páginas de Learning
- [ ] Testar fluxo completo

### Fase 4: Migrar Grupos (1-2 dias)
- [ ] Exportar grupos e mensagens
- [ ] Importar para Supabase
- [ ] Reescrever `groupService.ts`
- [ ] Atualizar páginas de Grupos
- [ ] Testar chat em tempo real

### Fase 5: Migrar Exames e Simulados (2-3 dias)
- [ ] Exportar exames e questões
- [ ] Importar para Supabase
- [ ] Reescrever serviços de exames
- [ ] Atualizar páginas de Simulados/Desafios
- [ ] Testar funcionalidades

### Fase 6: Testes Finais (2-3 dias)
- [ ] Testes de integração
- [ ] Testes de performance
- [ ] Verificar RLS policies
- [ ] Testes com usuários beta

### Fase 7: Deploy (1 dia)
- [ ] Deploy em staging
- [ ] Testes finais
- [ ] Deploy em produção
- [ ] Monitoramento

## 🔑 Credenciais do Projeto

**URL**: https://kscyzmuxlpmdaacyerob.supabase.co

**Anon Key** (para frontend):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzY3l6bXV4bHBtZGFhY3llcm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0NDIwNDMsImV4cCI6MjA1MjAxODA0M30.sb_publishable_kIARlEZjVmu4-XHJbuanjg_NbM2iy03
```

## 📁 Arquivos Criados

1. `src/lib/supabase.ts` - Cliente Supabase
2. `src/types/supabase.ts` - Tipos TypeScript
3. `.env.local` - Variáveis de ambiente (CRIAR MANUALMENTE)

## ⚠️ IMPORTANTE

### Criar `.env.local` Manualmente

Crie o arquivo `.env.local` na raiz do projeto com:

```env
VITE_SUPABASE_URL=https://kscyzmuxlpmdaacyerob.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzY3l6bXV4bHBtZGFhY3llcm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0NDIwNDMsImV4cCI6MjA1MjAxODA0M30.sb_publishable_kIARlEZjVmu4-XHJbuanjg_NbM2iy03
```

## 🎯 Próxima Ação

Escolha uma das opções:

1. **Migração Completa Agora** - Migro tudo de uma vez (2-3 semanas)
2. **Migração Gradual** - Migro módulo por módulo (4-6 semanas)
3. **Apenas Autenticação Primeiro** - Testo com auth antes de continuar (1 semana)

**Qual prefere?**
