# Gridora CMS (Strapi 5)

The content backend for the [Gridora Astro theme](..). It manages the two
collections the theme renders dynamically:

| Collection | API | Drives |
| --- | --- | --- |
| **Feature** | `/api/features` | the features grid and `/features/[slug]` |
| **Portfolio** | `/api/portfolios` | the case-study grid and `/portfolio/[slug]` |

SQLite by default, so there is nothing to install besides the dependencies.

## Getting started

```sh
npm install
npm run develop      # http://localhost:1337/admin
```

The first boot does three things automatically:

1. creates the **Feature** and **Portfolio** collection types,
2. seeds them from `data/seed.json`, uploading the images in `data/uploads/`,
3. grants the **Public** role read access to both collections.

Create your admin account when the browser opens. Seeding only runs while the
Feature collection is empty, so restarts never duplicate content.

To reset everything, delete `.tmp/data.db` and `public/uploads/`, then run
`npm run develop` again.

## Connecting the theme

In the theme's `.env` at the repo root:

```sh
STRAPI_URL=http://localhost:1337
```

Then build the theme. `src/lib/content.ts` fetches both collections at build
time and falls back to its bundled JSON snapshot if Strapi is not running, so
the theme never fails to build because the CMS is down.

`STRAPI_TOKEN` is only needed if you remove the public read permissions above —
create a read-only token under **Settings → API Tokens**.

## Strapi MCP server

The MCP server is enabled in `config/server.ts` and served at
`http://localhost:1337/mcp`. It lets an AI client list, read, create, update,
publish and delete entries in both collections.

1. In the admin, create a token under **Settings → Admin tokens**. The tools an
   agent is offered are whatever that token is permitted to do.
2. Register the server with your client:

   ```sh
   claude mcp add strapi-mcp --transport http http://localhost:1337/mcp \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

   Cursor (`.cursor/mcp.json`):

   ```json
   {
     "mcpServers": {
       "strapi-mcp": {
         "type": "streamable-http",
         "url": "http://localhost:1337/mcp",
         "headers": { "Authorization": "Bearer YOUR_ADMIN_TOKEN" }
       }
     }
   }
   ```

   Claude Desktop (`claude_desktop_config.json`):

   ```json
   {
     "mcpServers": {
       "strapi-mcp": {
         "command": "npx",
         "args": [
           "-y", "mcp-remote", "http://localhost:1337/mcp",
           "--header", "Authorization: Bearer YOUR_ADMIN_TOKEN"
         ]
       }
     }
   }
   ```

Set `MCP_ENABLED=false` in `.env` to turn it off.

Docs: <https://docs.strapi.io/cms/features/strapi-mcp-server>

## Content model

**Feature** — `title`, `slug` (uid), `summary`, `icon` (media), `detailsTitle`,
`detailsSummary`, `detailsText` (rich text, HTML), `processingSpeed`,
`averageResponseTime`, `concurrentUsers`, `accuracyRate`.

**Portfolio** — `title`, `slug` (uid), `summary`, `thumbnail` (media),
`solutions`, `tool`, `location`, `client`, `detailsImage1`–`detailsImage3`
(media), `detailsText` (rich text, HTML), `keyPoints` (JSON array of strings),
`challenge`, `solution`.

`detailsText` is rendered as raw HTML by the theme.
