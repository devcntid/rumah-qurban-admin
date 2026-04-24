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

export async function flushRedisCache() {
  if (!redis) {
    console.warn("Redis not configured, skipping cache flush");
    return;
  }
  try {
    await redis.flushall();
  } catch (err) {
    console.error("flushRedisCache failed (master/API tetap dilanjutkan):", err);
  }
}

export async function invalidateFaqCache(_productId?: number) {
  await flushRedisCache();
}

export const CATALOG_CACHE_KEY = "catalog:all";
export const CATALOG_BY_BRANCH_KEY = (branchId: number) =>
  `catalog:branch:${branchId}`;
export const CATALOG_BY_PRODUCT_KEY = (productCode: string) =>
  `catalog:product:${productCode}`;
export const CATALOG_CACHE_TTL = 3600;

export async function invalidateCatalogCache(
  _branchId?: number,
  _productCode?: string
) {
  await flushRedisCache();
}

export const PAYMENT_METHODS_CACHE_KEY = "payment_methods:all";

export async function invalidatePaymentMethodsCache() {
  await flushRedisCache();
}
