// Background Service für automatische Cache-Aktualisierung
// Läuft alle 24 Stunden und aktualisiert Contract- und Company-Caches

import { cacheManager, CACHE_OPTIONS, logCacheStats } from '@/lib/cache';

interface CacheRefreshJob {
  key: string;
  refreshFunction: () => Promise<unknown>;
  interval: number;
  lastRun?: number;
}

class CacheRefreshService {
  private jobs: CacheRefreshJob[] = [];
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;

  // Check-Interval: alle 10 Minuten prüfen ob Jobs fällig sind
  private readonly CHECK_INTERVAL = 10 * 60 * 1000; // 10 Minuten

  constructor() {
    this.setupDefaultJobs();
  }

  /**
   * Standard-Jobs für Contract-Cache-Aktualisierung
   */
  private setupDefaultJobs() {
    // Diese Jobs werden später dynamisch basierend auf aktiven Unternehmen erstellt
    console.log('CacheRefreshService initialisiert');
  }

  /**
   * Job hinzufügen
   */
  addJob(job: CacheRefreshJob) {
    // Prüfe ob Job bereits existiert
    const existingIndex = this.jobs.findIndex(j => j.key === job.key);
    if (existingIndex >= 0) {
      this.jobs[existingIndex] = job;
    } else {
      this.jobs.push(job);
    }
    console.log(`Cache-Refresh-Job hinzugefügt: ${job.key}`);
  }

  /**
   * Job entfernen
   */
  removeJob(key: string) {
    this.jobs = this.jobs.filter(job => job.key !== key);
    console.log(`Cache-Refresh-Job entfernt: ${key}`);
  }

  /**
   * Service starten
   */
  start() {
    if (this.isRunning) {
      console.log('CacheRefreshService läuft bereits');
      return;
    }

    this.isRunning = true;
    console.log('CacheRefreshService gestartet');

    // Führe sofort eine Prüfung durch
    this.checkAndRunJobs();

    // Starte Interval für regelmäßige Prüfungen
    this.intervalId = setInterval(() => {
      this.checkAndRunJobs();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Service stoppen
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    console.log('CacheRefreshService gestoppt');
  }

  /**
   * Prüfe und führe fällige Jobs aus
   */
  private async checkAndRunJobs() {
    const now = Date.now();
    const dueJobs = this.jobs.filter(job => {
      if (!job.lastRun) return true; // Noch nie ausgeführt
      return (now - job.lastRun) >= job.interval;
    });

    if (dueJobs.length === 0) {
      return;
    }

    console.log(`${dueJobs.length} Cache-Refresh-Jobs sind fällig`);

    // Führe Jobs parallel aus (mit Limit)
    const CONCURRENT_LIMIT = 3;
    for (let i = 0; i < dueJobs.length; i += CONCURRENT_LIMIT) {
      const batch = dueJobs.slice(i, i + CONCURRENT_LIMIT);
      
      await Promise.allSettled(
        batch.map(async (job) => {
          try {
            console.log(`Führe Cache-Refresh-Job aus: ${job.key}`);
            const data = await job.refreshFunction();
            
            // Speichere in Cache
            cacheManager.set(job.key, data, CACHE_OPTIONS.CONTRACTS);
            
            // Aktualisiere lastRun
            job.lastRun = now;
            
            console.log(`Cache-Refresh-Job erfolgreich: ${job.key}`);
          } catch (error) {
            console.error(`Fehler bei Cache-Refresh-Job ${job.key}:`, error);
          }
        })
      );
    }

    // Logge Cache-Statistiken nach dem Refresh
    logCacheStats();
  }

  /**
   * Job manuell ausführen
   */
  async runJob(key: string): Promise<boolean> {
    const job = this.jobs.find(j => j.key === key);
    if (!job) {
      console.error(`Cache-Refresh-Job nicht gefunden: ${key}`);
      return false;
    }

    try {
      console.log(`Führe Cache-Refresh-Job manuell aus: ${key}`);
      const data = await job.refreshFunction();
      
      cacheManager.set(job.key, data, CACHE_OPTIONS.CONTRACTS);
      job.lastRun = Date.now();
      
      console.log(`Cache-Refresh-Job manuell erfolgreich: ${key}`);
      return true;
    } catch (error) {
      console.error(`Fehler bei manuellem Cache-Refresh-Job ${key}:`, error);
      return false;
    }
  }

  /**
   * Alle Jobs manuell ausführen
   */
  async runAllJobs(): Promise<void> {
    console.log(`Führe alle ${this.jobs.length} Cache-Refresh-Jobs manuell aus`);
    
    for (const job of this.jobs) {
      await this.runJob(job.key);
    }
  }

  /**
   * Status des Services
   */
  getStatus(): {
    isRunning: boolean;
    jobCount: number;
    jobs: Array<{
      key: string;
      interval: number;
      lastRun?: number;
      nextRun?: number;
      overdue: boolean;
    }>;
  } {
    const now = Date.now();
    
    return {
      isRunning: this.isRunning,
      jobCount: this.jobs.length,
      jobs: this.jobs.map(job => ({
        key: job.key,
        interval: job.interval,
        lastRun: job.lastRun,
        nextRun: job.lastRun ? job.lastRun + job.interval : undefined,
        overdue: job.lastRun ? (now - job.lastRun) >= job.interval : true
      }))
    };
  }
}


// Singleton Service
export const cacheRefreshService = new CacheRefreshService();

// Auto-Start des Services (nur im Server-Kontext)
if (typeof window === 'undefined') {
  // Server-Side: Starte Service automatisch
  cacheRefreshService.start();
  
  // Graceful Shutdown
  const cleanup = () => {
    console.log('Stoppe CacheRefreshService...');
    cacheRefreshService.stop();
  };
  
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}
