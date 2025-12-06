
# Lumina Studio - AI Architect & App Builder

Lumina Studio is a sophisticated Progressive Web App (PWA) designed to transform natural language into functional web applications using Artificial Intelligence. It operates as an AI-assisted Integrated Development Environment (IDE), allowing you to generate, refactor, preview, and publish code directly from the browser.

## 🚀 Key Features

### 1. App Generation (Builder)
*   **Prompt to Code:** Converts text or voice descriptions into full applications (HTML/CSS/JS/React).
*   **Code Streaming:** Uses a custom XML protocol to receive and process file generation in real-time, visualizing "reasoning" and file-by-file progress.
*   **Advanced Config:** Define tech stack, complexity, language (EN/ES), and AI model (Gemini Flash/Pro or custom providers).
*   **Voice Input:** Browser API integration for dictating specifications.

### 2. Workspace (IDE)
*   **Contextual Chat:** Chat interface for requesting changes to generated code. **Context-Aware:** Injects active file and selection state for precise AI assistance.
*   **Code Editor:** **Monaco Editor** integration (VS Code engine) for manual editing with syntax highlighting. Includes **AI Annotations & Quick Fixes**:
    *   **Visual Linter:** Red/Yellow squiggles for AI-detected errors via the `<lumina-annotation>` protocol.
    *   **Auto-Fix:** Click the **Lightbulb (💡) icon** (Quick Fix action) on an error to apply the AI's suggested code fix automatically.
*   **Live Preview:** Isolated iframe that renders the generated app in real-time. Supports dependency injection (Tailwind, React via importmap).
    *   **Real-Time Dependency Feedback:** The preview actively validates external modules (e.g., `framer-motion`, `recharts`) requested by the AI. It shows a visual loader while dependencies resolve and alerts you if any fail to load from CDN.
*   **Device Simulation:** Responsive preview (Mobile, Tablet, Desktop) with integrated debug console.
*   **Smart Version Control:** Uses **Reverse Diffs** to store version history efficiently. Only the deltas between versions are saved to the database, ensuring scalability.
*   **Advanced Debugging:** The preview iframe captures `console.log` and `console.error` calls with **Source Map Simulation**, allowing you to click an error in the console and jump to the exact line in the code editor.

### 3. Integrations & Performance
*   **Local Database (Client-Side):** Uses **SQLite (WASM)** to store users, projects, settings, and chat history.
*   **Async Task Queue:** Dedicated service manages heavy operations (like DB persistence and Security Scans) to prevent UI freezing, providing real-time feedback via loading indicators.
*   **Immutable State:** Strictly enforces file system immutability using `Readonly` types. Every AI patch or user edit creates new file instances, preventing state mutation bugs.
*   **GitHub:** Integration to import existing repositories and publish (Push) generated projects directly to GitHub.
*   **Security:** AI-powered code analysis to detect vulnerabilities before execution.
*   **Download:** Export full project as `.zip`.

### 4. Visualization & Management
*   **Neural Graph (Dyad Graph):** HTML5 Canvas visualization of created projects, semantically connected by tags and technologies.
*   **Internationalization (i18n):** Full support for English and Spanish.

---

## 🛠 Technologies

*   **Core:** React 19, TypeScript.
*   **Styling:** TailwindCSS.
*   **AI:** Google Generative AI SDK (`@google/genai`).
*   **Editor:** Monaco Editor (`monaco-editor`).
*   **Database:** SQL.js (`sql.js`) - SQLite compiled to WebAssembly.
*   **Utilities:** `jszip` (Export), `prismjs` (Syntax Highlighting), `lucide-react` (Icons).

---

## 📂 Project Structure

### Root
*   `index.html`: Entry point. Loads global scripts (Tailwind CDN, SQL.js, Monaco Loader).
*   `App.tsx`: Main router. Manages navigation between views.
*   `types.ts`: Global TypeScript definitions. **Enforces Readonly types**.

### Services (`/services`)
The logical core (Backend-less architecture).
*   `geminiService.ts`: Communication with Gemini API. Handles streaming and prompt protocols.
*   `ai/streamParser.ts`: **Critical**. State machine parser that interprets the AI's XML stream (`<lumina-file>`, `<lumina-patch>`, `<lumina-dependency>`) to update UI state in real-time. Enforces immutable updates.
*   `ai/diffUtils.ts`: Utilities for computing and applying Unified Diffs.
*   `sqliteService.ts`: Abstraction layer over SQL.js. Handles CRUD and DB migrations.
*   `taskService.ts`: Manages background tasks to keep the UI responsive.
*   `diffService.ts`: Logic for calculating snapshot reverse diffs.
*   `githubService.ts`: GitHub API authentication, repo reading, and committing.
*   `fileService.ts`: File System Access API handling.
*   `authService.ts`: Simulated authentication and 2FA.

### Features

#### Workspace (`/features/workspace`)
The main development environment.
*   `WorkspaceView.tsx`: Main container. Orchestrates state between Chat, Editor, and Preview.
*   `components/WorkspaceChat.tsx`: Chat panel. Handles message display, reasoning, and file status.
*   `components/WorkspacePreview.tsx`: Renders user code in a secure iframe. Captures iframe console logs.
*   `components/WorkspaceCode.tsx`: Monaco Editor wrapper.
*   `components/WorkspaceHeader.tsx`: Toolbar (Publish, Download, Scan).
*   `utils/iframeBuilder.ts`: Generates the HTML for the preview, including error handlers and dependency validators.

#### Journal / Builder (`/features/journal`)
Start screen for creating projects.
*   `JournalInput.tsx`: Main creation screen.
*   `components/CreationForm.tsx`: Detailed form (Prompt, Stack, Complexity).
*   `components/ImportForm.tsx`: Import from GitHub or local folder.

#### Graph (`/features/graph`)
*   `DyadGraph.tsx`: Particle physics implementation in Canvas for visualizing projects.

---

## 🧠 AI Streaming Protocol

Lumina uses a strict XML-tag protocol within the AI text stream:

1.  `<lumina-reasoning>`: The model explains its plan before writing code.
2.  `<lumina-file name="...">`: Creates or overwrites a full file.
3.  `<lumina-patch name="..." format="diff">`: Applies changes using Unified Diff format.
4.  `<lumina-dependency name="..." version="...">`: Requests external NPM packages for the runtime importmap.
5.  `<lumina-command>`: Suggests terminal commands.
6.  `<lumina-annotation>`: Provides visual feedback/linting for the code editor.
    *   Example: `<lumina-annotation file="app.js" line="10" type="error" message="Fix typo" suggestion="const x = 1;" />`
7.  `<lumina-summary>`: Final message for the user.
