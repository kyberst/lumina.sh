import { CodeAnnotation } from '../../../types';

export interface IEditorPlugin {
  id: string;
  
  /**
   * Called when the editor model is mounted or language changes.
   * Use this to configure compiler options, formatting, or internal workers.
   */
  onMount(monaco: any, editor: any): void;
  
  /**
   * Registers providers (Code Actions, Hover, etc.) for the specific language.
   * Returns a disposable to clean up resources.
   */
  registerProviders(monaco: any, getAnnotations: () => CodeAnnotation[]): { dispose: () => void };

  /**
   * Optional: Run client-side validation logic.
   */
  validate?(code: string): Promise<CodeAnnotation[]>;
}