// Cache-Initialisierung für Unternehmen
// Dieses Script sollte beim App-Start ausgeführt werden

import { cacheRefreshService } from '@/lib/cacheRefreshService';
import { cacheManager, CACHE_KEYS } from '@/lib/cache';

/**
 * Initialisiert den Cache für alle aktiven Unternehmen
 * Sollte beim Server-Start aufgerufen werden
 */
export async function initializeCompanyCache() {
  try {
    console.log('Initialisiere Company-Cache...');

    // Importiere Company-Actions dynamisch
    const { getAllCompanies } = await import('@/actions/companyActions');

    // Lade alle aktiven Unternehmen
    const companies = await getAllCompanies();

    if (companies.length === 0) {
      console.log('Keine aktiven Unternehmen gefunden - Cache-Initialisierung übersprungen');
      return;
    }

    // Konvertiere zu Cache-Format
    const companiesForCache = companies
      .filter(company => 
        company.latitude && 
        company.longitude && 
        company.services && 
        company.services.length > 0
      )
      .map(company => ({
        id: company.id!,
        latitude: company.latitude!,
        longitude: company.longitude!,
        services: company.services!,
        radius: 50 // Standard-Radius
      }));

    console.log(`Initialisiere Cache für ${companiesForCache.length} Unternehmen...`);

    // Cache-Jobs für Unternehmen konfigurieren
    await cacheRefreshService.initializeCompanyCaches(companiesForCache);

    // Service starten falls noch nicht gestartet
    cacheRefreshService.start();

    console.log('Company-Cache erfolgreich initialisiert');

    return {
      success: true,
      companiesProcessed: companiesForCache.length,
      totalCompanies: companies.length
    };

  } catch (error) {
    console.error('Fehler bei Cache-Initialisierung:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    };
  }
}

/**
 * Cache für ein einzelnes Unternehmen hinzufügen/aktualisieren
 */
export async function addCompanyToCache(companyId: string) {
  try {
    // Importiere Company-Actions dynamisch
    const { getAllCompanies } = await import('@/actions/companyActions');
    
    const companies = await getAllCompanies();
    const company = companies.find(c => c.id === companyId);
    
    if (!company || !company.latitude || !company.longitude || !company.services) {
      console.warn(`Unternehmen ${companyId} hat unvollständige Daten für Cache`);
      return false;
    }

    const companyForCache = {
      id: company.id!,
      latitude: company.latitude,
      longitude: company.longitude,
      services: company.services,
      radius: 50 // Standard-Radius
    };

    await cacheRefreshService.initializeCompanyCaches([companyForCache]);
    
    console.log(`Cache für Unternehmen ${companyId} hinzugefügt/aktualisiert`);
    return true;

  } catch (error) {
    console.error(`Fehler beim Hinzufügen von Unternehmen ${companyId} zum Cache:`, error);
    return false;
  }
}

/**
 * Cache für ein Unternehmen entfernen
 */
export function removeCompanyFromCache(
  companyId: string,
  latitude: number,
  longitude: number,
  services: string[],
  radius: number = 50
) {
  try {
    // Entferne beide Cache-Keys für dieses Unternehmen
  // Verwende vereinheitlichten Services-Key ['ALL']
  const contractsKey = CACHE_KEYS.CONTRACTS_IN_RADIUS(latitude, longitude, radius, ["ALL"]);
  const previewsKey = CACHE_KEYS.CONTRACT_PREVIEWS(latitude, longitude, radius, ["ALL"]);
    const purchasedKey = CACHE_KEYS.PURCHASED_CONTRACTS(companyId);

    cacheManager.delete(contractsKey);
    cacheManager.delete(previewsKey);
    cacheManager.delete(purchasedKey);

    // Entferne auch die Refresh-Jobs
    cacheRefreshService.removeJob(contractsKey);
    cacheRefreshService.removeJob(previewsKey);

    console.log(`Cache für Unternehmen ${companyId} entfernt`);
    return true;

  } catch (error) {
    console.error(`Fehler beim Entfernen von Unternehmen ${companyId} aus Cache:`, error);
    return false;
  }
}

/**
 * Cache-Statistiken für Dashboard
 */
export function getCacheStatistics() {
  try {
    const stats = cacheManager.getStats();
    const serviceStatus = cacheRefreshService.getStatus();
    
    return {
      cache: {
        totalEntries: stats.size,
        memoryUsage: Math.round(cacheManager.getMemoryUsage() / 1024), // KB
        contractCaches: stats.entries.filter((e: { key: string }) => 
          e.key.startsWith('contracts:') || e.key.startsWith('contract-previews:')
        ).length,
        purchasedCaches: stats.entries.filter((e: { key: string }) => 
          e.key.startsWith('purchased-contracts:')
        ).length
      },
      refreshService: {
        isRunning: serviceStatus.isRunning,
        totalJobs: serviceStatus.jobCount,
        overdueJobs: serviceStatus.jobs.filter(j => j.overdue).length
      }
    };

  } catch (error) {
    console.error('Fehler beim Abrufen der Cache-Statistiken:', error);
    return null;
  }
}
