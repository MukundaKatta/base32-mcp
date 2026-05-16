#!/usr/bin/env node
/**
 * base32 MCP server. One tool: `transform`.
 *
 * Encode/decode in either RFC 4648 base32 (A-Z2-7) or Crockford base32
 * (0-9, A-Z minus I/L/O/U). No deps.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const VERSION = '0.1.0';

const RFC4648 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export type Variant = 'rfc4648' | 'crockford';
export type Op = 'encode' | 'decode';

function alphabet(variant: Variant): string {
  return variant === 'crockford' ? CROCKFORD : RFC4648;
}

export function encode(text: string, variant: Variant = 'rfc4648'): string {
  const alpha = alphabet(variant);
  const bytes = new TextEncoder().encode(text);
  let bits = 0;
  let value = 0;
  let out = '';
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += alpha[(value >> bits) & 31];
    }
  }
  if (bits > 0) {
    out += alpha[(value << (5 - bits)) & 31];
  }
  // RFC 4648 pads to multiple of 8 with `=`.
  if (variant === 'rfc4648') {
    while (out.length % 8 !== 0) out += '=';
  }
  return out;
}

export function decode(input: string, variant: Variant = 'rfc4648'): string {
  const alpha = alphabet(variant);
  const trimmed = input.replace(/=+$/, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const c of trimmed) {
    const i = alpha.indexOf(c);
    if (i < 0) {
      // Allow ambiguous chars in Crockford (I→1, L→1, O→0).
      if (variant === 'crockford') {
        const mapped = c === 'I' || c === 'L' ? '1' : c === 'O' ? '0' : '';
        const j = alpha.indexOf(mapped);
        if (j < 0) throw new Error('invalid character: ' + c);
        value = (value << 5) | j;
      } else {
        throw new Error('invalid character: ' + c);
      }
    } else {
      value = (value << 5) | i;
    }
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((value >> bits) & 0xff);
    }
  }
  return new TextDecoder().decode(new Uint8Array(out));
}

const server = new Server({ name: 'base32', version: VERSION }, { capabilities: { tools: {} } });

const TOOLS = [
  {
    name: 'transform',
    description:
      'Encode or decode base32. variant: rfc4648 (default, A-Z2-7 with `=` padding) or crockford (0-9A-Z minus I/L/O/U).',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        op: { type: 'string', enum: ['encode', 'decode'] },
        variant: { type: 'string', enum: ['rfc4648', 'crockford'], default: 'rfc4648' },
      },
      required: ['text', 'op'],
    },
  },
] as const;

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    if (name !== 'transform') return errorResult('unknown tool: ' + name);
    const a = args as unknown as { text: string; op: Op; variant?: Variant };
    const v = a.variant ?? 'rfc4648';
    const out = a.op === 'encode' ? encode(a.text, v) : decode(a.text, v);
    return jsonResult({ result: out });
  } catch (err) {
    return errorResult('base32 failed: ' + (err as Error).message);
  }
});

function jsonResult(value: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}
function errorResult(message: string) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`base32 MCP server v${VERSION} ready on stdio\n`);
}
