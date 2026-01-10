# 🧪 Guia de Teste - Autenticação Supabase

## 🚀 Como Testar

### 1. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

### 2. Acessar a Página de Teste

Abra o navegador e acesse:
```
http://localhost:5173/supabase-test
```

---

## 📋 Checklist de Testes

### ✅ Teste 1: Registro de Novo Usuário

1. Preencha os campos:
   - **Email**: `teste@example.com`
   - **Senha**: `senha123456`
   - **Nome**: `Usuário Teste`

2. Clique em **"📝 Registrar"**

3. **Resultado Esperado**:
   - ✅ Mensagem verde: "Usuário criado! ID: xxxxx"
   - ✅ Console do navegador mostra o perfil criado
   - ✅ No Supabase Dashboard, vá em Table Editor → `user_profiles` e veja o novo registro

---

### ✅ Teste 2: Logout

1. Clique em **"🚪 Logout"**

2. **Resultado Esperado**:
   - ✅ Mensagem verde: "Logout realizado!"
   - ✅ Informações do usuário desaparecem

---

### ✅ Teste 3: Login

1. Preencha:
   - **Email**: `teste@example.com`
   - **Senha**: `senha123456`

2. Clique em **"🔐 Login"**

3. **Resultado Esperado**:
   - ✅ Mensagem verde: "Login realizado! Bem-vindo!"
   - ✅ Aparece card com informações do usuário
   - ✅ Console mostra dados completos

---

### ✅ Teste 4: Verificar Sessão

1. Clique em **"🔍 Verificar"**

2. **Resultado Esperado**:
   - ✅ Mensagem verde: "Sessão ativa encontrada!"
   - ✅ Mostra dados do usuário logado

---

### ✅ Teste 5: Persistência de Sessão

1. **Recarregue a página** (F5)

2. Clique em **"🔍 Verificar"**

3. **Resultado Esperado**:
   - ✅ Sessão ainda está ativa
   - ✅ Não precisa fazer login novamente

---

### ✅ Teste 6: Verificar no Supabase Dashboard

1. Abra: https://supabase.com/dashboard/project/kscyzmuxlpmdaacyerob

2. Vá em **Table Editor** → **user_profiles**

3. **Resultado Esperado**:
   - ✅ Vê o registro do usuário criado
   - ✅ Campos preenchidos corretamente:
     - `id` (UUID)
     - `display_name` = "Usuário Teste"
     - `role` = "user"
     - `is_premium` = false
     - `level` = 1
     - `xp` = 0
     - `streak` = 0

4. Vá em **Authentication** → **Users**

5. **Resultado Esperado**:
   - ✅ Vê o usuário no Supabase Auth
   - ✅ Email confirmado ou pendente

---

## 🐛 Possíveis Erros e Soluções

### Erro: "Missing Supabase environment variables"

**Solução**: Verifique se o arquivo `.env.local` existe e contém:
```env
VITE_SUPABASE_URL=https://kscyzmuxlpmdaacyerob.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Erro: "Invalid login credentials"

**Solução**: 
- Verifique se a senha tem pelo menos 6 caracteres
- Confirme que o email está correto

### Erro: "User already registered"

**Solução**:
- Use outro email
- Ou delete o usuário no Supabase Dashboard

### Erro: "Failed to fetch"

**Solução**:
- Verifique sua conexão com a internet
- Confirme que o projeto Supabase está ativo

---

## ✅ Checklist Final

Após todos os testes, confirme:

- [ ] ✅ Registro funciona
- [ ] ✅ Login funciona
- [ ] ✅ Logout funciona
- [ ] ✅ Sessão persiste após reload
- [ ] ✅ Dados aparecem no Supabase Dashboard
- [ ] ✅ Perfil é criado automaticamente (trigger)
- [ ] ✅ Console não mostra erros

---

## 🎯 Próximo Passo

Se todos os testes passaram:
✅ **Autenticação Supabase está funcionando!**

Podemos continuar com:
1. Migrar o resto dos serviços
2. Atualizar as páginas de Login/Register para usar Supabase
3. Migrar dados do Firebase

**Informe o resultado dos testes para continuarmos!** 🚀
