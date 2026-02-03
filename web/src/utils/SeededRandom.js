import alea from 'alea';

export class SeededRandom {
    constructor(seed) {
        this.prng = alea(seed);
    }

    /**
     * Returns a random double between 0.0 (inclusive) and 1.0 (exclusive)
     */
    nextDouble() {
        return this.prng();
    }

    /**
     * Returns a random integer between 0 (inclusive) and bound (exclusive)
     */
    nextInt(bound) {
        return Math.floor(this.prng() * bound);
    }
}
