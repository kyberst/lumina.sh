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
*   **Database**: **SurrealDB Embedded** (WebAssembly). A multi-model database handling Relational, Document, Graph, and Vector data locally. Persists to browser `IndexedDB`.
*   **AI Layer**: Google Gemini API (`@google/genai`) via direct streaming.
*   **Editor**: Monaco Editor (VS Code engine).
*   **Sandboxing**: Code execution via `iframe` with `srcDoc` and `importmap` injection.

---

## 📂 Project Structure & File Documentation

### Root
*   **`index.html`**
    *   **Function**: Application entry point.
    *   **Purpose**: Bootstraps the DOM, loads TailwindCSS via CDN, and defines the `importmap` for external dependencies (React, SurrealDB).
    *   **Uses**: HTML5, Import Maps, CDN links.
*   **`index.tsx`**
    *   **Function**: React Root mounter.
    *   **Purpose**: Initializes React StrictMode and renders the `App` component into the DOM.
    *   **Uses**: `ReactDOM.createRoot`.
*   **`App.tsx`**
    *   **Function**: Root Component.
    *   **Purpose**: Orchestrates global authentication state, routing logic, and layout selection (Auth vs Workspace vs Dashboard).
    *   **Uses**: `useProjectData`, `AuthViews`, `WorkspaceView`, `MainNavigator`.
*   **`metadata.json`**
    *   **Function**: PWA Configuration.
    *   **Purpose**: Defines app name, permissions (microphone), and manifest properties.
    *   **Uses**: JSON.
*   **`types.ts`**
    *   **Function**: Type Re-export.
    *   **Purpose**: Maintains backward compatibility by exporting everything from `types/index.ts`.
    *   **Uses**: TypeScript.

### 🪝 Global Hooks (`hooks/`)
*   **`useProjectData.ts`**
    *   **Function**: Global State Manager.
    *   **Purpose**: centralized hook for loading/saving Users, Projects, and Settings from the database.
    *   **Uses**: `sqliteService` (SurrealDB Facade), `useState`, `useEffect`.
*   **`useVoiceInput.ts`**
    *   **Function**: Voice Recognition.
    *   **Purpose**: Wrapper around the browser's `SpeechRecognition` API for dictation.
    *   **Uses**: `window.SpeechRecognition`.

### 🧩 Features (UI Modules)

#### Auth (`features/auth/`)
*   **`AuthViews.tsx`**
    *   **Function**: Auth State Machine.
    *   **Purpose**: Switches between Login, Register, and Recovery forms.
    *   **Uses**: `useState`.
*   **`AuthLayout.tsx`**
    *   **Function**: Layout Wrapper.
    *   **Purpose**: Provides the split-screen design (Marketing left, Form right).
    *   **Uses**: TailwindCSS grid.
*   **`components/LoginForm.tsx`**
    *   **Function**: Sign In UI.
    *   **Purpose**: Handles email/password input and 2FA verification.
    *   **Uses**: `authService`.
*   **`components/RegisterForm.tsx`**
    *   **Function**: Sign Up UI.
    *   **Purpose**: Handles new user registration flow.
    *   **Uses**: `authService`.
*   **`components/RecoverForm.tsx`**
    *   **Function**: Password Reset UI.
    *   **Purpose**: Simulates password recovery flow.
    *   **Uses**: `authService`.

#### Journal / Builder (`features/journal/`)
*   **`JournalInput.tsx`**
    *   **Function**: App Creation Wizard.
    *   **Purpose**: Main interface for defining new projects (Text/Voice) or importing existing ones.
    *   **Uses**: `CreationForm`, `ImportForm`.
*   **`EntryCard.tsx`**
    *   **Function**: Project Dashboard Item.
    *   **Purpose**: Displays a summary of a created app (tags, complexity, visual tech bar).
    *   **Uses**: `JournalEntry` type.
*   **`hooks/useCreationForm.ts`**
    *   **Function**: Form Logic.
    *   **Purpose**: Manages state for the app creation inputs (stack, model, prompts).
    *   **Uses**: `useVoiceInput`.
*   **`hooks/useImportForm.ts`**
    *   **Function**: Import Logic.
    *   **Purpose**: Handles file system reading or GitHub API calls for importing code.
    *   **Uses**: `githubService`, `fileService`.
*   **`components/CreationForm.tsx`**
    *   **Function**: Spec Definition UI.
    *   **Purpose**: Form for describing the app, selecting stack, and complexity.
    *   **Uses**: `TechStackSelector`, `ComplexityControl`.
