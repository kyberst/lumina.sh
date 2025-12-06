
# Lumina Studio - AI Architect & App Builder

Lumina Studio is a sophisticated Progressive Web App (PWA) that acts as an AI-powered Integrated Development Environment (IDE). It transforms natural language into functional web applications using a Client-Side architecture.

## 🏗 Architecture

The application follows a **Local-First, Client-Side** architecture to ensure privacy and speed.

### Core Stack
*   **Runtime**: React 19, TypeScript, Vite.
*   **State Management**: React Hooks + Custom Event Systems (Toast/Dialog/Task Services).
*   **Database**: `sql.js` (SQLite compiled to WebAssembly). Data persists to browser `IndexedDB`.
*   **AI Layer**: Google Gemini API (`@google/genai`) via direct streaming.
*   **Editor**: Monaco Editor (VS Code engine).
*   **Sandboxing**: Code execution via `iframe` with `srcDoc` and `importmap` injection.

### Key Modules

| Module | Description | Path |
| :--- | :--- | :--- |
| **Auth** | Simulated Authentication & 2FA. | `features/auth/` |
| **Journal** | Project creation wizard and prompt engineering. | `features/journal/` |
| **Workspace** | The main IDE (Chat, Code Editor, Preview). | `features/workspace/` |
| **Core Services** | Singleton services for DB, AI, and GitHub. | `services/` |

---

## 🚀 Features & Protocols

### 1. AI Streaming Protocol (`services/ai/streamParser.ts`)
Lumina uses a custom XML protocol to parse AI responses in real-time:
*   `<lumina-reasoning>`: Internal thought process visualization.
*   `<lumina-plan>`: Structured progress updates (Step X/Y).
*   `<lumina-file>` / `<lumina-patch>`: File creation and unified diff patching.
*   `<lumina-dependency>`: Dynamic `importmap` injection for React libraries.
*   `<lumina-annotation>`: Visual linter errors and quick-fix suggestions.

### 2. Intelligent History (Reverse Diffs)
To optimize local storage:
*   **Storage**: Only the **Reverse Diff** (delta to go back in time) is saved for each chat turn.
*   **Reconstruction**: The app applies diffs in reverse order from the current state to view history.
*   **Files**: `services/diffService.ts`, `services/ai/diffUtils.ts`.

### 3. Concurrency & Locking
*   **Project Locking**: Prevents race conditions between AI generation and manual user edits.
*   **Task Queue**: Heavy operations (DB saves, Security Scans) are queued in `services/taskService.ts` to prevent UI freezing.

### 4. Visual Feedback
*   **Linter**: AI annotations appear as red/yellow squiggles in the editor.
*   **Quick Fixes**: "Lightbulb" actions in Monaco Editor apply AI-suggested patches.
*   **Dependency Status**: The preview iframe reports loading status of external ESM modules back to the main thread.

---

## 📂 File Manifest & Logic Separation

### Data Layer (`services/db/`)
*   `dbCore.ts`: Low-level wrapper for `sql.js` WASM and `IndexedDB` persistence.
*   `migrations.ts`: Schema definitions.

### AI Layer (`services/ai/`)
*   `protocol.ts`: Defines the System Prompt and XML tags.
*   `generator.ts`: Non-streaming app generation logic.
*   `streamParser.ts`: State machine for parsing XML chunks.
*   `diffUtils.ts`: LCS (Longest Common Subsequence) algorithms for patching.

### Workspace Logic (`features/workspace/`)
*   `hooks/useRefactorStream.ts`: Manages the AI chat loop, context injection, and state updates.
*   `utils/iframeBuilder.ts`: Constructs the preview HTML, injecting error handlers and source maps.

---

## 🌍 Internationalization (i18n)
*   User-facing strings are stored in `assets/locales/{lang}/{module}.json`.
*   Supported: English (`en`), Spanish (`es`).
