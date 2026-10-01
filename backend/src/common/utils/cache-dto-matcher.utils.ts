/**
 * Match Cache and DTO Fields
 * @param obj - Cache
 * @param requiredFields 
 * @returns True if Cache Fields match with DTO's
 */
export function cacheDtoMatcher<T>(
    obj: any,
    requiredFields: (keyof T)[]
  ): obj is T {
    if (typeof obj !== 'object' || obj === null) return false;
    for (const field of requiredFields) {
      if (!(field in obj)) {
        return false;
      }
    }
    return true;
  }