*   **`components/ImportForm.tsx`**
    *   **Function**: Import UI.
    *   **Purpose**: Tab for selecting Local Folder or GitHub Repo.
    *   **Uses**: `RepoImport`.
*   **`components/BuildTerminal.tsx`**
    *   **Function**: Visual Console.
    *   **Purpose**: Displays "Hacker-style" logs during app generation.
    *   **Uses**: `ConsoleLog` interface.

#### Workspace IDE (`features/workspace/`)
*   **`WorkspaceView.tsx`**
    *   **Function**: Main IDE Container.
    *   **Purpose**: Orchestrates the Chat, Editor, and Preview panes. Coordinates the AI generation loop.
    *   **Uses**: `useRefactorStream`, `useEditorSystem`, `usePreviewSystem`.
*   **`hooks/useWorkspaceLayout.ts`**
    *   **Function**: Layout State.
    *   **Purpose**: Manages sidebar toggles, tab selection (Preview/Code/Info), and device mode.
    *   **Uses**: `useState`.
*   **`hooks/useRefactorStream.ts`**
    *   **Function**: AI Core Logic (The "Brain").
    *   **Purpose**: Manages the streaming connection to Gemini, parses XML chunks, applies diffs, and saves history.
    *   **Uses**: `geminiService`, `streamParser`, `sqliteService`.
*   **`hooks/usePreviewSystem.ts`**
    *   **Function**: Sandbox Manager.
    *   **Purpose**: Generates the `srcDoc` for the iframe and captures console logs via `postMessage`.
    *   **Uses**: `iframeBuilder`.
*   **`hooks/useEditorSystem.ts`**
    *   **Function**: Editor Logic.
    *   **Purpose**: Manages Monaco Editor state, file selection, and content updates.
    *   **Uses**: `CodeEditorApi`.
*   **`components/WorkspaceHeader.tsx`**
    *   **Function**: Top Navigation.
    *   **Purpose**: Actions for Download, Publish, Refresh, and Tab switching.
    *   **Uses**: `WorkspaceHeaderProps`.
*   **`components/WorkspaceChat.tsx`**
    *   **Function**: Chat Panel.
    *   **Purpose**: Displays the conversation history and the input area.
    *   **Uses**: `ChatMessageItem`, `ThinkingCard`.
*   **`components/WorkspaceCode.tsx`**
    *   **Function**: Code Panel.
    *   **Purpose**: Renders the File Tree and the Monaco Editor.
    *   **Uses**: `CodeEditor` component.
*   **`components/WorkspacePreview.tsx`**
    *   **Function**: Preview Panel.
    *   **Purpose**: Renders the user's app inside a sandboxed Iframe.
    *   **Uses**: `PreviewToolbar`, `ConsolePanel`.
*   **`components/WorkspaceInfo.tsx`**
    *   **Function**: Metadata Panel.
    *   **Purpose**: Allows editing project name, tags, and Environment Variables.
    *   **Uses**: `JournalEntry` type.
*   **`components/ChatMessageItem.tsx`**
    *   **Function**: Message Bubble.
    *   **Purpose**: Renders Markdown text, Diff summaries, and AI reasoning blocks.
    *   **Uses**: `MarkdownRenderer`.
*   **`components/EnvVarRequestMessage.tsx`**
    *   **Function**: Env Var Form.
    *   **Purpose**: UI for the AI to request API Keys/Secrets from the user securely.
    *   **Uses**: `EnvVarRequest` type.
*   **`components/chat/ThinkingCard.tsx`**
    *   **Function**: Progress Indicator.
    *   **Purpose**: Visualizes the AI's "Thought Process", plan progress, and real-time file status.
    *   **Uses**: `AIPlan` type.
*   **`components/chat/ChatInputArea.tsx`**
    *   **Function**: Input Bar.
    *   **Purpose**: Textarea for prompts, voice toggle, and attachment button.
    *   **Uses**: `useVoiceInput`.
*   **`components/preview/PreviewToolbar.tsx`**
    *   **Function**: Device Toggles.
    *   **Purpose**: Buttons to switch iframe size (Mobile/Tablet/Desktop).
    *   **Uses**: SVG Icons.
*   **`components/preview/ConsolePanel.tsx`**
    *   **Function**: DevTools Console.
    *   **Purpose**: Shows logs/errors captured from the iframe.
    *   **Uses**: `Log` interface.
