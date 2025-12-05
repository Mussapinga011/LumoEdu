# 📚 Guia de Comandos Git e NPM

## 🔧 Comandos Git

### Configuração Inicial

```bash
# Configurar nome de usuário
git config --global user.name "Seu Nome"

# Configurar email
git config --global user.email "seu.email@example.com"

# Ver configurações
git config --list
```

### Inicializar Repositório

```bash
# Inicializar um novo repositório Git
git init

# Clonar um repositório existente
git clone <url-do-repositorio>

# Clonar para uma pasta específica
git clone <url-do-repositorio> <nome-da-pasta>
```

### Comandos Básicos

```bash
# Ver status dos arquivos
git status

# Adicionar arquivo específico ao staging
git add <nome-do-arquivo>

# Adicionar todos os arquivos modificados
git add .

# Adicionar todos os arquivos (incluindo deletados)
git add -A

# Fazer commit das mudanças
git commit -m "Mensagem do commit"

# Adicionar e fazer commit ao mesmo tempo
git commit -am "Mensagem do commit"

# Ver histórico de commits
git log

# Ver histórico resumido
git log --oneline

# Ver histórico com gráfico
git log --graph --oneline --all
```

### Branches (Ramificações)

```bash
# Listar todas as branches
git branch

# Criar nova branch
git branch <nome-da-branch>

# Mudar para outra branch
git checkout <nome-da-branch>

# Criar e mudar para nova branch
git checkout -b <nome-da-branch>

# Deletar branch local
git branch -d <nome-da-branch>

# Deletar branch forçadamente
git branch -D <nome-da-branch>

# Renomear branch atual
git branch -m <novo-nome>

# Mesclar branch na branch atual
git merge <nome-da-branch>
```

### Sincronização com Repositório Remoto

```bash
# Adicionar repositório remoto
git remote add origin <url-do-repositorio>

# Ver repositórios remotos
git remote -v

# Baixar mudanças do remoto (sem mesclar)
git fetch

# Baixar e mesclar mudanças do remoto
git pull

# Enviar mudanças para o remoto
git push

# Enviar branch específica
git push origin <nome-da-branch>

# Enviar e definir upstream
git push -u origin <nome-da-branch>

# Forçar push (cuidado!)
git push --force
```

### Desfazer Mudanças

```bash
# Descartar mudanças em arquivo específico
git checkout -- <nome-do-arquivo>

# Remover arquivo do staging (manter mudanças)
git reset HEAD <nome-do-arquivo>

# Desfazer último commit (manter mudanças)
git reset --soft HEAD~1

# Desfazer último commit (descartar mudanças)
git reset --hard HEAD~1

# Reverter commit específico
git revert <hash-do-commit>

# Limpar arquivos não rastreados
git clean -fd
```

### Stash (Guardar Mudanças Temporariamente)

```bash
# Guardar mudanças atuais
git stash

# Guardar com mensagem
git stash save "Mensagem descritiva"

# Listar stashes
git stash list

# Aplicar último stash
git stash apply

# Aplicar e remover último stash
git stash pop

# Aplicar stash específico
git stash apply stash@{n}

# Deletar último stash
git stash drop

# Deletar todos os stashes
git stash clear
```

### Comandos Avançados

```bash
# Ver diferenças não commitadas
git diff

# Ver diferenças entre commits
git diff <commit1> <commit2>

# Ver quem modificou cada linha
git blame <nome-do-arquivo>

# Buscar por texto nos commits
git log --grep="texto"

# Criar tag
git tag <nome-da-tag>

# Enviar tags para remoto
git push --tags

# Rebase interativo (últimos 3 commits)
git rebase -i HEAD~3

# Cherry-pick (aplicar commit específico)
git cherry-pick <hash-do-commit>
```

---

## 📦 Comandos NPM

### Gerenciamento de Pacotes

```bash
# Inicializar novo projeto Node.js
npm init

# Inicializar com valores padrão
npm init -y

# Instalar todas as dependências do package.json
npm install
# ou
npm i

# Instalar pacote específico
npm install <nome-do-pacote>

# Instalar pacote como dependência de desenvolvimento
npm install --save-dev <nome-do-pacote>
# ou
npm install -D <nome-do-pacote>

# Instalar pacote globalmente
npm install -g <nome-do-pacote>

# Instalar versão específica
npm install <nome-do-pacote>@<versao>

# Desinstalar pacote
npm uninstall <nome-do-pacote>

# Atualizar pacote
npm update <nome-do-pacote>

# Atualizar todos os pacotes
npm update

# Listar pacotes instalados
npm list

# Listar pacotes globais
npm list -g --depth=0

# Ver pacotes desatualizados
npm outdated
```

