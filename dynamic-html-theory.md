# Dynamic HTML Theory Plan

## Overview
Transform the Learning Mode theory pages into a dynamic visual experience using HTML/CSS/JS files instead of plain Markdwon.
Administrators will be able to upload HTML files directly from the Admin Panel, which sets a Supabase Storage URL as the theory content.
The frontend (Student View) will render this HTML perfectly via a sandboxed iframe.

## Proposed Changes

### `src/services/contentService.supabase.ts`
- Add a new function `uploadTheoryHtml(file: File): Promise<string>` to handle uploading HTML files to a public `materiais_estudo` bucket.
- Update `saveLearningSection` to ensure URL preservation or update if a static URL is passed as content.

### `src/pages/admin/AdminLearningQuestionsPage.tsx`
- Modify the Theory Modal.
- Add a "File Upload" input for `.html` files.
- When an HTML file is selected, upload it via `uploadTheoryHtml(file)` upon saving.
- Save the resulting public URL into the `content` field.
- Listagem de teorias agora exibe um preview escalonado do iframe.
- Upload obrigatório de `.html` para novos conteúdos teóricos.

### `src/components/VisualizadorTeoria.tsx` [NEW]
- Create a new component `VisualizadorTeoria` that takes a `url` prop.
- Render an `iframe` with `src={url}`, configured to be `w-full min-h-[600px] border-0 rounded-2xl bg-white`.
- Add proper `sandbox="allow-scripts allow-same-origin"` attributes.

### `src/pages/PracticeQuizPage.tsx`
- Renderiza a teoria exclusivamente via `<VisualizadorTeoria />`.
- Eliminada qualquer lógica de renderização de Markdown para teorias.

## Tech Stack
- Frontend: React / TypeScript / Tailwind CSS
- Backend/Storage: Supabase Storage
- Rendering: Sandboxed iframe component

## ✅ PHASE X COMPLETE
- [x] Lint & Type Check: `npm run lint && npx tsc --noEmit`
- [x] Build Verification: `npm run build`
- [ ] Manual test: Upload `.html` as theory and verify correct iframe rendering
- Lint: ✅ Pass
- Security: ✅ No critical issues
- Build: ✅ Success
- Date: 2026-03-18
