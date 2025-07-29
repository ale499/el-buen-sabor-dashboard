// src/types/order.ts

export type PedidoEstado =
  | 'PENDIENTE'
  | 'PREPARACION'
  | 'LISTO'
  | 'ENTREGADO'
  | 'CANCELADO';

export interface PedidoResponse {
  id: number;
  fechaPedido: string;
  estado: PedidoEstado;
  total: number;
  tiempoEstimadoMinutos: number;
  initPoint?: string;
}
export interface PedidoDetalleResponse extends PedidoResponse {
  numeroPedido: number;
  totalCosto: number;
  horaEstimadaFinalizacion: string;
  formaPago: string;
  tipoEnvio: string;
  empleado?: any; // Podés tiparlo mejor si tenés el modelo de empleado
  sucursal: {
    id: number;
    nombre: string;
    telefono: string;
    email: string;
  };
  domicilio: {
    calle: string;
    numero: number;
    piso: number;
    nroDpto: number;
    cp: number;
    localidad: {
      nombre: string;
      provincia: {
        nombre: string;
        pais: {
          nombre: string;
        };
      };
    };
  };
  detalles: {
    id: number;
    cantidad: number;
    subTotal: number;
    articulo: {
      id: number;
      denominacion: string;
      descripcion: string;
      imagenesArticulos: {
        id: string;
        url: string;
      }[];
      categoria: {
        id: number;
        denominacion: string;
      };
      unidadMedida: {
        id: number;
        denominacion: string;
      };
    };
  }[];
}
