// Cache-System für bessere Performance
// Aktualisiert alle 24 Stunden automatisch

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  refreshInterval?: number; // Auto-refresh interval in milliseconds
}

class CacheManager {
  private cache = new Map<string, CacheEntry<unknown>>();
  private refreshTimers = new Map<string, NodeJS.Timeout>();

  // Standard TTL: 24 Stunden
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 Stunden
  private readonly DEFAULT_REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24 Stunden

  /**
   * Wert aus Cache abrufen
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Prüfe ob Cache abgelaufen ist
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Wert in Cache speichern
   */
  set<T>(
    key: string, 
    data: T, 
    options: CacheOptions = {}
  ): void {
    const ttl = options.ttl || this.DEFAULT_TTL;
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    };

    this.cache.set(key, entry);

    // Lösche alten Refresh-Timer falls vorhanden
    const existingTimer = this.refreshTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    console.log(`Cache gesetzt für Key: ${key}, läuft ab: ${new Date(entry.expiresAt).toISOString()}`);
  }

  /**
   * Wert aus Cache löschen
   */
  delete(key: string): void {
    this.cache.delete(key);
    
    const timer = this.refreshTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.refreshTimers.delete(key);
    }
  }

  /**
   * Gesamten Cache leeren
   */
  clear(): void {
    this.cache.clear();
    
    // Alle Refresh-Timer löschen
    for (const timer of this.refreshTimers.values()) {
      clearTimeout(timer);
    }
    this.refreshTimers.clear();
  }

  /**
   * Cache-Statistiken
   */
  getStats(): {
    size: number;
    entries: Array<{
      key: string;
      size: number;
      expiresAt: Date;
      age: number;
    }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => {
      let json: string | undefined;
      try {
        json = JSON.stringify(entry.data);
      } catch {
        json = undefined; // Falls nicht serialisierbar
      }
      return {
        key,
        size: json ? json.length : 0,
        expiresAt: new Date(entry.expiresAt),
        age: Date.now() - entry.timestamp
      };
    });

    return {
      size: this.cache.size,
      entries
    };
  }

  /**
   * Cache-Wert mit automatischer Erneuerung (get-or-fetch Pattern)
   */
  async getOrFetch<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Versuche zuerst aus Cache zu lesen
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Falls nicht im Cache, lade Daten frisch
    console.log(`Cache miss für Key: ${key}, lade frische Daten...`);
    const data = await fetchFunction();
    
    // Speichere in Cache
    this.set(key, data, options);
    
    return data;
  }

  /**
   * Prüfe ob ein Wert im Cache existiert und noch gültig ist
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Cache-Größe in Bytes (geschätzt)
   */
  getMemoryUsage(): number {
    let totalSize = 0;
    for (const [key, entry] of this.cache.entries()) {
      totalSize += key.length;
      totalSize += JSON.stringify(entry).length;
    }
    return totalSize;
  }
}

// Singleton Cache Manager
export const cacheManager = new CacheManager();

// Cache-Keys für verschiedene Datentypen
export const CACHE_KEYS = {
  // Contract Caches
  CONTRACTS_IN_RADIUS: (lat: number, lng: number, radius: number, services: string[]) => 
    `contracts:radius:${lat}:${lng}:${radius}:${services.sort().join(',')}`,
  
  CONTRACT_PREVIEWS: (lat: number, lng: number, radius: number, services: string[]) => 
    `contract-previews:radius:${lat}:${lng}:${radius}:${services.sort().join(',')}`,
  
  PURCHASED_CONTRACTS: (companyId: string) => 
    `purchased-contracts:${companyId}`,
  
  CONTRACT_BY_ID: (contractId: string) => 
    `contract:${contractId}`,
  
  // Company Caches
  ALL_COMPANIES: 'all-companies',
  COMPANY_BY_EMAIL: (email: string) => `company:email:${email}`,
  COMPANY_BY_OWNER_ID: (ownerId: string) => `company:owner:${ownerId}`,
  COMPANY_BY_ID: (id: string) => `company:${id}`,
  COMPANIES_BY_CITY: (city: string) => `companies:city:${city.toLowerCase()}`,
  COMPANIES_BY_CITY_SERVICE: (city: string, service: string) => 
    `companies:city:${city.toLowerCase()}:service:${service.toLowerCase()}`,
  COMPANY_SERVICES: (companyId: string) => 
    `company-services:${companyId}`,
  
  // General
  ALL_CONTRACTS: 'all-contracts',
  // Blog
  BLOG_ALL_POSTS: 'blog:all-posts',
  BLOG_CATEGORY: (slug: string) => `blog:category:${slug}`,

  // Company Stats
  COMPANY_STATS: (companyId: string) => `company-stats:${companyId}`,
  COMPANY_EVENTS: (companyId: string) => `company-events:${companyId}`,
  // Partner Stats
  PARTNER_STATS: (partnerId: string) => `partner-stats:${partnerId}`,
  // Partner Lists
  PARTNERS_ALL: 'partners:all:catalog',
  // City Pages
  CITY_PAGE_BY_ID: (id: string) => `citypage:id:${id}`,
  CITY_PAGE_BY_CITY: (city: string) => `citypage:city:${city.toLowerCase()}`,
  CITY_PAGES_LIST: 'citypages:all',
} as const;

