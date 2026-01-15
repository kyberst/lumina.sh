
import { dbCore } from '../db/dbCore';
import { logger } from '../logger';
import { AppModule } from '../../types';

export interface ProjectAnchors {
    style_anchors: string[];
    architectural_anchors: string[];
    project_summary: string;
}

export class AnchorService {
    private static instance: AnchorService;
    public static getInstance() {
        if (!AnchorService.instance) AnchorService.instance = new AnchorService();
        return AnchorService.instance;
    }

    public async getProjectContext(projectId: string): Promise<ProjectAnchors> {
        try {
            const preferences = await dbCore.query(`SELECT * FROM user_preferences`);
            const anchors = await dbCore.query(
                `SELECT * FROM project_anchors WHERE project_id = $pid`, 
                { pid: projectId }
            );

            const style = [...(preferences.map((p: any) => p.style) || []), ...(anchors.map((a: any) => a.style) || [])];
            const arch = anchors.map((a: any) => a.architecture) || [];
            const summary = anchors[0]?.summary || "No architectural summary defined yet.";

            return {
                style_anchors: style.filter(Boolean),
                architectural_anchors: arch.filter(Boolean),
                project_summary: summary
            };
        } catch (e) {
            logger.warn(AppModule.CORE, "Failed to fetch anchors", e);
            return { style_anchors: [], architectural_anchors: [], project_summary: "" };
        }
    }
}

export const anchorService = AnchorService.getInstance();
