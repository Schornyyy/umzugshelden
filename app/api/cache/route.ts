// API Route für Cache-Management
// Ermöglicht manuelle Cache-Operationen und Status-Abfragen

import { NextRequest, NextResponse } from 'next/server';
import { cacheManager, invalidateContractCaches, invalidateCompanyCaches } from '@/lib/cache';
import { cacheRefreshService } from '@/lib/cacheRefreshService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats': {
        // Cache-Statistiken zurückgeben
        const stats = cacheManager.getStats();
        const serviceStatus = cacheRefreshService.getStatus();
        
        return NextResponse.json({
          success: true,
          cache: {
            size: stats.size,
            memoryUsage: `${(cacheManager.getMemoryUsage() / 1024).toFixed(2)} KB`,
            entries: stats.entries.map(entry => ({
              key: entry.key,
              size: `${(entry.size / 1024).toFixed(2)} KB`,
              expiresAt: entry.expiresAt.toISOString(),
              ageHours: Math.round(entry.age / (1000 * 60 * 60))
            }))
          },
          refreshService: serviceStatus
        });
      }

      case 'refresh-status': {
        // Status des Refresh-Service
        const status = cacheRefreshService.getStatus();
        return NextResponse.json({
          success: true,
          refreshService: status
        });
      }

      default: {
        return NextResponse.json({
          success: false,
          error: 'Unbekannte Aktion. Verfügbare Aktionen: stats, refresh-status'
        }, { status: 400 });
      }
    }
  } catch (error) {
    console.error('Fehler in Cache-API:', error);
    return NextResponse.json({
      success: false,
      error: 'Interner Server-Fehler'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'clear': {
        // Gesamten Cache leeren
        cacheManager.clear();
        console.log('Cache manuell geleert');
        
        return NextResponse.json({
          success: true,
          message: 'Cache erfolgreich geleert'
        });
      }

      case 'invalidate-contracts': {
        // Contract-Caches invalidieren
        invalidateContractCaches();
        console.log('Contract-Caches manuell invalidiert');
        
        return NextResponse.json({
          success: true,
          message: 'Contract-Caches erfolgreich invalidiert'
        });
      }

      case 'invalidate-companies': {
        // Company-Caches invalidieren
        invalidateCompanyCaches();
        console.log('Company-Caches manuell invalidiert');
        
        return NextResponse.json({
          success: true,
          message: 'Company-Caches erfolgreich invalidiert'
        });
      }

      case 'refresh-all': {
        // Alle Refresh-Jobs manuell ausführen
        await cacheRefreshService.runAllJobs();
        console.log('Alle Cache-Refresh-Jobs manuell ausgeführt');
        
        return NextResponse.json({
          success: true,
          message: 'Alle Cache-Refresh-Jobs erfolgreich ausgeführt'
        });
      }

      case 'refresh-job': {
        // Einzelnen Job ausführen
        const { jobKey } = data;
        if (!jobKey) {
          return NextResponse.json({
            success: false,
            error: 'jobKey ist erforderlich'
          }, { status: 400 });
        }

        const result = await cacheRefreshService.runJob(jobKey);
        
        return NextResponse.json({
          success: result,
          message: result 
            ? `Job ${jobKey} erfolgreich ausgeführt`
            : `Job ${jobKey} konnte nicht ausgeführt werden`
        });
      }

      case 'setup-company-caches': {
        // Company-Caches initialisieren
        const { companies } = data;
        if (!companies || !Array.isArray(companies)) {
          return NextResponse.json({
            success: false,
            error: 'companies Array ist erforderlich'
          }, { status: 400 });
        }

        await cacheRefreshService.initializeCompanyCaches(companies);
        
        return NextResponse.json({
          success: true,
          message: `Cache für ${companies.length} Unternehmen initialisiert`
        });
      }

      case 'start-service': {
        // Refresh-Service starten
        cacheRefreshService.start();
        
        return NextResponse.json({
          success: true,
          message: 'Cache-Refresh-Service gestartet'
        });
      }

      case 'stop-service': {
        // Refresh-Service stoppen
        cacheRefreshService.stop();
        
        return NextResponse.json({
          success: true,
          message: 'Cache-Refresh-Service gestoppt'
        });
      }

      default: {
        return NextResponse.json({
          success: false,
          error: 'Unbekannte Aktion. Verfügbare Aktionen: clear, invalidate-contracts, refresh-all, refresh-job, setup-company-caches, start-service, stop-service'
        }, { status: 400 });
      }
    }
  } catch (error) {
    console.error('Fehler in Cache-API POST:', error);
    return NextResponse.json({
      success: false,
      error: 'Interner Server-Fehler'
    }, { status: 500 });
  }
}