### Scripts NPM (npm run)

```bash
# Executar script definido no package.json
npm run <nome-do-script>

# Iniciar servidor de desenvolvimento
npm run dev

# Fazer build de produção
npm run build

# Executar testes
npm run test
# ou
npm test

# Executar linter
npm run lint

# Corrigir problemas de lint automaticamente
npm run lint:fix

# Pré-visualizar build de produção
npm run preview

# Executar formatador de código
npm run format
```

### Scripts Comuns em Projetos React/Vite

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Fazer build para produção
npm run build

# Pré-visualizar build localmente
npm run preview

# Executar TypeScript type checking
npm run type-check

# Executar ESLint
npm run lint
```

### Comandos de Cache e Limpeza

```bash
# Limpar cache do npm
npm cache clean --force

# Verificar integridade do cache
npm cache verify

# Deletar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Comandos de Informação

```bash
# Ver informações sobre um pacote
npm info <nome-do-pacote>

# Ver versão do npm
npm --version
# ou
npm -v

# Ver versão do Node.js
node --version
# ou
node -v

# Ver ajuda
npm help

# Ver ajuda de comando específico
npm help <comando>

# Verificar vulnerabilidades
npm audit

# Corrigir vulnerabilidades automaticamente
npm audit fix
```

### NPX (Executar Pacotes sem Instalar)

```bash
# Executar pacote sem instalar
npx <nome-do-pacote>

# Criar novo projeto React
npx create-react-app <nome-do-projeto>

# Criar novo projeto Vite
npx create-vite@latest

# Executar com flag -y (aceitar automaticamente)
npx -y <nome-do-pacote>
```

---

## 🔄 Workflow Comum de Desenvolvimento

### Fluxo Git Típico

```bash
# 1. Clonar repositório
git clone <url-do-repositorio>

# 2. Entrar na pasta
cd <nome-da-pasta>

# 3. Instalar dependências
npm install

# 4. Criar nova branch para feature
git checkout -b feature/nova-funcionalidade

# 5. Fazer mudanças no código...

# 6. Ver status
git status

# 7. Adicionar mudanças
git add .

# 8. Fazer commit
git commit -m "feat: adicionar nova funcionalidade"

# 9. Enviar para remoto
git push -u origin feature/nova-funcionalidade

# 10. Criar Pull Request no GitHub/GitLab

# 11. Após aprovação, voltar para main
git checkout main

# 12. Atualizar main
git pull

# 13. Deletar branch local
git branch -d feature/nova-funcionalidade
```

### Fluxo de Atualização de Projeto

```bash
# 1. Garantir que está na branch main
git checkout main

# 2. Baixar últimas mudanças
git pull

# 3. Atualizar dependências
npm install

# 4. Executar projeto
npm run dev
```

---

## 📝 Convenções de Commit (Conventional Commits)

```bash
# Feature nova
git commit -m "feat: adicionar autenticação de usuário"

# Correção de bug
git commit -m "fix: corrigir erro no login"

# Documentação
git commit -m "docs: atualizar README"

# Estilo/formatação
git commit -m "style: formatar código com prettier"

# Refatoração
git commit -m "refactor: reorganizar estrutura de pastas"

# Performance
git commit -m "perf: otimizar carregamento de imagens"

# Testes
git commit -m "test: adicionar testes para componente Header"

# Build/CI
git commit -m "build: atualizar dependências"

# Chore (tarefas de manutenção)
git commit -m "chore: atualizar .gitignore"
```

---

## ⚠️ Dicas Importantes

### Git

- **Sempre faça pull antes de push** para evitar conflitos
- **Use branches** para novas features, nunca trabalhe direto na main
- **Commits pequenos e frequentes** são melhores que commits grandes
- **Mensagens descritivas** ajudam a entender o histórico
- **Cuidado com `git push --force`** - pode sobrescrever trabalho de outros

### NPM

- **Sempre commit o `package.json` e `package-lock.json`**
- **Nunca commit a pasta `node_modules`** (use .gitignore)
- **Use `npm ci`** em CI/CD para instalações mais rápidas e determinísticas
- **Verifique vulnerabilidades** regularmente com `npm audit`
- **Mantenha dependências atualizadas** mas teste antes de atualizar

---

## 🚀 Atalhos Úteis

```bash
# Git
git st      # status (se configurado alias)
git co      # checkout (se configurado alias)
git br      # branch (se configurado alias)
git cm      # commit (se configurado alias)

# Configurar aliases
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.cm commit
git config --global alias.lg "log --oneline --graph --all"

# NPM
npm i       # install
npm un      # uninstall
npm up      # update
npm t       # test
```

---

**Criado em:** 2025-12-05  
**Projeto:** Admission Platform
