# 🔐 Sistema de Autenticação - LumoEdu

## 📋 Visão Geral

O sistema de autenticação foi completamente refatorado para ser mais robusto e lidar com problemas de conectividade do Supabase.

---

## ✨ Funcionalidades

### **1. Cache Inteligente com Expiração**
- ✅ Perfil salvo no `localStorage` por **1 hora**
- ✅ Carregamento instantâneo ao reabrir o site
- ✅ Atualização em segundo plano do banco de dados
- ✅ Limpeza automática de cache expirado

### **2. Fallback em Camadas**
1. **Cache do localStorage** (instantâneo)
2. **Banco de dados Supabase** (8s timeout)
3. **Perfil de sessão básico** (último recurso)

### **3. Logs Detalhados**
- 🔐 Inicialização do sistema
- 🔔 Eventos de autenticação
- 👤 Status do usuário
- ⚡ Uso de cache
- 🔄 Busca no banco
- ✅ Sucesso
- ❌ Erros
- ⏱️ Timeouts

---

## 🛠️ Arquivos Principais

### **`src/stores/useAuthStore.ts`**
Store Zustand que gerencia o estado global de autenticação.

**Principais funções:**
- `initAuth()` - Inicializa listeners de autenticação
- `setUser()` - Define usuário atual
- `updateUser()` - Atualiza parcialmente o usuário

### **`src/utils/profileCache.ts`**
Utilitário para gerenciar cache de perfil.

**Funções:**
- `saveProfileCache(userId, profile)` - Salva perfil no cache
- `loadProfileCache(userId)` - Carrega perfil do cache
- `clearProfileCache(userId)` - Limpa cache específico
- `clearAllProfileCaches()` - Limpa todos os caches

### **`src/hooks/useAuth.ts`**
Hook React para usar autenticação em componentes.

**Retorna:**
```typescript
{
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPremium: boolean;
  logout: () => Promise<void>;
}
```

---

## 🔄 Fluxo de Autenticação

### **Login**
```
1. Usuário faz login no Supabase
   ↓
2. onAuthStateChange dispara
   ↓
3. Tenta carregar cache (instantâneo)
   ↓
4. Busca perfil do banco (8s timeout)
   ↓
5. Se sucesso: atualiza cache e estado
   Se timeout: usa cache ou fallback
```

### **Recarregamento de Página**
```
1. initAuth() é chamado
   ↓
2. Verifica sessão do Supabase
   ↓
3. Carrega cache imediatamente
   ↓
4. Busca atualização do banco em segundo plano
   ↓
5. Atualiza se houver mudanças
```

### **Logout**
```
1. Limpa cache do localStorage
   ↓
2. Faz signOut no Supabase
   ↓
3. Redireciona para /login
```

---

## 🎯 Como Usar

### **Em Componentes React**

```typescript
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { user, isAdmin, isPremium, logout } = useAuth();

  if (!user) return <div>Não autenticado</div>;

  return (
    <div>
      <p>Olá, {user.displayName}!</p>
      {isAdmin && <p>Você é admin!</p>}
      {isPremium && <p>Conta Premium ativa</p>}
      <button onClick={logout}>Sair</button>
    </div>
  );
}
```

### **Acessar Store Diretamente**

```typescript
import { useAuthStore } from '../stores/useAuthStore';

function MyComponent() {
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);

  const handleUpdate = () => {
    updateUser({ displayName: 'Novo Nome' });
  };

  return <div>{user?.displayName}</div>;
}
```

---

## ⚙️ Configuração

### **Timeout do Banco de Dados**
Atualmente configurado para **8 segundos**. Para alterar:

```typescript
// src/stores/useAuthStore.ts, linha ~47
const timeoutPromise = new Promise<null>((_, reject) => 
  setTimeout(() => reject(new Error('timeout')), 8000) // <-- Alterar aqui
);
```

### **Duração do Cache**
Atualmente configurado para **1 hora**. Para alterar:

```typescript
// src/utils/profileCache.ts, linha 3
const CACHE_DURATION = 1000 * 60 * 60; // <-- Alterar aqui (em milissegundos)
```

---

## 🐛 Troubleshooting

### **Problema: Sempre usa fallback com role: 'user'**

**Causa:** Supabase não responde a tempo (timeout de 8s)

**Solução:**
1. Verificar RLS no Supabase:
```sql
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
```

2. Verificar se o perfil existe:
```sql
SELECT * FROM user_profiles WHERE id = 'SEU_USER_ID';
```

3. Atualizar role manualmente:
```sql
UPDATE user_profiles 
SET role = 'admin', is_premium = true
WHERE id = 'SEU_USER_ID';
```

### **Problema: Redirecionado ao trocar de aba**

**Causa:** AdminRoute verifica permissões antes do cache carregar

**Solução:** O AdminRoute já tem delay de 2s. Se persistir, aumente:

```typescript
// src/components/AdminRoute.tsx, linha ~17
setTimeout(() => {
  setIsChecking(false);
  setHasChecked(true);
}, 2000); // <-- Aumentar para 3000 ou 4000
```

### **Problema: Cache não atualiza**

**Solução:** Limpar cache manualmente:

```typescript
// No console do navegador (F12)
localStorage.clear();
```

Ou via código:

```typescript
import { clearAllProfileCaches } from '../utils/profileCache';
clearAllProfileCaches();
```

---

## 📊 Logs do Console

### **Login Bem-Sucedido**
```
🔐 useAuthStore: Initializing Auth System...
🔔 Auth event: SIGNED_IN
👤 User logged in, loading profile...
⚡ Using cached profile (instant load)
🔄 Fetching fresh profile from database...
✅ Profile loaded from database!
   Role: admin | Premium: true
💾 Profile saved to cache
```

### **Login com Timeout**
```
🔐 useAuthStore: Initializing Auth System...
🔔 Auth event: SIGNED_IN
👤 User logged in, loading profile...
⚡ Using cached profile (instant load)
🔄 Fetching fresh profile from database...
⏱️ Timeout after 8s: Error: timeout
✅ Using cached profile after timeout
```

### **Primeiro Login (Sem Cache)**
```
🔐 useAuthStore: Initializing Auth System...
🔔 Auth event: SIGNED_IN
👤 User logged in, loading profile...
🔄 Fetching fresh profile from database...
✅ Profile loaded from database!
   Role: user | Premium: false
💾 Profile saved to cache
```

---

## 🚀 Próximos Passos

1. ✅ Sistema de cache implementado
2. ✅ Fallback em camadas
3. ✅ Logs detalhados
4. ⏳ Resolver problema de RLS no Supabase
5. ⏳ Implementar refresh token automático
6. ⏳ Adicionar testes unitários

---

**Última atualização:** 2026-01-12  
**Versão:** 2.0.0
