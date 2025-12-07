# Lumina Studio ⚡️

**Lumina Studio** is a sophisticated, local-first AI Integrated Development Environment (IDE) designed to architect, build, and refactor full-stack web applications using natural language.

Unlike standard code assistants, Lumina operates as an **Autonomous Architect**. It adheres to strict structural rules, manages a semantic knowledge graph of your project, and executes complex refactors using a proprietary streaming protocol.

---

## 🚀 Key Features

*   **Local-First Architecture**: Powered by **SurrealDB Embedded (WASM)**. Your data, projects, and vector embeddings live entirely in your browser via IndexedDB. No external backend required.
*   **Provider Agnostic (LLM Factory)**: Native support for **Google Gemini**, with an extensible factory pattern to support OpenAI, Anthropic, or local LLMs (Ollama) via custom endpoints.
*   **The Lumina Protocol**: A robust XML-based streaming protocol (`<lumina-file>`, `<lumina-patch>`) that ensures deterministic code generation and atomic updates.
*   **"No-Loss" Refactoring**: Implements a defensive coding strategy that forces the AI to explicitly justify deletions, preventing accidental logic loss during large refactors.
*   **Multi-Runtime Support**: Intelligent dependency resolution for **Node.js** and **Python** environments.
*   **Visual Knowledge Graph**: A force-directed graph visualizing the semantic topology and complexity of your application cluster.

---

## 🏗 System Architecture

Lumina Studio is built on a modular, Client-Side architecture ensuring privacy, speed, and maintainability.

### 1. The Core (React + Vite)
The application is a Progressive Web App (PWA) built with **React 19** and **TypeScript**. It uses a recursive directory structure where no source file exceeds **200 lines of code** (Atomic Modularity Rule).

### 2. AI Layer & LLM Factory
Lumina abstracts the AI provider to ensure flexibility.
*   **Interface**: `ILLMProvider` handles `generateContent` and `generateStream`.
*   **Factory**: `LLMFactory` instantiates the correct adapter (Gemini, Custom/OpenAI) based on user settings.
*   **Thinking Budget**: Normalizes reasoning capabilities (Low/Medium/High) across different model architectures.

### 3. Database & Memory (SurrealDB WASM)
*   **Relational**: Stores Users, Projects, and Sessions.
*   **Graph**: Manages dependencies (`files -> imports -> modules`).
*   **Vector**: Stores embeddings for RAG (Retrieval Augmented Generation) to provide context-aware answers.

### 4. Editor Engine (Monaco + Plugins)
Wraps the VS Code editor engine (Monaco) with a plugin architecture:
*   **Language Plugins**: Lazy-loads support for TS, JS, Python, HTML, CSS.
*   **Linter Abstraction**: AI-generated `<lumina-annotation>` tags are transformed into native editor markers and Quick Fix actions.

---

## 🛠 Installation & Setup

### Prerequisites
*   Node.js 18+
*   A Google Gemini API Key (or an OpenAI-compatible provider key).

### Local Development

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/lumina-studio.git
    cd lumina-studio
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory (optional, key can be entered in UI):
    ```env
    API_KEY=your_google_gemini_key
    ```

4.  **Run the application:**
    ```bash
    npm run dev
    ```
    Access the studio at `http://localhost:5173`.

---

## 📐 Project Structure

```
src/
├── features/           # UI Domains (Auth, Workspace, Settings)
│   ├── editor/         # Plugin-based Editor Architecture
│   └── workspace/      # IDE Logic (Chat, Code, Preview)
├── services/           # Business Logic
│   ├── ai/             # AI Orchestration
│   │   ├── providers/  # LLM Adapters (Gemini, Custom)
│   │   ├── stream/     # Protocol Parsers
│   │   └── prompts/    # System Prompts & Protocols
│   ├── db/             # SurrealDB WASM Core & Schemas
│   └── memory/         # Vector Search & RAG
├── assets/             # Static Assets & Locales
└── types/              # TypeScript Definitions
```

---

## 🔮 The Lumina Protocol

Lumina communicates via a specialized XML stream. This allows the AI to perform multiple actions in a single response.

| Tag | Description | Attributes |
| :--- | :--- | :--- |
| `<lumina-reasoning>` | Architectural thinking process. | N/A |
| `<lumina-plan>` | Progress tracking. | `step`, `task` |
| `<lumina-file>` | Create/Overwrite file content. | `name` |
| `<lumina-patch>` | Unified Diff patch for existing files. | `name`, `format="diff"` |
| `<lumina-command>` | Execute shell/runtime commands. | `type` ("shell", "package_install", "db_migration") |
| `<lumina-dependency>` | Declare external module requirement. | `name`, `version`, `runtime` |
| `<lumina-annotation>` | Visual editor feedback/errors. | `file`, `line`, `type`, `message` |

---

## 🤝 Contributing

Contributions are welcome! Please ensure any new code adheres to the **200-line limit** per file and follows the **Single Responsibility Principle**.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
