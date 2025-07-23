import { Identity } from '@semaphore-protocol/identity';

export function createIdentity(seed) {
  return new Identity(seed);
} 