// src/utils/pedidoWebSocket.ts

import { Client, IMessage } from '@stomp/stompjs';
import { PedidoResponse } from '../types/order';

let stompClient: Client | null = null;

export const connectToPedidoSocket = (
  onPedidoUpdate: (pedido: PedidoResponse) => void
) => {
  stompClient = new Client({
    brokerURL: import.meta.env.VITE_WS_BACKEND_URL || 'ws://localhost:8080/ws',
    reconnectDelay: 5000,
    onConnect: () => {
      stompClient?.subscribe(`/topic/pedidos`, (message: IMessage) => {
        try {
          const updatedPedido: PedidoResponse = JSON.parse(message.body);
          if (!updatedPedido || typeof updatedPedido !== 'object' || !updatedPedido.id) {
            console.warn('Pedido inválido recibido por WebSocket:', message.body);
            return;
          }
          console.log('Pedido actualizado recibido por WebSocket:', updatedPedido);
          onPedidoUpdate(updatedPedido);
        } catch (error) {
          console.error('Error al parsear mensaje de WebSocket:', error, message.body);
        }
      });
    }
  });

  stompClient.activate();
};

export const disconnectPedidoSocket = () => {
  stompClient?.deactivate();
};
