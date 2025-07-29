// src/api/orders.ts

import apiClient from './apiClient';
import { PedidoResponse } from '../types/order';
import { PedidoDetalleResponse } from '../types/order';

// Obtener todos los pedidos
export const fetchPedidos = async (): Promise<PedidoResponse[]> => {
  const res = await apiClient.get('/pedido');
  return res.data;
};

// Obtener un pedido por ID (no estás usando esto aún, pero lo dejamos)
export const fetchPedidoById = async (id: number): Promise<PedidoResponse> => {
  const res = await apiClient.get(`/api/pedidos/${id}`);
  return res.data;
};

// Cambiar el estado de un pedido (usa PATCH y query param `nuevoEstado`)
export const updatePedidoEstado = async (
  id: number,
  nuevoEstado: string
): Promise<void> => {
  await apiClient.post(`/pedido/${id}/estado?nuevoEstado=${nuevoEstado}`);
};


export const fetchPedidoDetalle = async (
  id: number
): Promise<PedidoDetalleResponse> => {
  const res = await apiClient.get(`/pedido/${id}`);
  return res.data;
};

