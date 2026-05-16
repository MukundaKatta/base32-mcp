# base32-mcp

[![npm](https://img.shields.io/npm/v/@mukundakatta/base32-mcp.svg)](https://www.npmjs.com/package/@mukundakatta/base32-mcp)
[![mcp](https://img.shields.io/badge/protocol-MCP-blue.svg)](https://modelcontextprotocol.io)

MCP server: encode and decode base32. Two variants:

- **rfc4648** — A-Z + 2-7, `=`-padded to a multiple of 8 chars (default).
- **crockford** — 0-9, A-Z minus I/L/O/U. No padding. Decode is forgiving
  (I/L map to 1, O maps to 0).

No external deps.

## Tool

### `transform`

```json
{ "text": "foobar", "op": "encode" }
```

→ `{ "result": "MZXW6YTBOI======" }`

## Configure

```json
{ "mcpServers": { "base32": { "command": "npx", "args": ["-y", "@mukundakatta/base32-mcp"] } } }
```

## License

MIT.

## Repository Health

This repository includes a dependency-free health check for core documentation, metadata, and CI wiring. Run it locally before publishing changes:

```sh
python3 scripts/check_repository_health.py
```

The same check runs in GitHub Actions on pushes and pull requests.
