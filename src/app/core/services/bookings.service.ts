import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Api } from './api';
import {
  CambioEstadoRequest,
  EstadoReserva,
  PageResponse,
  Reserva,
  ReservaRequest,
} from '../models/campuslab.models';
import { environment } from '../../../environments/environment';

export interface BookingDTO {
  id?: number;
  resourceId: number;
  userId: string;
  startTime: string;
  endTime: string;
  status?: string;
}

@Injectable({providedIn: 'root'})
export class BookingsService {
  private readonly api = inject(Api);

  // --- Métodos originales de tu proyecto ---
  listar(filtros?: { estado?: EstadoReserva; recursoId?: number; page?: number; size?: number }): Observable<PageResponse<Reserva>> {
    return this.api.get<PageResponse<Reserva>>('/bookings', {
      estado: filtros?.estado,
      recursoId: filtros?.recursoId,
      page: filtros?.page ?? 0,
      size: filtros?.size ?? 20,
      sort: 'fechaCreacion,desc',
    });
  }

  obtener(id: number): Observable<Reserva> {
    return this.api.get<Reserva>(`/bookings/${id}`);
  }

  crear(reserva: ReservaRequest): Observable<Reserva> {
    return this.api.post<Reserva>('/bookings', reserva);
  }

  cambiarEstado(id: number, cambio: CambioEstadoRequest): Observable<Reserva> {
    return this.api.put<Reserva>(`/bookings/${id}/status`, cambio);
  }

  // --- Alias / Métodos de conveniencia unificados ---
  createBooking(booking: BookingDTO): Observable<BookingDTO> {
    return this.api.post<BookingDTO>('/bookings', booking);
  }

  getBookings(): Observable<Reserva[]> {
    return this.api.get<Reserva[]>('/bookings');
  }

  cancelBooking(id: number): Observable<void> {
    return this.api.delete<void>(`/bookings/${id}`);
  }
}