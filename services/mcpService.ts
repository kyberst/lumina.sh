
import { MCPServer, AppError, AppModule } from '../types';
import { logger } from './logger';

export const testMCPServer = async (server: MCPServer): Promise<boolean> => {
    if (server.type === 'stdio') {
        // Browser cannot verify STDIO directly without a bridge
        // We throw a specific warning that the UI can catch and display as Info
        throw new AppError("STDIO servers cannot be tested in the browser. They require a native bridge or the Desktop app.", "MCP_STDIO_WARN", AppModule.INTEGRATION);
    }

    if (server.type === 'websocket') {
        return new Promise((resolve, reject) => {
            try {
                const socket = new WebSocket(server.command);
                const timer = setTimeout(() => {
                    socket.close();
                    reject(new Error("Connection timed out (5s)"));
                }, 5000);

                socket.onopen = () => {
                    clearTimeout(timer);
                    socket.close();
                    resolve(true);
                };

                socket.onerror = (err) => {
                    clearTimeout(timer);
                    reject(new Error("Failed to connect to WebSocket"));
                };
            } catch (e: any) {
                reject(new Error(`Invalid URL: ${e.message}`));
            }
        });
    }

    return false;
};
