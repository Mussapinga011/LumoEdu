# 📚 Guia de Comandos Git e NPM

## 🔧 Comandos Git
npx firebase deploy --only hosting

npm run build
npx firebase login
npx firebase deploy

Para subir as regras do Banco de Dados (Isso resolve seu erro de permissão):

npx firebase deploy --only firestore:rules
Para subir o site (Hosting):


npx firebase deploy --only hosting



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

# Iniciar servidor exposto na rede local (acessível por outros dispositivos)
npm run dev -- --host

# Iniciar servidor em porta específica
npm run dev -- --port 3000

# Iniciar servidor e abrir navegador automaticamente
npm run dev -- --open

# Combinar flags (expor na rede + porta específica)
npm run dev -- --host --port 3000

# Fazer build para produção
npm run build

# Pré-visualizar build localmente
npm run preview

# Pré-visualizar build exposto na rede
npm run preview -- --host

# Executar TypeScript type checking
npm run type-check

# Executar ESLint
npm run lint
```

### Comandos de Desenvolvimento com Flags

```bash
# Vite - Expor servidor na rede local
npm run dev -- --host
# Útil para testar em celular/tablet na mesma rede

# Vite - Especificar porta
npm run dev -- --port 5173

# Vite - Modo debug
npm run dev -- --debug

# Vite - Limpar cache e iniciar
npm run dev -- --force

# Build com análise de bundle
npm run build -- --report



---
# Ver status
git status

# Fazer commit de mudanças futuras
git add .
git commit -m "Descrição das mudanças"
git commit -m "Atualização do README.md"

git push

# Ver histórico
git log --oneline

# Criar nova branch
git checkout -b feature/nova-funcionalidade