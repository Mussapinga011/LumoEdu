# Sistema de Restrições Free vs Premium

## 📋 Resumo das Implementações

Este documento descreve as regras de acesso implementadas para diferenciar usuários gratuitos (Free) de usuários Premium na plataforma de preparação para exames de admissão.

---

## 🎯 Regras Implementadas

### 1. **Modo Aprender (Study Mode)**

#### ❌ Usuários Free
- **Acesso**: BLOQUEADO
- **Restrição**: Usuários gratuitos NÃO têm acesso ao modo Aprender
- **Mensagem**: Tela de bloqueio com informações sobre benefícios Premium
- **Arquivo**: `src/pages/StudyPage.tsx`

#### ✅ Usuários Premium
- **Acesso**: ILIMITADO
- Acesso completo ao modo de estudo
- Explicações detalhadas de todas as questões
- Sem limites de exames por dia

---

### 2. **Modo Desafio (Challenge Mode)**

#### ⚠️ Usuários Free
- **Acesso**: LIMITADO
- **Limite**: 1 desafio por dia
- **Verificação**: Baseada em `lastChallengeDate` no perfil do usuário
- **Reset**: Automático à meia-noite (novo dia)
- **Mensagem**: Tela de bloqueio após atingir o limite diário
- **Arquivo**: `src/pages/ChallengePage.tsx`

#### ✅ Usuários Premium
- **Acesso**: ILIMITADO
- Desafios ilimitados por dia
- Sem restrições de tempo ou quantidade

---

## 🎨 Indicadores Visuais Implementados

### 1. **Página de Disciplinas** (`DisciplinesPage.tsx`)
- Banner informativo para usuários Free
- Destaca que o Modo Aprender é exclusivo Premium
- Botão de upgrade para Premium

### 2. **Página de Seleção de Desafios** (`ChallengeSelectDisciplinePage.tsx`)
- Contador de desafios disponíveis
- Banner azul: "🎯 Você tem 1 desafio disponível hoje"
- Banner vermelho: "🚫 Limite diário atingido" (quando usado)
- Botão de upgrade para Premium quando limite atingido

### 3. **Telas de Bloqueio**

#### Modo Aprender (Study)
```
⭐ Modo Aprender - Premium

O modo Aprender é exclusivo para usuários Premium. 
Atualize sua conta para ter acesso ilimitado a todos os recursos de estudo!

Benefícios Premium:
✓ Acesso ilimitado ao Modo Aprender
✓ Desafios ilimitados por dia
✓ Explicações detalhadas de todas as questões
✓ Estatísticas avançadas de desempenho

[Voltar às Disciplinas] [⭐ Atualizar para Premium]
```

#### Modo Desafio (Challenge)
```
🚫 Limite Diário Atingido

Você já completou um desafio hoje. 
Volte amanhã ou atualize para Premium para desafios ilimitados!

Com Premium você tem:
✓ Desafios ilimitados por dia
✓ Acesso ao Modo Aprender
✓ Estatísticas detalhadas
✓ Sem anúncios

[Voltar] [⭐ Atualizar para Premium]
```

---

## 🔧 Implementação Técnica

### Verificação de Limites

#### Modo Aprender
```typescript
const checkDailyLimit = () => {
  if (!user) return;
  
  // Free users cannot access Study mode
  if (!user.isPremium) {
    setLimitReached(true);
    return;
  }
};
```

#### Modo Desafio
```typescript
const checkDailyLimit = () => {
  if (!user) return;
  
  // Premium users bypass limits
  if (user.isPremium) return;
  
  // Check if user already took a challenge today
  if (user.lastChallengeDate) {
    const lastChallengeDate = user.lastChallengeDate.toDate();
    const today = new Date();
    
    if (
      lastChallengeDate.getDate() === today.getDate() &&
      lastChallengeDate.getMonth() === today.getMonth() &&
      lastChallengeDate.getFullYear() === today.getFullYear()
    ) {
      setLimitReached(true);
    }
  }
};
```

