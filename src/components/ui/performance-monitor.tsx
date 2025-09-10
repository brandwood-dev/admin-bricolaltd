import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Clock, Database, Zap, RefreshCw } from 'lucide-react';
import { useCacheManager } from '@/hooks/useCache';

interface PerformanceMetrics {
  renderTime: number;
  cacheHits: number;
  cacheMisses: number;
  apiCalls: number;
  memoryUsage: number;
  lastUpdate: Date;
}

export const PerformanceMonitor: React.FC<{
  className?: string;
  showDetails?: boolean;
}> = ({ className, showDetails = false }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    apiCalls: 0,
    memoryUsage: 0,
    lastUpdate: new Date()
  });
  
  const [isVisible, setIsVisible] = useState(false);
  const cacheManager = useCacheManager();
  
  useEffect(() => {
    const startTime = performance.now();
    
    // Simulate performance tracking
    const updateMetrics = () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Get cache statistics
      const cacheStats = cacheManager.getStats();
      
      // Estimate memory usage (simplified)
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
      
      setMetrics({
        renderTime: Math.round(renderTime * 100) / 100,
        cacheHits: cacheStats.hits,
        cacheMisses: cacheStats.misses,
        apiCalls: cacheStats.misses, // API calls roughly equal cache misses
        memoryUsage: Math.round(memoryUsage / 1024 / 1024 * 100) / 100, // MB
        lastUpdate: new Date()
      });
    };
    
    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []); // Remove cacheManager dependency to prevent infinite re-renders
  
  const cacheHitRate = metrics.cacheHits + metrics.cacheMisses > 0 
    ? Math.round((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100)
    : 0;
  
  const getPerformanceStatus = () => {
    if (metrics.renderTime < 100) return { status: 'excellent', color: 'bg-green-500' };
    if (metrics.renderTime < 300) return { status: 'good', color: 'bg-blue-500' };
    if (metrics.renderTime < 1000) return { status: 'fair', color: 'bg-yellow-500' };
    return { status: 'poor', color: 'bg-red-500' };
  };
  
  const performanceStatus = getPerformanceStatus();
  
  if (!showDetails && !isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        <Activity className="h-4 w-4 mr-2" />
        Performance
      </Button>
    );
  }
  
  return (
    <Card className={`${className} ${!showDetails ? 'fixed bottom-4 right-4 z-50 w-80' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitoring des performances
          </CardTitle>
          {!showDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Performance Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Statut global</span>
          <Badge className={`${performanceStatus.color} text-white`}>
            {performanceStatus.status}
          </Badge>
        </div>
        
        {/* Render Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Temps de rendu</span>
          </div>
          <span className="text-sm font-medium">{metrics.renderTime}ms</span>
        </div>
        
        {/* Cache Performance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Taux de cache</span>
          </div>
          <span className="text-sm font-medium">{cacheHitRate}%</span>
        </div>
        
        {/* API Calls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Appels API</span>
          </div>
          <span className="text-sm font-medium">{metrics.apiCalls}</span>
        </div>
        
        {/* Memory Usage */}
        {metrics.memoryUsage > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Mémoire</span>
            <span className="text-sm font-medium">{metrics.memoryUsage} MB</span>
          </div>
        )}
        
        {showDetails && (
          <>
            {/* Detailed Cache Stats */}
            <div className="pt-2 border-t space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Cache hits</span>
                <span>{metrics.cacheHits}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Cache misses</span>
                <span>{metrics.cacheMisses}</span>
              </div>
            </div>
            
            {/* Cache Management */}
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => cacheManager.clearAll()}
                className="w-full text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Vider le cache
              </Button>
            </div>
          </>
        )}
        
        {/* Last Update */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Mis à jour: {metrics.lastUpdate.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
};

// Hook for performance tracking
export const usePerformanceTracking = () => {
  const [startTime] = useState(() => performance.now());
  
  const measureRenderTime = () => {
    return performance.now() - startTime;
  };
  
  const logPerformance = (operation: string, duration: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${operation}: ${duration.toFixed(2)}ms`);
    }
  };
  
  return {
    measureRenderTime,
    logPerformance
  };
};