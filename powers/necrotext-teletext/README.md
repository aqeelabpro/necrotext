# necrotext-teletext power

Gives Kiro the NecroText MCP server (tools `list_pages`, `render_page`, `check_page`, `data_status`) and two skills: `new-teletext-page` and `teletext-mosaics`.

The server path in `mcp.json` is `scripts/mcp-server.js`, so it assumes the NecroText repository root is the working directory. Node 20 or newer is needed. There are no npm dependencies.

## Import

1. Open the Powers panel in Kiro.
2. Choose Add Custom Power.
3. Import the power from a folder (`powers/necrotext-teletext`) or from GitHub (`https://github.com/aqeelabpro/necrotext`, folder `powers/necrotext-teletext`).