### Contador de Desafios Disponíveis
```typescript
const getChallengesLeft = () => {
  if (!user) return 0;
  if (user.isPremium) return -1; // -1 means unlimited
  
  // Check if user already took a challenge today
  if (user.lastChallengeDate) {
    const lastChallengeDate = user.lastChallengeDate.toDate();
    const today = new Date();
    
    if (
      lastChallengeDate.getDate() === today.getDate() &&
      lastChallengeDate.getMonth() === today.getMonth() &&
      lastChallengeDate.getFullYear() === today.getFullYear()
    ) {
      return 0; // No challenges left today
    }
  }
  return 1; // 1 challenge available
};
```

---

## 📊 Campos do Perfil do Usuário

### Campos Relevantes em `UserProfile`
```typescript
interface UserProfile {
  // Premium System
  isPremium: boolean;
  premiumUntil?: Timestamp;
  
  // Daily Limits
  lastStudyDate: Timestamp | null;
  lastExamDate: Timestamp | null;
  lastChallengeDate: Timestamp | null;
  dailyExercisesCount: number;
}
```

---

## 🎯 Benefícios Premium Destacados

### Para Usuários Free
1. **Modo Aprender Bloqueado**: Incentiva upgrade para acesso ao estudo guiado
2. **1 Desafio/Dia**: Permite experimentar a plataforma mas incentiva upgrade
3. **Banners Informativos**: Sempre visíveis, lembrando dos benefícios Premium

### Benefícios Premium Anunciados
- ✓ Acesso ilimitado ao Modo Aprender
- ✓ Desafios ilimitados por dia
- ✓ Explicações detalhadas de todas as questões
- ✓ Estatísticas avançadas de desempenho
- ✓ Sem anúncios

---

## 📁 Arquivos Modificados

1. **`src/pages/StudyPage.tsx`**
   - Bloqueio total para usuários Free
   - Tela de upgrade Premium

2. **`src/pages/ChallengePage.tsx`**
   - Limite de 1 desafio/dia para Free
   - Verificação de `lastChallengeDate`
   - Tela de limite atingido

3. **`src/pages/ChallengeSelectDisciplinePage.tsx`**
   - Banner de status de desafios
   - Contador de desafios disponíveis
   - Indicador visual de limite

4. **`src/pages/DisciplinesPage.tsx`**
   - Banner informativo sobre Modo Aprender Premium
   - Botão de upgrade

---

## 🚀 Próximos Passos Sugeridos

### 1. Sistema de Pagamento
- Integrar M-Pesa/E-Mola para assinaturas Premium
- Definir preços em MZN (Meticais)
- Implementar gestão de assinaturas

### 2. Notificações
- Lembrete quando desafio diário estiver disponível novamente
- Notificações de benefícios Premium

### 3. Analytics
- Rastrear quantos usuários Free atingem o limite
- Medir taxa de conversão para Premium
- Identificar pontos de fricção

### 4. Testes A/B
- Testar diferentes mensagens de upgrade
- Experimentar diferentes limites (1 vs 2 desafios/dia)
- Otimizar CTAs dos botões Premium

---

## ✅ Checklist de Implementação

- [x] Bloquear Modo Aprender para usuários Free
- [x] Implementar limite de 1 desafio/dia para Free
- [x] Criar telas de bloqueio informativas
- [x] Adicionar banners de status em páginas relevantes
- [x] Implementar contador de desafios disponíveis
- [x] Destacar benefícios Premium em todas as telas de bloqueio
- [x] Adicionar botões de upgrade para Premium
- [ ] Integrar sistema de pagamento (M-Pesa/E-Mola)
- [ ] Implementar gestão de assinaturas Premium
- [ ] Adicionar analytics de conversão

---

## 📝 Notas

- Todos os limites são verificados no lado do cliente e devem ser validados no backend
- A data de reset é baseada no dia do calendário (meia-noite)
- Usuários Premium são identificados por `user.isPremium === true`
- O sistema é projetado para incentivar upgrades sem frustrar usuários Free
