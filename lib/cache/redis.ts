import { Redis } from "@upstash/redis";

const hasRedisConfig =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

export const redis = hasRedisConfig
  ? new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    })
  : null;

export const FAQ_CACHE_KEY = "faqs:all";
export const FAQ_BY_PRODUCT_KEY = (productId: number) =>
  `faqs:product:${productId}`;
export const FAQ_CACHE_TTL = 3600;

export async function invalidateFaqCache(productId?: number) {
  if (!redis) {
    console.warn("Redis not configured, skipping cache invalidation");
    return;
  }

  const keys = [FAQ_CACHE_KEY];
  if (productId) {
    keys.push(FAQ_BY_PRODUCT_KEY(productId));
  }
  await redis.del(...keys);
}

export const CATALOG_CACHE_KEY = "catalog:all";
export const CATALOG_BY_BRANCH_KEY = (branchId: number) =>
  `catalog:branch:${branchId}`;
export const CATALOG_BY_PRODUCT_KEY = (productCode: string) =>
  `catalog:product:${productCode}`;
export const CATALOG_CACHE_TTL = 3600;

export async function invalidateCatalogCache(
  branchId?: number,
  productCode?: string
) {
  if (!redis) {
    console.warn("Redis not configured, skipping cache invalidation");
    return;
  }

  const keys = [CATALOG_CACHE_KEY];
  if (branchId) {
    keys.push(CATALOG_BY_BRANCH_KEY(branchId));
  }
  if (productCode) {
    keys.push(CATALOG_BY_PRODUCT_KEY(productCode));
  }
  
  console.log("Invalidating catalog cache keys:", keys);
  await redis.del(...keys);
}

export const PAYMENT_METHODS_CACHE_KEY = "payment_methods:all";

export async function invalidatePaymentMethodsCache() {
  if (!redis) {
    console.warn("Redis not configured, skipping cache invalidation");
    return;
  }

  await redis.del(PAYMENT_METHODS_CACHE_KEY);
}
