import type { Core } from '@strapi/strapi';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SEED_FILE = path.join(DATA_DIR, 'seed.json');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

const MIME: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

/**
 * Uploads a file from data/uploads and returns its media id. The same file is
 * referenced by several entries, so uploads are deduplicated.
 */
async function uploadOnce(strapi: Core.Strapi, cache: Map<string, number>, fileName?: string) {
  if (!fileName) return null;
  if (cache.has(fileName)) return cache.get(fileName)!;

  const filePath = path.join(UPLOAD_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    strapi.log.warn(`[seed] missing media file: ${fileName}`);
    return null;
  }

  const existing = await strapi.query('plugin::upload.file').findOne({ where: { name: fileName } });
  if (existing) {
    cache.set(fileName, existing.id);
    return existing.id;
  }

  const [uploaded] = await strapi.plugin('upload').service('upload').upload({
    data: {},
    files: {
      filepath: filePath,
      originalFilename: fileName,
      mimetype: MIME[path.extname(fileName).toLowerCase()] ?? 'application/octet-stream',
      size: fs.statSync(filePath).size,
    },
  });

  cache.set(fileName, uploaded.id);
  return uploaded.id;
}

/** Populates the two collections on first boot so the CMS is never empty. */
async function seed(strapi: Core.Strapi) {
  if (!fs.existsSync(SEED_FILE)) return;

  if ((await strapi.documents('api::feature.feature').count({})) > 0) return;

  const data = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  const media = new Map<string, number>();

  for (const feature of data.features ?? []) {
    await strapi.documents('api::feature.feature').create({
      status: 'published',
      data: { ...feature, icon: await uploadOnce(strapi, media, feature.icon) },
    });
  }

  for (const portfolio of data.portfolios ?? []) {
    await strapi.documents('api::portfolio.portfolio').create({
      status: 'published',
      data: {
        ...portfolio,
        thumbnail: await uploadOnce(strapi, media, portfolio.thumbnail),
        detailsImage1: await uploadOnce(strapi, media, portfolio.detailsImage1),
        detailsImage2: await uploadOnce(strapi, media, portfolio.detailsImage2),
        detailsImage3: await uploadOnce(strapi, media, portfolio.detailsImage3),
      },
    });
  }

  strapi.log.info(
    `[seed] created ${data.features?.length ?? 0} features and ${data.portfolios?.length ?? 0} portfolios`,
  );
}

/**
 * Lets the Astro build read both collections without an API token. Remove these
 * in the admin (Settings > Users & Permissions > Roles > Public) to lock the
 * API down and use a token instead.
 */
async function grantPublicRead(strapi: Core.Strapi) {
  const role = await strapi.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
  if (!role) return;

  const actions = [
    'api::feature.feature.find',
    'api::feature.feature.findOne',
    'api::portfolio.portfolio.find',
    'api::portfolio.portfolio.findOne',
  ];

  for (const action of actions) {
    const found = await strapi
      .query('plugin::users-permissions.permission')
      .findOne({ where: { action, role: role.id } });
    if (!found) {
      await strapi.query('plugin::users-permissions.permission').create({ data: { action, role: role.id } });
    }
  }
}

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPublicRead(strapi);
    await seed(strapi);
  },
};
