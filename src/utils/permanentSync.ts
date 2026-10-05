import { ProductItem, WebsiteSettings } from '../types';
import { PRODUCTS_CATALOG } from '../data/products';

export const PERMANENT_PRODUCTS_KEY = 'hosted_permanent_products_v1';
export const ADMIN_ADDED_PRODUCTS_KEY = 'hosted_admin_added_products_v2';
export const DELETED_PRODUCT_IDS_KEY = 'hosted_deleted_product_ids_v2';
export const PERMANENT_SETTINGS_KEY = 'hosted_permanent_settings_v1';
export const PERMANENT_FOUNDER_IMAGE_KEY = 'hosted_permanent_founder_image_v2';
export const PERMANENT_STYLE_EDITS_KEY = 'hosted_permanent_style_edits_v1';

const IDB_NAME = 'hosted_permanent_store_db_v1';
const IDB_STORE = 'kv_store';

function openPermanentIDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbSet(key: string, value: any): Promise<void> {
  const db = await openPermanentIDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openPermanentIDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

let memoryAdminProducts: ProductItem[] | null = null;
let memoryConfirmedProducts: ProductItem[] | null = null;
let memoryDeletedIds: string[] | null = null;
let memoryStyleEdits: Record<string, any> | null = null;
let memoryFounderImage: string | null = null;

function safeSetLocalStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    try {
      // Remove legacy duplicate keys if localStorage is near its 5MB limit
      localStorage.removeItem('hosted_live_products_v2');
      localStorage.removeItem('hosted_website_settings_v2');
      if (key !== PERMANENT_PRODUCTS_KEY) {
        localStorage.removeItem(PERMANENT_PRODUCTS_KEY);
      }
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Compresses an uploaded image file to a clean, fast-loading Data URL (~40-80KB)
 * so Founder portraits and new Product images never exceed localStorage or JSON payload limits.
 */
export function compressImageFileToDataUrl(
  file: File,
  maxDimension: number = 760,
  quality: number = 0.76
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read selected image file.'));
    reader.onload = () => {
      const rawDataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!rawDataUrl) {
        reject(new Error('Empty image data.'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width || maxDimension;
          let height = img.height || maxDimension;
          if (width > maxDimension || height > maxDimension) {
            if (width >= height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed || rawDataUrl);
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function getSavedFounderImage(): string {
  if (memoryFounderImage && memoryFounderImage.trim()) return memoryFounderImage;
  try {
    const saved =
      localStorage.getItem(PERMANENT_FOUNDER_IMAGE_KEY) ||
      localStorage.getItem('hosted_founder_image_override_v1');
    if (saved && saved.trim()) {
      memoryFounderImage = saved.trim();
      return memoryFounderImage;
    }
    const rawSettings = localStorage.getItem(PERMANENT_SETTINGS_KEY);
    if (rawSettings) {
      const parsed = JSON.parse(rawSettings);
      if (parsed?.founderImageUrl && String(parsed.founderImageUrl).trim()) {
        memoryFounderImage = String(parsed.founderImageUrl).trim();
        return memoryFounderImage;
      }
    }
  } catch {
    // ignore
  }
  return '';
}

export const getPermanentFounderImage = getSavedFounderImage;

export function saveFounderImagePermanently(imageUrl: string): void {
  const clean = String(imageUrl || '').trim();
  if (!clean) return;
  memoryFounderImage = clean;
  safeSetLocalStorage(PERMANENT_FOUNDER_IMAGE_KEY, clean);
  safeSetLocalStorage('hosted_founder_image_override_v1', clean);
  void idbSet(PERMANENT_FOUNDER_IMAGE_KEY, clean);

  try {
    const rawSettings = localStorage.getItem(PERMANENT_SETTINGS_KEY);
    const parsed = rawSettings ? JSON.parse(rawSettings) : {};
    parsed.founderImageUrl = clean;
    safeSetLocalStorage(PERMANENT_SETTINGS_KEY, JSON.stringify(parsed));
    void idbSet(PERMANENT_SETTINGS_KEY, parsed);
  } catch {
    // ignore
  }
}

export const setPermanentFounderImage = saveFounderImagePermanently;

export function getDeletedProductIds(): string[] {
  if (memoryDeletedIds) return [...memoryDeletedIds];
  try {
    const raw =
      localStorage.getItem(DELETED_PRODUCT_IDS_KEY) ||
      localStorage.getItem('hosted_deleted_product_ids_v1');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      memoryDeletedIds = parsed.map((id) => String(id));
      return [...memoryDeletedIds];
    }
    return [];
  } catch {
    return [];
  }
}

export function recordAdminProductDeletion(productId: string): void {
  const cleanId = String(productId || '').trim();
  if (!cleanId) return;
  const current = new Set(getDeletedProductIds());
  current.add(cleanId);
  const next = Array.from(current);
  memoryDeletedIds = next;
  safeSetLocalStorage(DELETED_PRODUCT_IDS_KEY, JSON.stringify(next));
  void idbSet(DELETED_PRODUCT_IDS_KEY, next);

  const remainingAdmin = getSavedAdminAddedOrEditedProducts().filter((p) => p.id !== cleanId);
  memoryAdminProducts = remainingAdmin;
  safeSetLocalStorage(ADMIN_ADDED_PRODUCTS_KEY, JSON.stringify(remainingAdmin));
  void idbSet(ADMIN_ADDED_PRODUCTS_KEY, remainingAdmin);

  const remainingConfirmed = getConfirmedProductsSnapshot().filter((p) => p.id !== cleanId);
  memoryConfirmedProducts = remainingConfirmed;
  safeSetLocalStorage(PERMANENT_PRODUCTS_KEY, JSON.stringify(remainingConfirmed));
  void idbSet(PERMANENT_PRODUCTS_KEY, remainingConfirmed);
}

export const addDeletedProductId = recordAdminProductDeletion;

export function removeDeletedProductId(productId: string): void {
  const cleanId = String(productId || '').trim();
  if (!cleanId) return;
  const next = getDeletedProductIds().filter((id) => id !== cleanId);
  memoryDeletedIds = next;
  safeSetLocalStorage(DELETED_PRODUCT_IDS_KEY, JSON.stringify(next));
  void idbSet(DELETED_PRODUCT_IDS_KEY, next);
}

function normalizeProductItem(product: any): ProductItem {
  const priceNgn = Math.max(0, Number(product.priceNgn ?? product.price ?? 0));
  return {
    id: String(product.id || `prod-${Date.now().toString().slice(-4)}`),
    name: String(product.name || 'HOS|TED Signature Piece').trim(),
    category: (product.category || 'ankara_gowns') as ProductItem['category'],
    categoryLabel: String(product.categoryLabel || 'Ankara Gowns'),
    description: String(
      product.description ||
        'Beautifully tailored HOS|TED piece crafted for comfort, style, and confidence.'
    ),
    priceNgn,
    priceUsd: Number(product.priceUsd) || Math.max(0, Math.round(priceNgn / 1500)),
    imageUrl: String(product.imageUrl || product.image || ''),
    features:
      Array.isArray(product.features) && product.features.length > 0
        ? product.features
        : ['Custom Sizing Available', 'Premium Fabric', 'Nationwide Delivery'],
    fabric: String(product.fabric || '100% Grade-A Cotton Ankara'),
    isPopular: Boolean(product.isPopular),
    isNew: product.isNew !== undefined ? Boolean(product.isNew) : true,
    leadTime: String(product.leadTime || '5–7 Working Days'),
    stockCount: Number(product.stockCount ?? 5),
    active: product.active !== false,
  };
}

export function getSavedAdminAddedOrEditedProducts(): ProductItem[] {
  if (memoryAdminProducts && memoryAdminProducts.length > 0) {
    return [...memoryAdminProducts];
  }
  try {
    const raw =
      localStorage.getItem(ADMIN_ADDED_PRODUCTS_KEY) ||
      localStorage.getItem('hosted_admin_added_products_v1');
    if (!raw) return memoryAdminProducts || [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      memoryAdminProducts = parsed
        .filter((p) => p && p.id && p.name && p.active !== false)
        .map(normalizeProductItem);
      return [...memoryAdminProducts];
    }
    return [];
  } catch {
    return memoryAdminProducts || [];
  }
}

export const getAdminAddedProducts = getSavedAdminAddedOrEditedProducts;

export function recordAdminProductUpsert(product: ProductItem): void {
  if (!product || !product.id || !product.name) return;
  const normalized = normalizeProductItem(product);
  removeDeletedProductId(normalized.id);

  const existing = getSavedAdminAddedOrEditedProducts();
  const idx = existing.findIndex((p) => p.id === normalized.id);
  if (idx >= 0) {
    existing[idx] = { ...existing[idx], ...normalized };
  } else {
    existing.unshift(normalized);
  }
  memoryAdminProducts = existing;
  safeSetLocalStorage(ADMIN_ADDED_PRODUCTS_KEY, JSON.stringify(existing));
  void idbSet(ADMIN_ADDED_PRODUCTS_KEY, existing);

  const confirmed = getConfirmedProductsSnapshot();
  const cIdx = confirmed.findIndex((p) => p.id === normalized.id);
  if (cIdx >= 0) {
    confirmed[cIdx] = { ...confirmed[cIdx], ...normalized };
  } else {
    confirmed.unshift(normalized);
  }
  memoryConfirmedProducts = confirmed;
  safeSetLocalStorage(PERMANENT_PRODUCTS_KEY, JSON.stringify(confirmed));
  void idbSet(PERMANENT_PRODUCTS_KEY, confirmed);
}

export function getConfirmedProductsSnapshot(): ProductItem[] {
  if (memoryConfirmedProducts && memoryConfirmedProducts.length > 0) {
    return [...memoryConfirmedProducts];
  }
  try {
    const raw =
      localStorage.getItem(PERMANENT_PRODUCTS_KEY) ||
      localStorage.getItem('hosted_live_products_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryConfirmedProducts = parsed.map(normalizeProductItem);
        return [...memoryConfirmedProducts];
      }
    }
  } catch {
    // ignore
  }
  return [...PRODUCTS_CATALOG];
}

export function syncConfirmedProductsList(
  incomingProducts: ProductItem[],
  previousProducts?: ProductItem[]
): void {
  if (!Array.isArray(incomingProducts)) return;
  const deletedIds = new Set(getDeletedProductIds());
  const defaultMap = new Map<string, ProductItem>(PRODUCTS_CATALOG.map((p) => [p.id, p]));

  // Keep all previously recorded admin products so a partial server list never deletes them
  const adminMap = new Map<string, ProductItem>();
  for (const existing of getSavedAdminAddedOrEditedProducts()) {
    if (existing && existing.id && !deletedIds.has(existing.id) && existing.active !== false) {
      adminMap.set(existing.id, normalizeProductItem(existing));
    }
  }

  if (Array.isArray(previousProducts)) {
    for (const prev of previousProducts) {
      if (!prev || !prev.id || deletedIds.has(prev.id) || prev.active === false) continue;
      if (!defaultMap.has(prev.id)) {
        adminMap.set(prev.id, normalizeProductItem(prev));
      }
    }
  }

  for (const rawProd of incomingProducts) {
    if (!rawProd || !rawProd.id || deletedIds.has(rawProd.id) || rawProd.active === false) continue;
    const p = normalizeProductItem(rawProd);
    const defaultMatch = defaultMap.get(p.id);
    const isCustomOrModified =
      !defaultMatch ||
      defaultMatch.name !== p.name ||
      Number(defaultMatch.priceNgn) !== Number(p.priceNgn) ||
      defaultMatch.imageUrl !== p.imageUrl ||
      defaultMatch.description !== p.description ||
      defaultMatch.category !== p.category ||
      defaultMatch.categoryLabel !== p.categoryLabel ||
      defaultMatch.fabric !== p.fabric;

    if (isCustomOrModified) {
      adminMap.set(p.id, p);
    }
  }

  const mergedAdmin = Array.from(adminMap.values());
  memoryAdminProducts = mergedAdmin;
  safeSetLocalStorage(ADMIN_ADDED_PRODUCTS_KEY, JSON.stringify(mergedAdmin));
  void idbSet(ADMIN_ADDED_PRODUCTS_KEY, mergedAdmin);

  // Build final merged product list with custom added products first
  const finalMap = new Map<string, ProductItem>();
  for (const adminItem of mergedAdmin) {
    if (!deletedIds.has(adminItem.id) && adminItem.active !== false) {
      finalMap.set(adminItem.id, adminItem);
    }
  }
  for (const rawProd of incomingProducts) {
    if (!rawProd || !rawProd.id || deletedIds.has(rawProd.id) || rawProd.active === false) continue;
    const normalized = normalizeProductItem(rawProd);
    const override = adminMap.get(normalized.id);
    finalMap.set(normalized.id, override ? { ...normalized, ...override } : normalized);
  }

  const finalList = Array.from(finalMap.values());
  if (finalList.length > 0) {
    memoryConfirmedProducts = finalList;
    safeSetLocalStorage(PERMANENT_PRODUCTS_KEY, JSON.stringify(finalList));
    void idbSet(PERMANENT_PRODUCTS_KEY, finalList);
  }
}

export function getPermanentStyleEdits(): Record<string, any> {
  if (memoryStyleEdits) return { ...memoryStyleEdits };
  try {
    const raw = localStorage.getItem(PERMANENT_STYLE_EDITS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      memoryStyleEdits = parsed;
      return { ...parsed };
    }
    return {};
  } catch {
    return {};
  }
}

export function savePermanentStyleEdits(edits: Record<string, any>): void {
  if (!edits || typeof edits !== 'object') return;
  const merged = { ...getPermanentStyleEdits(), ...edits };
  memoryStyleEdits = merged;
  safeSetLocalStorage(PERMANENT_STYLE_EDITS_KEY, JSON.stringify(merged));
  void idbSet(PERMANENT_STYLE_EDITS_KEY, merged);
}

/**
 * Hydrates in-memory & localStorage state from IndexedDB on boot so even large base64 product images
 * survive page refreshes if localStorage quota was exceeded.
 */
export async function hydratePermanentStateFromIndexedDB(): Promise<void> {
  const [idbAdmin, idbConfirmed, idbDeleted, idbFounder, idbEdits] = await Promise.all([
    idbGet<ProductItem[]>(ADMIN_ADDED_PRODUCTS_KEY),
    idbGet<ProductItem[]>(PERMANENT_PRODUCTS_KEY),
    idbGet<string[]>(DELETED_PRODUCT_IDS_KEY),
    idbGet<string>(PERMANENT_FOUNDER_IMAGE_KEY),
    idbGet<Record<string, any>>(PERMANENT_STYLE_EDITS_KEY),
  ]);

  if (Array.isArray(idbDeleted) && idbDeleted.length > 0) {
    const mergedDeleted = Array.from(new Set([...getDeletedProductIds(), ...idbDeleted]));
    memoryDeletedIds = mergedDeleted;
    safeSetLocalStorage(DELETED_PRODUCT_IDS_KEY, JSON.stringify(mergedDeleted));
  }

  const deletedSet = new Set(getDeletedProductIds());

  if (Array.isArray(idbAdmin) && idbAdmin.length > 0) {
    const map = new Map<string, ProductItem>();
    for (const p of idbAdmin) {
      if (p && p.id && !deletedSet.has(p.id)) map.set(p.id, normalizeProductItem(p));
    }
    for (const p of getSavedAdminAddedOrEditedProducts()) {
      if (p && p.id && !deletedSet.has(p.id)) map.set(p.id, normalizeProductItem(p));
    }
    memoryAdminProducts = Array.from(map.values());
    safeSetLocalStorage(ADMIN_ADDED_PRODUCTS_KEY, JSON.stringify(memoryAdminProducts));
  }

  if (Array.isArray(idbConfirmed) && idbConfirmed.length > 0) {
    const map = new Map<string, ProductItem>();
    for (const p of getSavedAdminAddedOrEditedProducts()) {
      if (p && p.id && !deletedSet.has(p.id)) map.set(p.id, normalizeProductItem(p));
    }
    for (const p of idbConfirmed) {
      if (p && p.id && !deletedSet.has(p.id) && !map.has(p.id)) {
        map.set(p.id, normalizeProductItem(p));
      }
    }
    memoryConfirmedProducts = Array.from(map.values());
  }

  if (idbFounder && !memoryFounderImage) {
    memoryFounderImage = idbFounder;
    safeSetLocalStorage(PERMANENT_FOUNDER_IMAGE_KEY, idbFounder);
  }

  if (idbEdits && typeof idbEdits === 'object') {
    memoryStyleEdits = { ...idbEdits, ...getPermanentStyleEdits() };
  }
}

/**
 * Reconciles incoming server storefront state with locally confirmed admin products,
 * deletions, and founder image, and automatically restores any missing items to the server.
 * Supports both `(serverProducts, serverSettings)` and `({ products, websiteSettings, customStyleEdits })`.
 */
export async function reconcilePermanentStorefrontState(
  serverProductsOrObj:
    | ProductItem[]
    | {
        products?: ProductItem[];
        websiteSettings?: WebsiteSettings;
        customStyleEdits?: Record<string, any>;
      },
  maybeServerSettings?: WebsiteSettings
): Promise<{
  products: ProductItem[];
  websiteSettings: WebsiteSettings | undefined;
  customStyleEdits: Record<string, any>;
  needsServerRestore: boolean;
}> {
  await hydratePermanentStateFromIndexedDB();

  const isArrayArg = Array.isArray(serverProductsOrObj);
  const incomingProducts: ProductItem[] = isArrayArg
    ? serverProductsOrObj
    : Array.isArray(serverProductsOrObj?.products)
    ? serverProductsOrObj.products
    : [];
  const incomingSettings: WebsiteSettings | undefined = isArrayArg
    ? maybeServerSettings
    : serverProductsOrObj?.websiteSettings;
  const incomingStyleEdits: Record<string, any> =
    !isArrayArg && serverProductsOrObj?.customStyleEdits
      ? serverProductsOrObj.customStyleEdits
      : {};

  let needsServerRestore = false;

  const deletedIds = new Set(getDeletedProductIds());
  const localAdminProducts = getSavedAdminAddedOrEditedProducts();
  const localConfirmedProducts = getConfirmedProductsSnapshot();
  const savedFounderImg = getSavedFounderImage();

  const baseServerProducts =
    incomingProducts.length > 0 ? incomingProducts : localConfirmedProducts;

  const filteredServerProducts: ProductItem[] = [];
  for (const raw of baseServerProducts) {
    if (!raw || !raw.id) continue;
    if (deletedIds.has(raw.id) || raw.active === false) {
      if (incomingProducts.some((sp) => sp && sp.id === raw.id)) {
        needsServerRestore = true;
      }
      continue;
    }
    filteredServerProducts.push(normalizeProductItem(raw));
  }

  const serverMap = new Map<string, ProductItem>();
  for (const p of filteredServerProducts) {
    serverMap.set(p.id, p);
  }

  const prependedAdminProducts: ProductItem[] = [];
  for (const adminProd of localAdminProducts) {
    if (!adminProd || !adminProd.id || deletedIds.has(adminProd.id) || adminProd.active === false) {
      continue;
    }
    const onServer = serverMap.get(adminProd.id);
    if (!onServer) {
      prependedAdminProducts.push(adminProd);
      needsServerRestore = true;
    } else if (
      onServer.name !== adminProd.name ||
      Number(onServer.priceNgn) !== Number(adminProd.priceNgn) ||
      onServer.imageUrl !== adminProd.imageUrl ||
      onServer.description !== adminProd.description ||
      onServer.category !== adminProd.category ||
      onServer.categoryLabel !== adminProd.categoryLabel
    ) {
      serverMap.set(adminProd.id, { ...onServer, ...adminProd });
      needsServerRestore = true;
    }
  }

  const finalProducts = [...prependedAdminProducts, ...Array.from(serverMap.values())];
  syncConfirmedProductsList(finalProducts);

  let finalSettings = incomingSettings ? { ...incomingSettings } : undefined;
  if (savedFounderImg) {
    if (finalSettings && finalSettings.founderImageUrl !== savedFounderImg) {
      finalSettings.founderImageUrl = savedFounderImg;
      needsServerRestore = true;
    }
  } else if (finalSettings?.founderImageUrl) {
    saveFounderImagePermanently(finalSettings.founderImageUrl);
  }

  if (finalSettings) {
    safeSetLocalStorage(PERMANENT_SETTINGS_KEY, JSON.stringify(finalSettings));
    void idbSet(PERMANENT_SETTINGS_KEY, finalSettings);
  }

  const finalStyleEdits = {
    ...incomingStyleEdits,
    ...getPermanentStyleEdits(),
  };
  savePermanentStyleEdits(finalStyleEdits);

  if (needsServerRestore) {
    try {
      await fetch('/api/public/restore-permanent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          founderImageUrl: savedFounderImg || finalSettings?.founderImageUrl || undefined,
          adminProducts: getSavedAdminAddedOrEditedProducts(),
          deletedProductIds: Array.from(deletedIds),
        }),
      });
    } catch {
      // Ignore transient network errors; local state is already reconciled
    }
  }

  return {
    products: finalProducts,
    websiteSettings: finalSettings,
    customStyleEdits: finalStyleEdits,
    needsServerRestore,
  };
}
