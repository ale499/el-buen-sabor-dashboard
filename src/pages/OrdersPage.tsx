// src/pages/OrdersPage.tsx

import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge, { BadgeVariant } from '../components/ui/Badge';
import { fetchPedidos, updatePedidoEstado } from '../api/orders';
import { PedidoResponse, PedidoEstado } from '../types/order';
import { connectToPedidoSocket, disconnectPedidoSocket } from '../utils/pedidoWebSocket';
import {
  Eye, ShoppingBag, Clock, Check, X,
} from 'lucide-react';
import PedidoCardAcciones from '../components/orders/PedidoCardAcciones';
import { useUserRol } from '../hooks/useUserRol';
import OrderDetailModal from '../components/orders/OrderDetailModal';
import { fetchPedidoDetalle } from '../api/orders';
import { PedidoDetalleResponse } from '../types/order';


const statusIcons: Record<PedidoEstado, React.ReactNode> = {
  PENDIENTE: <Clock size={16} />,
  PREPARACION: <ShoppingBag size={16} />,
  LISTO: <Check size={16} />,
  ENTREGADO: <Check size={16} />,
  CANCELADO: <X size={16} />,
};

const statusVariant: Record<PedidoEstado, BadgeVariant> = {
  PENDIENTE: 'warning',
  PREPARACION: 'info',
  LISTO: 'secondary',
  ENTREGADO: 'success',
  CANCELADO: 'danger',
};

const statusLabel: Record<PedidoEstado, string> = {
  PENDIENTE: 'Pendiente',
  PREPARACION: 'En preparación',
  LISTO: 'Listo para entrega',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

const tabsPorRol: Record<'ADMIN' | 'CHEF' | 'DELIVERY', ('all' | PedidoEstado)[]> = {
  ADMIN: ['all', 'PENDIENTE', 'PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO'],
  CHEF: ['all', 'PENDIENTE', 'LISTO'],
  DELIVERY: ['all', 'LISTO', 'ENTREGADO'],
};

const OrdersPage: React.FC = () => {
  const rol = useUserRol();
  const [pedidos, setPedidos] = useState<PedidoResponse[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | PedidoEstado>('all');
  const [pedidoDetalle, setPedidoDetalle] = useState<PedidoDetalleResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarPedidos = async () => {
      try {
        const data = await fetchPedidos();
        setPedidos(data);
      } catch (err) {
        console.error('Error al cargar pedidos:', err);
      } finally {
        setLoading(false); // 👈 solo se desactiva cuando termina
      }
    };

    cargarPedidos();

    // Conectar WebSocket
    connectToPedidoSocket((updatedPedido) => {
      setPedidos((prev) => {
        const exists = prev.some((p) => p.id === updatedPedido.id);
        return exists
          ? prev.map((p) => (p.id === updatedPedido.id ? updatedPedido : p))
          : [updatedPedido, ...prev];
      });
    });

    return () => {
      disconnectPedidoSocket();
    };
  }, []);

  // ⏳ Mostrar spinner de carga mientras se traen pedidos o el rol no está listo
  if (loading || !rol || !tabsPorRol[rol]) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600"></div>
        </div>
      </Layout>
    );
  }

  // 👉 Lógica de filtros por rol y tab
  const pedidosVisibles = pedidos.filter((p) => {
    if (rol === 'CHEF') return ['PENDIENTE', 'LISTO'].includes(p.estado);
    if (rol === 'DELIVERY') return ['LISTO', 'ENTREGADO'].includes(p.estado);
    return true;
  });

  const pedidosFiltrados = activeTab === 'all'
    ? pedidosVisibles
    : pedidosVisibles.filter((p) => p.estado && p.estado === activeTab);
  console.log('Pedidos filtrados:', pedidosFiltrados);
  const tabs = tabsPorRol[rol];



  return (
    <Layout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-800">Gestión de Órdenes</h1>
          <p className="text-gray-600">Administra todas las órdenes del restaurante</p>
        </div>
      </div>

      <div className="flex gap-6 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 text-sm font-medium border-b-2 ${activeTab === tab
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            {tab === 'all' ? 'Todas' : statusLabel[tab]}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {pedidosFiltrados.map((pedido) => (
          <Card key={pedido.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="flex justify-between">
              <div>
                <h3 className="font-medium text-gray-800">Orden #{pedido.id}</h3>
                <p className="text-gray-500 text-sm">
                  {new Date(pedido.fechaPedido).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {pedido.estado && statusVariant[pedido.estado] && statusIcons[pedido.estado] && statusLabel[pedido.estado] ? (
                <Badge variant={statusVariant[pedido.estado]} icon={statusIcons[pedido.estado]}>
                  {statusLabel[pedido.estado]}
                </Badge>
              ) : (
                <Badge variant="warning">Estado desconocido</Badge>
              )}

            </div>

            <div className="mt-4 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Total:</span>
                <span className="font-medium">
                  {typeof pedido.total === 'number' ? `$${pedido.total.toFixed(2)}` : '—'}
                </span>

              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tiempo estimado:</span>
                <span>{pedido.tiempoEstimadoMinutos} min</span>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                icon={<Eye size={16} />}
                onClick={async () => {
                  try {
                    const detalle = await fetchPedidoDetalle(pedido.id);
                    setPedidoDetalle(detalle);
                  } catch (err) {
                    console.error('Error al cargar detalle del pedido', err);
                    alert('No se pudo cargar el detalle del pedido.');
                  }
                }}
              >
                Ver detalles
              </Button>

            </div>

            <PedidoCardAcciones
              rol={rol}
              estado={pedido.estado}
              onChangeEstado={async (nuevoEstado) => {
                try {
                  await updatePedidoEstado(pedido.id, nuevoEstado);
                  console.log(`Pedido ${pedido.id} actualizado a estado ${nuevoEstado}`);
                  // El estado se actualizará por WebSocket, no localmente
                } catch (err) {
                  console.error('Error al cambiar estado', err);
                  alert('Hubo un error al cambiar el estado del pedido.');
                }
              }}
            />


          </Card>
        ))}
        {pedidoDetalle && (
          <OrderDetailModal pedido={pedidoDetalle} onClose={() => setPedidoDetalle(null)} />
        )}
      </div>
    </Layout>
  );
};

export default OrdersPage;
