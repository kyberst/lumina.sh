
/**
 * Estimates cost for Gemini models based on public pricing (approximate).
 * Pricing is per 1 million tokens.
 */
export const estimateCost = (inputTokens: number, outputTokens: number, modelId: string): number => {
    // Pricing in USD per 1M tokens (Snapshots as of late 2024/Early 2025)
    let rates = { input: 0.075, output: 0.30 }; // Default (Flash)

    if (modelId.includes('pro')) {
        rates = { input: 3.50, output: 10.50 }; // Gemini Pro pricing tier
    } else if (modelId.includes('flash')) {
        rates = { input: 0.075, output: 0.30 }; // Gemini Flash pricing tier
    }

    const inputCost = (inputTokens / 1_000_000) * rates.input;
    const outputCost = (outputTokens / 1_000_000) * rates.output;

    return inputCost + outputCost;
};

export const formatCost = (cost: number): string => {
    if (cost < 0.0001) return '<$0.0001';
    return `$${cost.toFixed(5)}`;
};

/**
 * Heuristic to estimate token count from text length (Client-side approximation).
 * ~4 characters per token is a standard rule of thumb.
 */
export const estimateTokens = (text: string): number => {
    return Math.ceil(text.length / 4);
};