*   **`utils/iframeBuilder.ts`**
    *   **Function**: HTML Compiler.
    *   **Purpose**: Assembles user code, CSS, and Import Maps into a single HTML string for the iframe. Injects error capturing scripts.
    *   **Uses**: String manipulation.

#### Navigation (`features/navigation/`)
*   **`MainNavigator.tsx`**
    *   **Function**: Route Switcher.
    *   **Purpose**: Renders the appropriate "Page" (Builder, Projects, Settings, etc.) based on current state.
    *   **Uses**: Conditional rendering.

#### Profile (`features/profile/`)
*   **`ProfileView.tsx`**
    *   **Function**: Profile Page.
    *   **Purpose**: Container for user details.
    *   **Uses**: `ProfileHeader`.
*   **`components/ProfileHeader.tsx`**
    *   **Function**: User Summary.
    *   **Purpose**: Shows avatar, name, and credits.
    *   **Uses**: `User` type.
*   **`components/ProfileDetails.tsx`**
    *   **Function**: Edit Form.
    *   **Purpose**: Allows changing name/email.
    *   **Uses**: `User` type.
*   **`components/ProfileSessions.tsx`**
    *   **Function**: Session Manager.
    *   **Purpose**: Lists active devices and allows revoking access.
    *   **Uses**: `sqliteService`.
*   **`components/ProfileBilling.tsx`**
    *   **Function**: Transaction History.
    *   **Purpose**: Shows credit usage/purchases.
    *   **Uses**: `sqliteService`.

#### Settings (`features/settings/`)
*   **`SettingsView.tsx`**
    *   **Function**: Config Page.
    *   **Purpose**: Manage language, theme, Memory settings, and AI providers.
    *   **Uses**: `AppSettings`.
*   **`components/AIProviderSettings.tsx`**
    *   **Function**: LLM Config.
    *   **Purpose**: CRUD interface for adding custom OpenAI-compatible providers.
    *   **Uses**: `AIProvider` type.

#### Graph (`features/graph/`)
*   **`DyadGraph.tsx`**
    *   **Function**: Visual Knowledge Graph.
    *   **Purpose**: Renders a force-directed graph of projects and their semantic connections using HTML Canvas.
    *   **Uses**: `Canvas API`, `requestAnimationFrame`.

#### Insight (`features/insight/`)
*   **`DyadChat.tsx`**
    *   **Function**: Global Assistant.
    *   **Purpose**: Chat interface to talk *about* all projects (RAG).
    *   **Uses**: `sqliteService`, `geminiService`.
*   **`components/ChatList.tsx`**
    *   **Function**: Message ScrollView.
    *   **Purpose**: Renders chat history for the assistant.
    *   **Uses**: `MarkdownRenderer`.

---

### ⚙️ Services (Business Logic)

#### AI Core (`services/ai/`)
*   **`generator.ts`**
    *   **Function**: One-Shot Generator.
    *   **Purpose**: Calls Gemini to generate the initial project structure from a prompt.
    *   **Uses**: `@google/genai`, `callCustomLLM`.
*   **`protocol.ts`**
    *   **Function**: Protocol Export.
    *   **Purpose**: Exports the XML protocol definitions used in system prompts.
    *   **Uses**: `prompts/protocol.ts`.
*   **`diffUtils.ts`**
    *   **Function**: Diff Engine.
    *   **Purpose**: Implements algorithms to create patches and apply Unified Diffs to strings.
    *   **Uses**: LCS Algorithm (Longest Common Subsequence).
*   **`streamParser.ts`**
    *   **Function**: Parser Barrier.
    *   **Purpose**: Re-exports stream logic.
    *   **Uses**: `stream/*`.
*   **`prompts/protocol.ts`**
    *   **Function**: XML Rules.
    *   **Purpose**: Defines the strict `<lumina-*>` XML tags the AI must use.
    *   **Uses**: String constant.
*   **`prompts/refactor.ts`**
    *   **Function**: Refactor Prompt.
    *   **Purpose**: The system prompt for the Workspace Chat (Editing code).
    *   **Uses**: `SYSTEM_PROTOCOL`.
*   **`prompts/dyad.ts`**
    *   **Function**: Architect Prompt.
    *   **Purpose**: System prompt for the Global Assistant.
    *   **Uses**: String template.
*   **`stream/chunkParser.ts`**
    *   **Function**: Stream State Machine.
    *   **Purpose**: Parses incoming XML chunks from the AI stream and updates the `StreamState`.
    *   **Uses**: `StreamState`, `updateFile`.
