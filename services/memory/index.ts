import { AppSettings, ChatMessage, GeneratedFile } from "../../types";
import { getEmbedding } from "./embedding";
import { syncCodebase, saveInteraction } from "./storage";
import { retrieveContext } from "./retrieval";

export class MemoryOrchestrator {
    constructor(private settings: AppSettings) {}

    public async syncCodebase(files: GeneratedFile[]) {
        if (!this.settings.memory.enabled) return;
        await syncCodebase(files, getEmbedding);
    }

    public async retrieveContext(query: string): Promise<string> {
        if (!this.settings.memory.enabled) return "";
        return await retrieveContext(query, getEmbedding, this.settings);
    }

    public async saveInteraction(entry: ChatMessage, responseText: string, modifiedFiles: string[]) {
        if (!this.settings.memory.enabled) return;
        await saveInteraction(entry, responseText, modifiedFiles, getEmbedding);
    }
}
