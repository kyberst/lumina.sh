
import { toast } from './toastService';

interface Task {
    id: string;
    description: string;
    fn: () => Promise<any>;
}

/**
 * TaskService: Manages a queue of async operations (e.g., DB saves, Scans).
 * Ensures tasks run sequentially and provides UI feedback (Loading Toasts).
 * Prevents main thread blocking by yielding between tasks.
 */
class TaskService {
    private static instance: TaskService;
    private queue: Task[] = [];
    private isProcessing = false;

    private constructor() {}

    public static getInstance(): TaskService {
        if (!TaskService.instance) {
            TaskService.instance = new TaskService();
        }
        return TaskService.instance;
    }

    /** Add a task to the queue and trigger processing */
    public addTask<T>(description: string, fn: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            const task: Task = {
                id: crypto.randomUUID(),
                description,
                fn: async () => {
                    try {
                        const result = await fn();
                        resolve(result);
                    } catch (e) {
                        reject(e);
                    }
                }
            };
            this.queue.push(task);
            this.processQueue();
        });
    }

    /** Sequential processor */
    private async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;

        this.isProcessing = true;
        const task = this.queue.shift();

        if (task) {
            // Display loading toast
            const toastId = toast.loading(task.description);
            
            try {
                // Yield to allow React to render the toast
                await new Promise(r => setTimeout(r, 50));
                
                // Execute
                await task.fn();
            } catch (e) {
                console.error("Task failed", e);
                toast.error(`Task failed: ${task.description}`);
            } finally {
                toast.dismiss(toastId);
                this.isProcessing = false;
                
                // Yield again before next task
                setTimeout(() => this.processQueue(), 50);
            }
        }
    }
}

export const taskService = TaskService.getInstance();