*   **`stream/types.ts`**
    *   **Function**: Stream Interfaces.
    *   **Purpose**: TypeScript definitions for the streaming state (Buffer, Mode, etc.).
    *   **Uses**: `GeneratedFile`.
*   **`stream/utils.ts`**
    *   **Function**: Parser Helpers.
    *   **Purpose**: Utilities for parsing XML attributes and updating file arrays.
    *   **Uses**: RegEx.

#### Database (`services/db/`)
*   **`dbCore.ts`**
    *   **Function**: SurrealDB Core.
    *   **Purpose**: Initializes the `Surreal` client with **WebAssembly engines**. Handles connection to `indb://` (IndexedDB) or `mem://`.
    *   **Uses**: `surrealdb`, `@surrealdb/wasm`.
*   **`migrations.ts`**
    *   **Function**: Migration Runner.
    *   **Purpose**: Orchestrates the creation of schemas/tables on app start.
    *   **Uses**: `schema/*`.
*   **`schema/authSchema.ts`**
    *   **Function**: Auth Schema.
    *   **Purpose**: Defines indexes/tables for Users.
    *   **Uses**: SurrealQL.
*   **`schema/appSchema.ts`**
    *   **Function**: App Schema.
    *   **Purpose**: Placeholder for application tables.
    *   **Uses**: SurrealQL.
*   **`schema/historySchema.ts`**
    *   **Function**: Memory Schema.
    *   **Purpose**: Defines tables for Chat History and Memories.
    *   **Uses**: SurrealQL.

#### GitHub Integration (`services/github/`)
*   **`api.ts`**
    *   **Function**: API Helper.
    *   **Purpose**: Generic fetch wrapper for GitHub API (Headers, Error Handling).
    *   **Uses**: `fetch`.
*   **`context.ts`**
    *   **Function**: Auth Validation.
    *   **Purpose**: Verifies GitHub tokens.
    *   **Uses**: `api.ts`.
*   **`repo.ts`**
    *   **Function**: Repo Actions.
    *   **Purpose**: Fetches user repositories and downloads file content (Import).
    *   **Uses**: GitHub API.
*   **`publish.ts`**
    *   **Function**: Publisher.
    *   **Purpose**: Commits and Pushes generated code to a GitHub repository.
    *   **Uses**: GitHub API (PUT contents).

#### Repositories (`services/repositories/`)
*   **`baseRepository.ts`**
    *   **Function**: Abstract Class.
    *   **Purpose**: Provides helper methods for mapping DB results.
    *   **Uses**: Generics.
*   **`userRepository.ts`**
    *   **Function**: User Data Access.
    *   **Purpose**: CRUD operations for `users` table via SurrealQL.
    *   **Uses**: `dbCore`.
*   **`projectRepository.ts`**
    *   **Function**: Project Data Access.
    *   **Purpose**: CRUD operations for `projects` table via SurrealQL.
    *   **Uses**: `dbCore`.
*   **`sessionRepository.ts`**
    *   **Function**: Session Data Access.
    *   **Purpose**: Manages `sessions` and `transactions` tables.
    *   **Uses**: `dbCore`.
*   **`chatRepository.ts`**
    *   **Function**: Chat Data Access.
    *   **Purpose**: Manages `chat_history` and `refactor_history`. Calculates Reverse Diffs.
    *   **Uses**: `diffService`, `dbCore`.

#### Localization (`services/i18n/`)
*   **`translations.ts`**
    *   **Function**: Dictionary Loader.
    *   **Purpose**: Aggregates locales and handles legacy compatibility keys.
    *   **Uses**: `locales/en`, `locales/es`.
*   **`locales/en.ts`**
    *   **Function**: English Source.
    *   **Purpose**: Text strings for English.
    *   **Uses**: Object literal.
*   **`locales/es.ts`**
    *   **Function**: Spanish Source.
    *   **Purpose**: Text strings for Spanish.
    *   **Uses**: Object literal.

#### Utilities
*   **`authService.ts`**
    *   **Function**: Authentication Facade.
    *   **Purpose**: High-level methods for login/register (Calls Repository).
    *   **Uses**: `sqliteService`.
*   **`dialogService.ts`**
    *   **Function**: Modal Manager.
    *   **Purpose**: Event-driven system to show confirmation/alert dialogs.
    *   **Uses**: Observer Pattern.
