/**
 * Utility to extract and parse JSON from LLM responses that may contain markdown code fences
 */

/**
 * Extract JSON string from LLM response content.
 * Handles markdown code fences (```json ... ``` or ``` ... ```).
 * Also tries to find the largest JSON object in the response.
 */
export function extractJsonFromResponse(content: string): string {
  // DEBUG: Log for now to understand failures
  const DEBUG = false; // Set true when needed
  function log(...args: any[]) {
    if (DEBUG) console.log('[jsonParser]', ...args);
  }

  log('Input (first 200 chars):', content.substring(0, 200));

  // PRIORITY 1: Look for explicit ```json code blocks first (most reliable)
  const jsonFenceMatch = content.match(/```json\s*\n?([\s\S]*?)```/);
  if (jsonFenceMatch) {
    const candidate = jsonFenceMatch[1].trim();
    log('jsonFenceMatch candidate:', candidate.substring(0, 100));
    if (candidate.startsWith('{') || candidate.startsWith('[')) {
      log('Returning from jsonFenceMatch');
      return candidate;
    }
  }

  // PRIORITY 2: Look for any ```...``` code block that looks like JSON
  // Only accept if the content starts with { or [ (JSON structure)
  const anyFenceMatch = content.match(/```(?:\w+)?\s*\n?([\s\S]*?)```/);
  if (anyFenceMatch) {
    const candidate = anyFenceMatch[1].trim();
    log('anyFenceMatch candidate:', candidate.substring(0, 100));
    if (candidate.startsWith('{') || candidate.startsWith('[')) {
      log('Returning from anyFenceMatch');
      return candidate;
    }
  }

  // PRIORITY 3: Find standalone JSON object outside of code fences
  // Use a more precise pattern that matches balanced braces (non-greedy)
  const objectMatch = content.match(/(\{[^{]*?(?:\{[^{]*?}[^{]*?)*\})/);
  if (objectMatch) {
    const candidate = objectMatch[1].trim();
    log('objectMatch candidate:', candidate.substring(0, 100));
    if (candidate.startsWith('{') && candidate.endsWith('}')) {
      log('Returning from objectMatch');
      return candidate;
    }
  }

  // PRIORITY 4: Find JSON array
  const arrayMatch = content.match(/(\[[^[]*(?:\[[^[]*][^[]*)*\])/);
  if (arrayMatch) {
    const candidate = arrayMatch[1].trim();
    log('arrayMatch candidate:', candidate.substring(0, 100));
    if (candidate.startsWith('[') && candidate.endsWith(']')) {
      log('Returning from arrayMatch');
      return candidate;
    }
  }

  // FALLBACK
  log('No match found, returning trimmed content');
  return content.trim();
}

/**
 * Safely parse JSON from LLM response with detailed error logging.
 * Automatically strips markdown code fences before parsing.
 */
export function parseJsonFromResponse<T>(content: string): T {
  const cleanedContent = extractJsonFromResponse(content);
  try {
    return JSON.parse(cleanedContent) as T;
  } catch (error) {
    console.error('[jsonParser] Failed to parse JSON from response:', {
      originalLength: content.length,
      cleanedLength: cleanedContent.length,
      cleanedPreview: cleanedContent.substring(0, 500),
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
