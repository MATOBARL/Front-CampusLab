import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from './api';
import { AuditEntry, PageResponse } from '../models/campuslab.models';

export interface RabbitBindingRequest {
  queue: string;
  exchange: string;
  routingKey: string;
}
@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly api = inject(Api);

  listar(filtros?: { eventType?: string; page?: number; size?: number }):
    Observable<PageResponse<AuditEntry>> {
    return this.api.get<PageResponse<AuditEntry>>('/audit', {
      eventType: filtros?.eventType,
      page: filtros?.page ?? 0,
      size: filtros?.size ?? 20,
      sort: 'eventTimestamp,desc',
    });
  }

  timelineDeReserva(reservaId: number): Observable<PageResponse<AuditEntry>> {
    return this.api.get<PageResponse<AuditEntry>>(`/audit/reservas/${reservaId}`, {
      size: 100,
      sort: 'eventTimestamp,asc',
    });
  }
  
  crearCola(nombre: string): Observable<string> {
    return this.api.post<string>(`/admin/rabbitmq/queues/${nombre}`, {});
  }

  eliminarCola(nombre: string): Observable<string> {
    return this.api.delete<string>(`/admin/rabbitmq/queues/${nombre}`);
  }

  crearExchange(nombre: string, tipo: string = 'topic'): Observable<string> {
    return this.api.post<string>(`/admin/rabbitmq/exchanges/${nombre}?type=${tipo}`, {});
  }

  eliminarExchange(nombre: string): Observable<string> {
    return this.api.delete<string>(`/admin/rabbitmq/exchanges/${nombre}`);
  }

  crearBinding(binding: RabbitBindingRequest): Observable<string> {
    return this.api.post<string>(
      `/admin/rabbitmq/bindings?queue=${binding.queue}&exchange=${binding.exchange}&routingKey=${binding.routingKey}`,
      {}
    );
  }

  // --- Consulta de Eventos y DLQ ---
  obtenerLogsAuditoria(): Observable<any[]> {
    return this.api.get<any[]>('/reports/audit-logs');
  }
}
