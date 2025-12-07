import { BasePlugin } from './basePlugin';

export class TypeScriptPlugin extends BasePlugin {
  constructor() {
    super('typescript');
  }

  onMount(monaco: any, editor: any): void {
    // Configure TypeScript Compiler Options for the Monaco Environment
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ["node_modules/@types"]
    });

    // Add React Type definitions (Mocked for basics)
    const reactTypes = `
      declare module 'react' { var x: any; export = x; }
      declare module 'react-dom/client' { var x: any; export = x; }
    `;
    monaco.languages.typescript.typescriptDefaults.addExtraLib(reactTypes, 'react.d.ts');
  }
}

export class JavaScriptPlugin extends TypeScriptPlugin {
    constructor() {
        super();
        this.language = 'javascript';
    }
}