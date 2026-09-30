"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { getDownloadURL, ref, uploadBytes, deleteObject } from 'firebase/storage';
import { 
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  query,
  updateDoc,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  and,
  where,
} from 'firebase/firestore';
import { database } from '@/config/firebase';
import { storage } from '@/config/firebase';
import { MediathekItem } from '@/types/utils/MediathekType';
import { useCompanyData } from '@/provider/CompanyDataProvider';
import { optimizeMediaFile } from '@/utils/optimizeMediaImage';

const COL = 'mediathek';
const DEFAULT_PAGE_SIZE = 30;
const CACHE_TTL_MS = 60_000; // 60s

interface MediaCache {
  ownerId: string;
  items: MediathekItem[];
  ts: number;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  exhausted: boolean;
}

let _mediaCache: MediaCache | null = null; // module-level cache

export interface UseMediathekOptions { autoLoad?: boolean; pageSize?: number; }

interface UseMediathekReturn {
  items: MediathekItem[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
  hasMore: boolean;
  refresh: (force?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  upload: (file: File, alt?: string) => Promise<MediathekItem | null>;
  updateAlt: (id: string, alt: string) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
}

export function useMediathek(opts: UseMediathekOptions = {}): UseMediathekReturn {
  const { autoLoad = true, pageSize = DEFAULT_PAGE_SIZE } = opts;
  const [items, setItems] = useState<MediathekItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const {companyData} = useCompanyData()
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  const mapDoc = (d: QueryDocumentSnapshot<DocumentData>): MediathekItem => {
    const raw = d.data() as Record<string, unknown>;
    const tsUnknown: unknown = raw.createdAt;
    const createdAt = tsUnknown && typeof tsUnknown === 'object' &&
      typeof (tsUnknown as { toMillis?: () => number }).toMillis === 'function'
      ? (tsUnknown as { toMillis: () => number }).toMillis()
      : (typeof tsUnknown === 'number' ? tsUnknown : Date.now());
    return {
      ownerId: raw.ownerId as string,
      id: d.id,
      url: raw.url as string,
      thumbUrl: (raw.thumbUrl as string) || (raw.url as string),
      name: raw.name as string,
      alt: raw.alt as string | undefined,
      contentType: raw.contentType as string | undefined,
      size: raw.size as number | undefined,
      width: raw.width as number | undefined,
      height: raw.height as number | undefined,
      createdAt,
      storagePath: raw.storagePath as string,
      tags: Array.isArray(raw.tags) ? raw.tags as string[] : undefined,
    };
  };

  const refresh = useCallback(async (force = false) => {
    setError(null);
    const ownerId = companyData?.id;
    if (!ownerId) {
      setItems([]);
      setHasMore(false);
      return;
    }
    const now = Date.now();
    if (!force && _mediaCache?.ownerId === ownerId && (now - _mediaCache.ts) < CACHE_TTL_MS) {
      setItems(_mediaCache.items);
      lastDocRef.current = _mediaCache.lastDoc;
      setHasMore(!_mediaCache.exhausted);
      return;
    }
    setLoading(true);
    try {
      const colRef = collection(database, COL);
      const qCol = query(colRef, and(where("ownerId", "==", ownerId)),orderBy('createdAt', 'desc'), limit(pageSize));
      const snap = await getDocs(qCol);
      const data: MediathekItem[] = snap.docs.map(mapDoc);
      const last = snap.docs[snap.docs.length - 1] || null;
      lastDocRef.current = last;
      const exhausted = snap.docs.length < pageSize;
      setItems(data);
      setHasMore(!exhausted);
      _mediaCache = { ownerId, items: data, ts: Date.now(), lastDoc: last, exhausted };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Fehler beim Laden';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [pageSize, companyData]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const ownerId = companyData?.id;
    if (!ownerId) return;
    if (!lastDocRef.current) return; // nothing to paginate from
    setLoading(true);
    setError(null);
    try {
      const colRef = collection(database, COL);
      const qCol = query(colRef, and(where("ownerId", "==", ownerId)), orderBy('createdAt', 'desc'), startAfter(lastDocRef.current), limit(pageSize));
      const snap = await getDocs(qCol);
      if (!snap.size) {
        setHasMore(false);
        if (_mediaCache) _mediaCache.exhausted = true;
        return;
      }
      const newItems = snap.docs.map(mapDoc);
      const last = snap.docs[snap.docs.length - 1] || null;
      lastDocRef.current = last;
      setItems(prev => {
        const merged = [...prev, ...newItems];
        _mediaCache = { ownerId, items: merged, ts: Date.now(), lastDoc: last, exhausted: newItems.length < pageSize };
        return merged;
      });
      if (snap.docs.length < pageSize) {
        setHasMore(false);
        if (_mediaCache) _mediaCache.exhausted = true;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Fehler beim Nachladen';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [companyData, hasMore, loading, pageSize]);

  const upload = useCallback(async (file: File, alt?: string) => {
    setUploading(true);
    setError(null);
    try {
      if (!companyData?.id) {
        throw new Error('Für den Upload ist eine Unternehmens-ID erforderlich.');
      }
      const optimized = await optimizeMediaFile(file);
      const uploadFile = optimized.file;
      const storagePath = `mediathek/${Date.now()}-${uploadFile.name}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, uploadFile, { contentType: uploadFile.type });
      const url = await getDownloadURL(storageRef);
      const meta: Omit<MediathekItem, 'id'> = {
        ownerId: companyData.id,
        url,
        thumbUrl: url,
        name: uploadFile.name,
        alt,
        contentType: uploadFile.type,
        size: uploadFile.size,
        width: optimized.width,
        height: optimized.height,
        createdAt: Date.now(),
        storagePath,
      };
      // Sanitize meta (Firestore disallows explicit undefined values)
      const toStore: Record<string, unknown> = { ...meta, createdAt: serverTimestamp() };
      Object.keys(toStore).forEach(k => { if (toStore[k] === undefined) delete toStore[k]; });
      const docRef = await addDoc(collection(database, COL), toStore);
      const newItem: MediathekItem = { id: docRef.id, ...meta };
      setItems(prev => [newItem, ...prev]);
      // update cache
      const cachedItems = _mediaCache?.ownerId === companyData.id ? _mediaCache.items : [];
      _mediaCache = { ownerId: companyData.id, items: [newItem, ...cachedItems], ts: Date.now(), lastDoc: _mediaCache?.ownerId === companyData.id ? _mediaCache.lastDoc : null, exhausted: _mediaCache?.ownerId === companyData.id ? _mediaCache.exhausted : true };
      return newItem;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Fehler beim Upload';
      setError(msg);
      return null;
    } finally {
      setUploading(false);
    }
  }, [companyData]);

  const updateAlt = useCallback(async (id: string, alt: string) => {
    try {
      await updateDoc(doc(database, COL, id), { alt });
      setItems(prev => prev.map(it => it.id === id ? { ...it, alt } : it));
      if (_mediaCache) {
        _mediaCache.items = _mediaCache.items.map(it => it.id === id ? { ...it, alt } : it);
        _mediaCache.ts = Date.now();
      }
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Fehler beim Speichern';
      setError(msg);
      return false;
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      const item = items.find(i => i.id === id);
      if (!item) return false;
      if (item.storagePath) {
        try { await deleteObject(ref(storage, item.storagePath)); } catch {/* ignore storage delete issues */}
      }
      await deleteDoc(doc(database, COL, id));
      setItems(prev => prev.filter(i => i.id !== id));
      if (_mediaCache) {
        _mediaCache.items = _mediaCache.items.filter(i => i.id !== id);
        _mediaCache.ts = Date.now();
      }
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Fehler beim Löschen';
      setError(msg);
      return false;
    }
  }, [items]);

  useEffect(() => { if (autoLoad) refresh(); }, [autoLoad, refresh]);

  return { items, loading, uploading, error, hasMore, refresh, loadMore, upload, updateAlt, remove };
}
