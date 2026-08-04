import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS')!,
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
  // Exposes the Strapi MCP server at /mcp so an AI client can read and edit
  // content. Sessions authenticate with an admin token, and the tools an agent
  // is offered are whatever that token is permitted to do.
  // https://docs.strapi.io/cms/features/strapi-mcp-server
  mcp: {
    enabled: env.bool('MCP_ENABLED', true),
  },
});

export default config;
