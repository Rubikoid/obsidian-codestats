// original license: MIT
// Authored by Juha Ristolainen
// src: https://gitlab.com/juha.ristolainen/code-stats-vscode/-/blob/master/src/pulse.ts

export class Pulse {
    xps: Map<string, number>;

    constructor() {
        this.xps = new Map<string, number>();
    }

    public getXP(language: string): number {
        let xp: number | null | undefined = this.xps.get(language);

        if (xp === null || xp === undefined) {
            return 0;
        } else {
            return xp;
        }
    }

    public addXP(language: string, amount: number): void {
        let xp: number = this.getXP(language);

        xp += amount;

        this.xps.set(language, xp);
    }

    public get getXPs(): Map<string, number> {
        return this.xps;
    }

    public getTotalXP(): number {
        let res: IteratorResult<number, any>;
        const xps = this.getXPs.values();
        let total = 0;
        do {
            res = xps.next();
            if (res.value) total += res.value;
        } while (!res.done)
        return total;
    }

    public reset(): void {
        this.xps = new Map<string, number>();
    }
}
