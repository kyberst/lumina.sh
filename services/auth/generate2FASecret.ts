
export const generate2FASecret = async (): Promise<string> => {
    return Array.from(crypto.getRandomValues(new Uint8Array(20)))
        .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase().substring(0, 16);
};