*   **`diffService.ts`**
    *   **Function**: Time Travel Logic.
    *   **Purpose**: Calculates "Reverse Diffs" to allow undoing AI changes.
    *   **Uses**: `diffUtils`.
*   **`fileService.ts`**
    *   **Function**: IO Helper.
    *   **Purpose**: Reads files from the browser's `input type="file"`.
    *   **Uses**: `FileReader`.
*   **`geminiService.ts`**
    *   **Function**: AI Client.
    *   **Purpose**: Main wrapper for `@google/genai`. Handles streaming chat and generation.
    *   **Uses**: Google GenAI SDK.
*   **`llmService.ts`**
    *   **Function**: Custom LLM Client.
    *   **Purpose**: Connects to OpenAI-compatible endpoints (Ollama, LM Studio).
    *   **Uses**: `fetch`.
*   **`logger.ts`**
    *   **Function**: Log Manager.
    *   **Purpose**: Centralized logging with levels (Info/Warn/Error).
    *   **Uses**: `console`.
*   **`memory/index.ts`**
    *   **Function**: Memory Orchestrator.
    *   **Purpose**: Manages Semantic Search (Vector) and Graph relations using SurrealDB.
    *   **Uses**: `dbCore`, `GoogleGenAI` (for embeddings).
*   **`promptService.ts`**
    *   **Function**: Prompt Loader.
    *   **Purpose**: Fetches markdown prompt files from `assets/prompts`.
    *   **Uses**: `fetch`.
*   **`sqliteService.ts`**
    *   **Function**: Database Facade.
    *   **Purpose**: **IMPORTANT**: Despite the name (legacy), this is the main abstraction layer over **SurrealDB**. It initializes the DB and exposes repositories.
    *   **Uses**: `dbCore`, Repositories.
*   **`taskService.ts`**
    *   **Function**: Queue Manager.
    *   **Purpose**: Serializes async operations to prevent race conditions.
    *   **Uses**: `Promise`.
*   **`toastService.ts`**
    *   **Function**: Notification Manager.
    *   **Purpose**: Event-driven system to show toast messages.
    *   **Uses**: Observer Pattern.
*   **`validator.ts`**
    *   **Function**: Data Validator.
    *   **Purpose**: Lightweight schema validation (similar to AJV).
    *   **Uses**: JavaScript typeof checks.

---

### 🎨 Shared Components (`components/ui/`)
*   **`Layout.tsx`**
    *   **Function**: Global UI Wrapper.
    *   **Purpose**: Contains the Navbar and Footer.
    *   **Uses**: `MainNavigator`.
*   **`CodeEditor.tsx`**
    *   **Function**: Editor Widget.
    *   **Purpose**: Wraps the **Monaco Editor** (VS Code), handles resizing, and displays AI annotations (Quick Fixes).
    *   **Uses**: `monaco-editor`.
*   **`MarkdownRenderer.tsx`**
    *   **Function**: Text Renderer.
    *   **Purpose**: Renders Markdown text with syntax highlighting for code blocks.
    *   **Uses**: `SyntaxHighlighter`.
*   **`SyntaxHighlighter.tsx`**
    *   **Function**: Code Colorizer.
    *   **Purpose**: Highlights code snippets using **PrismJS**.
    *   **Uses**: `prismjs`.
*   **`ToastContainer.tsx`**
    *   **Function**: Notification UI.
    *   **Purpose**: Renders the stack of active toast messages.
    *   **Uses**: `toastService`.
*   **`DialogContainer.tsx`**
    *   **Function**: Modal UI.
    *   **Purpose**: Renders active modal dialogs.
    *   **Uses**: `dialogService`.

---

### 📦 Assets

#### Prompts (`assets/prompts/`)
*   **`builder_system.md`**: System instructions for generating new apps.
*   **`refactor_system.md`**: System instructions for the Refactor loop (Workspace).
*   **`protocol.md`**: The strictly enforced XML output protocol.
*   **`dyad.md`**: Persona definition for the Global Assistant.

---

### 📚 Type Definitions (`types/`)
*   **`index.ts`**: Barrel file exporting all types.
*   **`core.ts`**: Enums (LogLevel, AppModule) and Error classes.
*   **`auth.ts`**: Interfaces for User, Session, Transaction.
*   **`project.ts`**: Interfaces for JournalEntry, GeneratedFile.
*   **`ai.ts`**: Interfaces for ChatMessage, AIPlan, AIProvider.
*   **`settings.ts`**: Interfaces for AppSettings, MemorySettings.