export type LocalStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export function browserStorage(): LocalStore | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