// Cache-Optionen für verschiedene Datentypen
export const CACHE_OPTIONS = {
  // Contracts: 24 Stunden Cache
  CONTRACTS: {
    ttl: 24 * 60 * 60 * 1000, // 24 Stunden
    refreshInterval: 24 * 60 * 60 * 1000 // Alle 24 Stunden aktualisieren
  },
  
  // Contract Details: 1 Stunde Cache (ändern sich seltener)
  CONTRACT_DETAILS: {
    ttl: 60 * 60 * 1000, // 1 Stunde
    refreshInterval: 60 * 60 * 1000 // Alle 1 Stunde aktualisieren
  },
  
  // Gekaufte Contracts: 30 Minuten Cache (ändern sich häufiger)
  PURCHASED_CONTRACTS: {
    ttl: 30 * 60 * 1000, // 30 Minuten
    refreshInterval: 30 * 60 * 1000 // Alle 30 Minuten aktualisieren
  },

  // Companies: 6 Stunden Cache (ändern sich selten)
  COMPANIES: {
    ttl: 6 * 60 * 60 * 1000, // 6 Stunden
    refreshInterval: 6 * 60 * 60 * 1000 // Alle 6 Stunden aktualisieren
  },

  // Company Details: 2 Stunden Cache 
  COMPANY_DETAILS: {
    ttl: 2 * 60 * 60 * 1000, // 2 Stunden
    refreshInterval: 2 * 60 * 60 * 1000 // Alle 2 Stunden aktualisieren
  },

  // Company Stats Aggregates: 10 Minuten Cache (häufige Abrufe, seltene Updates)
  COMPANY_STATS: {
    ttl: 24 * 60 * 60 * 1000, // 24 Stunden
    refreshInterval: 24 * 60 * 60 * 1000
  },

  // Company Recent Events: 5 Minuten Cache (optional kurzzeitige Zwischenspeicherung)
  COMPANY_EVENTS: {
    ttl: 5 * 60 * 1000, // 5 Minuten
    refreshInterval: 5 * 60 * 1000
  },

  // Partner Stats: 24 Stunden Cache
  PARTNER_STATS: {
    ttl: 24 * 60 * 60 * 1000,
    refreshInterval: 24 * 60 * 60 * 1000
  },

  // Partner List: 6 Stunden Cache (ändern sich selten)
  PARTNERS: {
    ttl: 6 * 60 * 60 * 1000, // 6 Stunden
    refreshInterval: 6 * 60 * 60 * 1000
  },
  // City Pages: 12 Stunden Cache (häufig gelesen, selten geändert)
  CITY_PAGES: {
    ttl: 12 * 60 * 60 * 1000,
    refreshInterval: 12 * 60 * 60 * 1000
  }
} as const;

// Helper-Funktionen
export const invalidateContractCaches = () => {
  // Lösche alle Contract-bezogenen Caches
  const stats = cacheManager.getStats();
  stats.entries.forEach(entry => {
    if (entry.key.startsWith('contracts:') || 
        entry.key.startsWith('contract-previews:') || 
        entry.key.startsWith('contract:')) {
      cacheManager.delete(entry.key);
    }
  });
  console.log('Contract-Caches invalidiert');
};

export const invalidatePurchasedContractCaches = () => {
  // Lösche alle gekauften Contract-Caches
  const stats = cacheManager.getStats();
  stats.entries.forEach(entry => {
    if (entry.key.startsWith('purchased-contracts:')) {
      cacheManager.delete(entry.key);
    }
  });
  console.log('Purchased Contract-Caches invalidiert');
};

export const invalidateCompanyCaches = () => {
  // Lösche alle Company-bezogenen Caches
  const stats = cacheManager.getStats();
  stats.entries.forEach(entry => {
    if (entry.key.startsWith('companies:') || 
        entry.key.startsWith('company:') ||
        entry.key === 'all-companies') {
      cacheManager.delete(entry.key);
    }
  });
  console.log('Company-Caches invalidiert');
};

export const invalidateCompanyCachesByCity = (city: string) => {
  // Lösche spezifische Stadt-bezogene Company-Caches
  const stats = cacheManager.getStats();
  const cityKey = city.toLowerCase();
  stats.entries.forEach(entry => {
    if (entry.key.includes(`city:${cityKey}`)) {
      cacheManager.delete(entry.key);
    }
  });
  console.log(`Company-Caches für ${city} invalidiert`);
};

// Debug-Funktion für Cache-Status
export const logCacheStats = () => {
  const stats = cacheManager.getStats();
  console.log('=== Cache Statistics ===');
  console.log(`Total entries: ${stats.size}`);
  console.log(`Memory usage: ${(cacheManager.getMemoryUsage() / 1024).toFixed(2)} KB`);
  
  stats.entries.forEach(entry => {
    console.log(`${entry.key}: ${(entry.size / 1024).toFixed(2)} KB, expires: ${entry.expiresAt.toISOString()}`);
  });
  console.log('========================');
};
