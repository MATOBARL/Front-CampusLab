import { Injectable, inject } from '@angular/core';
import { Observable, timer, switchMap } from 'rxjs';
import { Api } from './api';
import {
  AnalyticsMetric,
  KafkaClusterStatus,
  KafkaPublishResponse
} from '../models/campuslab.models';

@Injectable({
  providedIn: 'root'
})
export class KafkaService {
  private readonly api = inject(Api);
  private readonly basePath = '/bff/kafka';

  /**
   * Obtiene el resumen del clúster Kafka: tópicos activos, particiones,
   * factor de replicación y Consumer Groups conectados.
   */
  getClusterStatus(): Observable<KafkaClusterStatus> {
    return this.api.get<KafkaClusterStatus>(`${this.basePath}/cluster`);
  }

  /**
   * Obtiene el historial reciente de métricas analíticas procesadas
   * desde el tópico 'campuslab.analytics.metrics'.
   */
  getRecentMetrics(): Observable<AnalyticsMetric[]> {
    return this.api.get<AnalyticsMetric[]>(`${this.basePath}/metrics`);
  }

  /**
   * Realiza polling periódico (por defecto cada 5 segundos) de las métricas
   * analíticas en tiempo real para actualizar el dashboard en vivo.
   */
  pollMetrics(intervalMs = 5000): Observable<AnalyticsMetric[]> {
    return timer(0, intervalMs).pipe(
      switchMap(() => this.getRecentMetrics())
    );
  }

  /**
   * Publica un evento de prueba en formato JSON hacia un tópico Kafka.
   */
  publishTestEvent(
    topic: string,
    payload: Record<string, unknown>,
    key = 'frontend-test-key'
  ): Observable<KafkaPublishResponse> {
    const encodedTopic = encodeURIComponent(topic);
    const encodedKey = encodeURIComponent(key);
    return this.api.post<KafkaPublishResponse>(
      `${this.basePath}/publish/${encodedTopic}?key=${encodedKey}`,
      payload
    );
  }
}