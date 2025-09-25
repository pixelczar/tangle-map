/**
 * Seeded random number generator utility
 * Ensures consistent results for the same seed value
 */

export class SeededRandom {
  constructor(seed = 42) {
    this.seed = seed;
    this.originalSeed = seed;
  }

  setSeed(newSeed) {
    this.seed = newSeed;
    this.originalSeed = newSeed;
  }

  getSeed() {
    return this.originalSeed;
  }

  // Create a new random generator from the current seed
  createGenerator(offset = 0) {
    let seed = this.originalSeed + offset;
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  // Generate noise using a simple implementation
  noise(x, y, scale = 1) {
    const random = this.createGenerator(Math.floor(x * scale) + Math.floor(y * scale) * 1000);
    return random();
  }

  // Generate a random value directly
  random() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  // Generate random integer between min and max (inclusive)
  randomInt(min, max) {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  // Generate random float between min and max
  randomFloat(min, max) {
    return this.random() * (max - min) + min;
  }

  // Generate random angle in radians
  randomAngle() {
    return this.random() * Math.PI * 2;
  }

  // Reset to original seed
  reset() {
    this.seed = this.originalSeed;
  }
}
