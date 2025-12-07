import { IEditorPlugin } from './interface';
import { CodeAnnotation } from '../../../types';

/**
 * Base Plugin that handles the universal "AI Quick Fix" logic based on Lumina Annotations.
 */
export class BasePlugin implements IEditorPlugin {
  id = 'base';
  protected language: string;

  constructor(language: string) {
    this.language = language;
  }

  onMount(monaco: any, editor: any): void {
    // No specific config for base
  }

  registerProviders(monaco: any, getAnnotations: () => CodeAnnotation[]): { dispose: () => void } {
    const disposable = monaco.languages.registerCodeActionProvider(this.language, {
      provideCodeActions: (model: any, range: any, context: any) => {
        const actions: any[] = [];
        const annotations = getAnnotations();

        // Check all markers/annotations intersecting the range
        for (const marker of context.markers) {
          // Find corresponding annotation based on line and message
          const anno = annotations.find(a => 
            a.line === marker.startLineNumber && 
            (a.message === marker.message || marker.message.includes(a.message))
          );

          // If annotation has a suggestion, create a Quick Fix action
          if (anno && anno.suggestion) {
            actions.push({
              title: `✨ Lumina Fix: ${anno.suggestion.slice(0, 50)}${anno.suggestion.length > 50 ? '...' : ''}`,
              kind: "quickfix",
              isPreferred: true,
              edit: {
                edits: [{
                  resource: model.uri,
                  edit: {
                    range: marker, // Replace the error range
                    text: anno.suggestion
                  }
                }]
              }
            });
          }
        }
        return { actions: actions, dispose: () => {} };
      }
    });

    return disposable;
  }
}