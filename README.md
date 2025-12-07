# Lumina Studio - AI Architect & App Builder

Lumina Studio is a sophisticated Progressive Web App (PWA) that acts as an AI-powered Integrated Development Environment (IDE). It transforms natural language into functional web applications using a Client-Side architecture.

## 🏗 Architecture

The application follows a **Local-First, Client-Side** architecture to ensure privacy and speed. It adheres to strict modularity rules:
- **Atomic File Structure**: No file exceeds 200 lines of code.
- **Recursive Directory Layout**: Features and services are decomposed into granular sub-modules.
- **Single Responsibility**: Each component, hook, and service handles a specific domain.

### Core Stack
*   **Runtime**: React 19, TypeScript, Vite.
*   **State Management**: React Hooks + Custom Event Systems (Toast/Dialog/Task Services).
*   **Database**: `sql.js` (SQLite compiled to WebAssembly). Data persists to browser `IndexedDB`.
*   **AI Layer**: Google Gemini API (`@google/genai`) via direct streaming.
*   **Editor**: Monaco Editor (VS Code engine).
*   **Sandboxing**: Code execution via `iframe` with `srcDoc` and `importmap` injection.

---

## 📂 Project Structure

### Root
- `index.html` - Entry point.
- `index.tsx` - React bootstrap.
- `App.tsx` - Main routing and layout orchestration.
- `metadata.json` - PWA capabilities configuration.
- `types.ts` - Legacy bridge (re-exports `types/index.ts`).

### 🪝 Global Hooks (`hooks/`)
- `useProjectData.ts` - Global state container (User, Projects, Settings).
- `useVoiceInput.ts` - Speech recognition logic.

### 🧩 Features (UI Modules)

#### Auth (`features/auth/`)
- `AuthViews.tsx` - Auth flow orchestrator.
- `AuthLayout.tsx` - Split-screen layout.
- `components/`
  - `LoginForm.tsx`
  - `RegisterForm.tsx`
  - `RecoverForm.tsx`

#### Journal / Builder (`features/journal/`)
- `JournalInput.tsx` - Main wizard container.
- `EntryCard.tsx` - Project list item.
- `hooks/`
  - `useCreationForm.ts` - Wizard logic.
  - `useImportForm.ts` - GitHub/File import logic.
- `components/`
  - `CreationForm.tsx`
  - `ImportForm.tsx`
  - `BuildTerminal.tsx`
  - `creation/`
    - `TechStackSelector.tsx`
    - `ComplexityControl.tsx`
  - `import/`
    - `RepoImport.tsx`

#### Workspace IDE (`features/workspace/`)
- `WorkspaceView.tsx` - Main IDE container.
- `hooks/`
  - `useWorkspaceLayout.ts` - UI state (Tabs, Sidebar).
  - `useRefactorStream.ts` - AI Chat Loop & State Machine.
  - `usePreviewSystem.ts` - Iframe management.
  - `useEditorSystem.ts` - Monaco logic & saving.
- `components/`
  - `WorkspaceHeader.tsx`
  - `WorkspaceChat.tsx` - Chat container.
  - `WorkspaceCode.tsx` - Editor container.
  - `WorkspacePreview.tsx` - Live preview container.
  - `WorkspaceInfo.tsx` - Metadata editor.
  - `ChatMessageItem.tsx`
  - `EnvVarRequestMessage.tsx`
  - `chat/`
    - `ThinkingCard.tsx` - AI reasoning visualizer.
    - `ChatInputArea.tsx`
  - `preview/`
    - `PreviewToolbar.tsx`
    - `ConsolePanel.tsx`
- `utils/`
  - `iframeBuilder.ts` - HTML injection engine.

#### Navigation (`features/navigation/`)
- `MainNavigator.tsx` - Route switcher.

#### Profile (`features/profile/`)
- `ProfileView.tsx`
- `components/`
  - `ProfileHeader.tsx`
  - `ProfileDetails.tsx`
  - `ProfileSessions.tsx`
  - `ProfileBilling.tsx`

#### Settings (`features/settings/`)
- `SettingsView.tsx`
- `components/`
  - `AIProviderSettings.tsx` - Custom LLM configuration.

#### Graph (`features/graph/`)
- `DyadGraph.tsx` - Canvas-based neural visualization.

#### Insight (`features/insight/`)
- `DyadChat.tsx` - Global assistant.
- `components/`
  - `ChatList.tsx`

---

### ⚙️ Services (Business Logic)

#### AI Core (`services/ai/`)
- `generator.ts` - One-shot generation.
- `protocol.ts` - System prompt configuration.
- `diffUtils.ts` - Unified Diff algorithms.
- `streamParser.ts` - Stream parser barrel.
- `prompts/`
  - `protocol.ts` - XML Protocol definition.
  - `refactor.ts` - Refactoring prompt.
  - `dyad.ts` - Architect prompt.
- `stream/`
  - `chunkParser.ts` - XML Chunk state machine.
  - `types.ts` - Stream interfaces.
  - `utils.ts` - Stream helpers.

#### Database (`services/db/`)
- `dbCore.ts` - `sql.js` wrapper & persistence.
- `migrations.ts` - Schema orchestrator.
- `schema/`
  - `authSchema.ts`
  - `appSchema.ts`
  - `historySchema.ts`

#### GitHub Integration (`services/github/`)
- `api.ts` - Base fetch wrappers.
- `context.ts` - Token validation.
- `repo.ts` - Repository fetching/importing.
- `publish.ts` - Commit & Push logic.

#### Repositories (Data Access) (`services/repositories/`)
- `baseRepository.ts`
- `userRepository.ts`
- `projectRepository.ts`
- `sessionRepository.ts`
- `chatRepository.ts` - Handles Chat & Reverse Diffs.

#### Localization (`services/i18n/`)
- `locales/`
  - `en.ts` - English Dictionary.
  - `es.ts` - Spanish Dictionary.

#### Utilities
- `authService.ts` - Auth logic facade.
- `dialogService.ts` - Modal manager.
- `diffService.ts` - Snapshot/Restore logic.
- `fileService.ts` - FileSystem API wrapper.
- `geminiService.ts` - Google GenAI SDK wrapper.
- `llmService.ts` - Generic LLM client for custom providers.
- `logger.ts` - Structured logging.
- `promptService.ts` - External prompt loader.
- `sqliteService.ts` - DB Facade.
- `taskService.ts` - Async queue manager.
- `toastService.ts` - Notification manager.
- `translations.ts` - i18n wrapper.
- `validator.ts` - Schema validation.

---

### 🎨 Shared Components (`components/ui/`)
- `Layout.tsx`
- `CodeEditor.tsx` (Monaco Wrapper)
- `MarkdownRenderer.tsx`
- `SyntaxHighlighter.tsx` (PrismJS Wrapper)
- `ToastContainer.tsx`
- `DialogContainer.tsx`

---

### 📦 Assets

#### Prompts (`assets/prompts/`)
- `builder_system.md`
- `refactor_system.md`
- `protocol.md`
- `dyad.md`

#### Locales (`assets/locales/`)
- `en/`, `es/` (Legacy JSON modules, references).

---

### 📚 Type Definitions (`types/`)
- `index.ts` - Main export.
- `core.ts` - Enums & Errors.
- `auth.ts` - User & Session models.
- `project.ts` - File & Project models.
- `ai.ts` - Chat & Protocol models.
- `settings.ts` - Configuration models.