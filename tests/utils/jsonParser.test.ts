import { describe, it, expect } from '@jest/globals';
import { extractJsonFromResponse, parseJsonFromResponse } from '../../src/utils/jsonParser';

describe('extractJsonFromResponse', () => {
  it('should extract JSON from plain response without fences', () => {
    const input = '{"key": "value"}';
    expect(extractJsonFromResponse(input)).toBe('{"key": "value"}');
  });

  it('should extract JSON from ```json fence', () => {
    const input = '```json\n{"key": "value"}\n```';
    expect(extractJsonFromResponse(input)).toBe('{"key": "value"}');
  });

  it('should extract JSON from ``` fence without json label', () => {
    const input = '```\n{"key": "value"}\n```';
    expect(extractJsonFromResponse(input)).toBe('{"key": "value"}');
  });

  it('should extract JSON with nested objects', () => {
    const input = '```json\n{"nested": {"key": "value"}}\n```';
    expect(extractJsonFromResponse(input)).toBe('{"nested": {"key": "value"}}');
  });

  it('should handle JSON with whitespace variations', () => {
    const input = '```json\n{\n  "key": "value",\n  "array": [1, 2, 3]\n}\n```';
    const result = extractJsonFromResponse(input);
    expect(result).toContain('"key"');
    expect(result).toContain('"value"');
  });

  it('should extract JSON object even without fences', () => {
    const input = 'Some text before {"key": "value"} some text after';
    // With improved extraction, it should find and return just the JSON object
    const result = extractJsonFromResponse(input);
    expect(result).toBe('{"key": "value"}');
  });

  it('should return content as-is when no JSON structure found', () => {
    const input = 'Just plain text with no JSON at all';
    expect(extractJsonFromResponse(input)).toBe(input);
  });

  it('should ignore bash code blocks and prioritize json blocks', () => {
    const input = `Here are the commands:

\`\`\`bash
npm install
npm run dev
\`\`\`

And here is the JSON configuration:
\`\`\`json
{"name": "my-project", "version": "1.0.0"}
\`\`\`
`;
    const result = extractJsonFromResponse(input);
    expect(result).toBe('{"name": "my-project", "version": "1.0.0"}');
  });

  it('should not extract bash block even if it appears first', () => {
    const input = `\`\`\`bash
npm install
\`\`\`

\`\`\`
{"key": "value"}
\`\`\`
`;
    const result = extractJsonFromResponse(input);
    expect(result).toContain('"key"');
    expect(result).not.toContain('npm');
  });

  it('should extract JSON from mixed content with multiple code blocks', () => {
    const input = `Some intro text.

\`\`\`javascript
console.log("hello");
\`\`\`

\`\`\`json
{
  "project": "test",
  "files": ["a.ts", "b.ts"]
}
\`\`\`

More text.
`;
    const result = extractJsonFromResponse(input);
    expect(result).toContain('"project": "test"');
    expect(result).toContain('"files"');
  });
});

describe('parseJsonFromResponse', () => {
  it('should parse valid JSON from plain response', () => {
    const input = '{"success": true, "data": {"id": 1}}';
    const result = parseJsonFromResponse<{success: boolean; data: {id: number}}>(input);
    expect(result.success).toBe(true);
    expect(result.data.id).toBe(1);
  });

  it('should parse JSON from markdown fenced response', () => {
    const input = 'Here is the result:\n\n```json\n{"score": 85, "feedback": "Good"}\n```';
    const result = parseJsonFromResponse<{score: number; feedback: string}>(input);
    expect(result.score).toBe(85);
    expect(result.feedback).toBe("Good");
  });

  it('should throw error for invalid JSON', () => {
    const input = '```json\n{invalid json}\n```';
    expect(() => parseJsonFromResponse<any>(input)).toThrow();
  });
});
