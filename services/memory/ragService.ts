
import { GeneratedFile, JournalEntry } from '../../types';
import { graphService } from './graphService';
import { RAGContext } from './types';

export class RAGService {
    private static instance: RAGService;
    public static getInstance() {
        if (!RAGService.instance) RAGService.instance = new RAGService();
        return RAGService.instance;
    }

    public async retrieveContext(projectId: string, prompt: string, targetFile?: string): Promise<RAGContext> {
        try {
            const snippets: string[] = [];
            const patterns: string[] = [];

            if (targetFile) {
                const topoMap = await graphService.getHierarchicalMap(projectId, targetFile);
                
                // Inyectar Nivel 1 (Directo)
                topoMap.direct.forEach((f: any) => {
                    snippets.push(`[CONTEXT: DIRECT DEPENDENCY - ${f.name}]\n${f.content}`);
                });

                // Inyectar Nivel 2 (Esqueleto) - < 10% de tokens estimado
                topoMap.transitive.forEach((f: any) => {
                    snippets.push(`[CONTEXT: TRANSITIVE SKELETON - ${f.name}]\n${f.skeleton}`);
                });
            }

            return { snippets, patterns };
        } catch (e) { 
            return { snippets: [], patterns: [] }; 
        }
    }

    public async indexProject(entry: JournalEntry): Promise<void> {
        if (!entry.projects_id || entry.pendingGeneration) return;
        // La indexación ahora es atómica y topológica
        await graphService.analyzeProjectTopology(entry.projects_id, entry.files);
    }
}
export const ragService = RAGService.getInstance();
