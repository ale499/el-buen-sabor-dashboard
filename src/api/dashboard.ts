import apiClient from './apiClient';


export const fetchTotalVentas = async (): Promise<number> => {
  const response = await apiClient.get('/grafico/ventas/total');
  return Number(response.data); 
};

export const fetchTotalPedidos = async (): Promise<number> => {
  const response = await apiClient.get('/grafico/pedidos/total');
  return Number(response.data);
};

export const fetchProductosMasVendidos = async (): Promise<
  { producto: string; cantidad: number }[]
> => {
  const response = await apiClient.get('/grafico/productos/mas-vendidos');
  // Si `cantidad` puede venir como string, hacé:
  return response.data.map((item: any) => ({
    producto: item.producto,
    cantidad: Number(item.cantidad),
  }));
};

export const fetchTotalProductosVendidos = async (): Promise<number> => {
  const response = await apiClient.get('/grafico/productos/total-vendidos');
  return Number(response.data);
};
