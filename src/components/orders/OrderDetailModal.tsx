import React from 'react';
import { X } from 'lucide-react';
import { PedidoDetalleResponse } from '../../types/order';
import Badge, { BadgeVariant } from '../ui/Badge';

interface Props {
    pedido: PedidoDetalleResponse | null;
    onClose: () => void;
}

const statusVariant = {
    PENDIENTE: 'warning',
    PREPARACION: 'info',
    LISTO: 'secondary',
    ENTREGADO: 'success',
    CANCELADO: 'danger',
};

const OrderDetailModal: React.FC<Props> = ({ pedido, onClose }) => {
    if (!pedido) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-lg mx-4">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-serif font-bold text-gray-800">
                        Detalle del Pedido #{pedido.numeroPedido}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4 space-y-4 text-sm">
                    <div className="flex justify-between">
                        <span>Estado:</span>
                        <Badge variant={statusVariant[pedido.estado] as BadgeVariant}>
                            {pedido.estado}
                        </Badge>
                    </div>

                    <div className="flex justify-between">
                        <span>Fecha:</span>
                        <span>{pedido.fechaPedido}</span>
                    </div>

                    <div className="flex justify-between">
                        <span>Forma de pago:</span>
                        <span>{pedido.formaPago}</span>
                    </div>

                    <div className="flex justify-between">
                        <span>Tipo de envío:</span>
                        <span>{pedido.tipoEnvio}</span>
                    </div>

                    <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-medium">${pedido.total.toFixed(2)}</span>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-gray-700 font-semibold mb-2">Artículos:</h3>
                        {pedido.detalles.map((detalle) => (
                            <div key={detalle.id} className="flex gap-4 items-center mb-3">
                                {detalle.articulo.imagenesArticulos?.[0]?.url && (
                                    <img
                                        src={detalle.articulo.imagenesArticulos[0].url}
                                        alt={detalle.articulo.denominacion}
                                        className="w-16 h-16 object-cover rounded-md border"
                                    />
                                )}
                                <div className="flex-1">
                                    <div className="font-medium text-gray-800">
                                        {detalle.articulo.denominacion}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {detalle.cantidad} x ${detalle.subTotal.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* <div className="border-t pt-4">
                        <h3 className="text-gray-700 font-semibold mb-2">Sucursal:</h3>
                        <p className="text-sm text-gray-600">{pedido.sucursal.nombre}</p>
                        <p className="text-sm text-gray-600">{pedido.sucursal.email}</p>
                        <p className="text-sm text-gray-600">{pedido.sucursal.telefono}</p>
                    </div> */}

                    <div className="border-t pt-4">
                        <h3 className="text-gray-700 font-semibold mb-2">Domicilio:</h3>
                        <p className="text-sm text-gray-600">
                            {pedido.domicilio.calle} {pedido.domicilio.numero}, Piso {pedido.domicilio.piso}, Dpto {pedido.domicilio.nroDpto}
                        </p>
                        <p className="text-sm text-gray-600">
                            {pedido.domicilio.localidad.nombre}, {pedido.domicilio.localidad.provincia.nombre}, {pedido.domicilio.localidad.provincia.pais.nombre}
                        </p>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={onClose}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-4 py-2 rounded"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailModal;
