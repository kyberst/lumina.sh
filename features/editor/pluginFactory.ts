import { IEditorPlugin } from './plugins/interface';
import { BasePlugin } from './plugins/basePlugin';
import { TypeScriptPlugin, JavaScriptPlugin } from './plugins/typescriptPlugin';

export class PluginFactory {
  static getPlugin(language: string): IEditorPlugin {
    switch (language) {
      case 'typescript':
      case 'ts':
      case 'tsx':
        return new TypeScriptPlugin();
      case 'javascript':
      case 'js':
      case 'jsx':
        return new JavaScriptPlugin();
      case 'python':
      case 'py':
        return new BasePlugin('python');
      case 'html':
        return new BasePlugin('html');
      case 'css':
        return new BasePlugin('css');
      default:
        // Return a generic plugin that handles text-based actions if supported by Monaco
        return new BasePlugin(language);
    }
  }
}