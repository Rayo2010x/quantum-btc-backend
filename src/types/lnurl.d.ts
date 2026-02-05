declare module 'lnurl' {
    export function encode(url: string): string;
    export function decode(url: string): string;
    export function verify(url: string): boolean;
}
