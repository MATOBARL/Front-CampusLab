import { DatePipe, CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { AuditService } from '../../core/services/audit.service';
import { AuthService } from '../../core/services/auth.service';
import { KafkaService } from '../../core/services/kafka.service';
import {
  AnalyticsMetric,
  AuditEntry,
  KafkaClusterStatus
} from '../../core/models/campuslab.models';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './audit.html',
  styleUrl: './audit.scss',
})
export class Audit implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly auditService = inject(AuditService);
  private readonly kafkaService = inject(KafkaService);
  private readonly destroyRef = inject(DestroyRef);

  // --- Estados de Auditoría Originales ---
  protected readonly entradas = signal<AuditEntry[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filtroReservaId = signal<string>('');

  // --- Estados de Control de RabbitMQ ---
  nombreCola = '';
  nombreExchange = '';
  tipoExchange = 'topic';
  bindingQueue = '';
  bindingExchange = '';
  bindingRoutingKey = '';
  mensajeExito = signal<string | null>(null);

  // --- Estados de Apache Kafka ---
  protected readonly kafkaCluster = signal<KafkaClusterStatus | null>(null);
  protected readonly kafkaMetrics = signal<AnalyticsMetric[]>([]);
  protected readonly cargandoKafka = signal(false);
  protected readonly kafkaError = signal<string | null>(null);

  kafkaTopicoPrueba = 'campuslab.bookings.stream';
  kafkaClavePrueba = 'test-key';
  kafkaPayloadPrueba = '{"eventType":"TEST_PING","resourceId":"LAB-01","source":"angular-bff"}';

  ngOnInit(): void {
    this.cargar();
    if (this.puedeVerKafka()) {
      this.cargarEstadoKafka();
      this.iniciarPollingMetricasKafka();
    }
  }

  // --- Métodos de Timeline / Auditoría ---
  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    const reservaId = Number(this.filtroReservaId());
    const consulta = reservaId > 0
      ? this.auditService.timelineDeReserva(reservaId)
      : this.auditService.listar();

    consulta.subscribe({
      next: (pagina) => {
        this.entradas.set(pagina.content);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(this.mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  limpiarFiltro(): void {
    this.filtroReservaId.set('');
    this.cargar();
  }

  esAdmin(): boolean {
    return this.auth.tieneAlgunRol('ADMIN');
  }

  puedeVerKafka(): boolean {
    return this.auth.tieneAlgunRol('ADMIN', 'TECNICO');
  }

  // --- Métodos de Apache Kafka (KafkaAdminController) ---
  cargarEstadoKafka(): void {
    this.cargandoKafka.set(true);
    this.kafkaError.set(null);

    this.kafkaService.getClusterStatus().subscribe({
      next: (status) => {
        this.kafkaCluster.set(status);
        this.cargandoKafka.set(false);
      },
      error: () => {
        this.kafkaError.set('No se pudo consultar el estado del clúster Kafka en el BFF.');
        this.cargandoKafka.set(false);
      },
    });
  }

  private iniciarPollingMetricasKafka(): void {
    this.kafkaService
      .pollMetrics(5000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (metrics) => this.kafkaMetrics.set(metrics),
        error: () => this.kafkaError.set('Error al sincronizar métricas en tiempo real desde Kafka.'),
      });
  }

  publicarEventoPruebaKafka(): void {
    if (!this.kafkaTopicoPrueba.trim()) return;

    let payloadObj: Record<string, unknown>;
    try {
      payloadObj = JSON.parse(this.kafkaPayloadPrueba);
    } catch {
      this.kafkaError.set('El payload de prueba debe ser un JSON válido.');
      return;
    }

    this.kafkaError.set(null);
    this.kafkaService
      .publishTestEvent(
        this.kafkaTopicoPrueba.trim(),
        payloadObj,
        this.kafkaClavePrueba.trim() || 'test-key'
      )
      .subscribe({
        next: (res) => {
          this.mensajeExito.set(
            `Evento publicado en Kafka -> Tópico: '${res.topic}' | Clave: '${res.key}'`
          );
          this.cargarEstadoKafka();
        },
        error: () => this.kafkaError.set('Error al publicar el evento de prueba en Kafka.'),
      });
  }

  // --- Métodos de Administración de RabbitMQ (RabbitAdminController) ---
  crearCola(): void {
    if (!this.nombreCola.trim()) return;
    this.auditService.crearCola(this.nombreCola.trim()).subscribe({
      next: () => {
        this.mensajeExito.set(`Cola '${this.nombreCola}' creada exitosamente.`);
        this.nombreCola = '';
      },
      error: () => this.error.set('Error al crear la cola en RabbitMQ.')
    });
  }

  eliminarCola(): void {
    if (!this.nombreCola.trim()) return;
    this.auditService.eliminarCola(this.nombreCola.trim()).subscribe({
      next: () => {
        this.mensajeExito.set(`Cola '${this.nombreCola}' eliminada exitosamente.`);
        this.nombreCola = '';
      },
      error: () => this.error.set('Error al eliminar la cola en RabbitMQ.')
    });
  }

  crearExchange(): void {
    if (!this.nombreExchange.trim()) return;
    this.auditService.crearExchange(this.nombreExchange.trim(), this.tipoExchange).subscribe({
      next: () => {
        this.mensajeExito.set(`Exchange '${this.nombreExchange}' creado exitosamente.`);
        this.nombreExchange = '';
      },
      error: () => this.error.set('Error al crear el Exchange en RabbitMQ.')
    });
  }

  eliminarExchange(): void {
    if (!this.nombreExchange.trim()) return;
    this.auditService.eliminarExchange(this.nombreExchange.trim()).subscribe({
      next: () => {
        this.mensajeExito.set(`Exchange '${this.nombreExchange}' eliminado exitosamente.`);
        this.nombreExchange = '';
      },
      error: () => this.error.set('Error al eliminar el Exchange.')
    });
  }

  crearBinding(): void {
    if (!this.bindingQueue.trim() || !this.bindingExchange.trim()) return;
    this.auditService.crearBinding({
      queue: this.bindingQueue.trim(),
      exchange: this.bindingExchange.trim(),
      routingKey: this.bindingRoutingKey.trim()
    }).subscribe({
      next: () => {
        this.mensajeExito.set('Binding creado correctamente.');
        this.bindingQueue = '';
        this.bindingExchange = '';
        this.bindingRoutingKey = '';
      },
      error: () => this.error.set('Error al crear el Binding.')
    });
  }

  private mensajeError(err: unknown): string {
    const status = (err as { status?: number })?.status;
    if (status === 403) return 'La auditoría es solo para Admin/Auditor.';
    return 'No fue posible cargar el timeline de auditoría.';
  }
}