import { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import {
  fetchTotalVentas,
  fetchTotalPedidos,
  fetchTotalProductosVendidos,
  fetchProductosMasVendidos
} from '../api/dashboard';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const DashboardPage = () => {
  const [ventas, setVentas] = useState<number>(0);
  const [pedidos, setPedidos] = useState<number>(0);
  const [productosVendidos, setProductosVendidos] = useState<number>(0);
  const [masVendidos, setMasVendidos] = useState<{ producto: string; cantidad: number }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const totalVentas = await fetchTotalVentas();
      setVentas(Number(totalVentas)); // 👈 conversión segura

      const totalPedidos = await fetchTotalPedidos();
      setPedidos(Number(totalPedidos));

      const totalVendidos = await fetchTotalProductosVendidos();
      setProductosVendidos(Number(totalVendidos));

      const topVendidos = await fetchProductosMasVendidos();
      setMasVendidos(topVendidos);
    };

    loadData();
  }, []);


  const chartData = {
    labels: masVendidos.map((p) => p.producto),
    datasets: [
      {
        label: 'Cantidad vendida',
        data: masVendidos.map((p) => p.cantidad),
        backgroundColor: '#FBBF24',
      },
    ],
  };

  return (
    <Layout>
      <h1 className="text-2xl font-serif font-bold mb-6 text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <p className="text-sm text-gray-500">Ventas totales</p>
          <p className="text-2xl font-bold text-amber-600">
            ${Number(ventas).toFixed(2)}
          </p>

        </Card>
        <Card>
          <p className="text-sm text-gray-500">Pedidos totales</p>
          <p className="text-2xl font-bold text-amber-600">{pedidos}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Productos vendidos</p>
          <p className="text-2xl font-bold text-amber-600">{productosVendidos}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Producto más vendido</p>
          <p className="text-xl font-semibold text-gray-800">
            {masVendidos.length > 0 ? masVendidos[0].producto : 'N/A'}
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Productos más vendidos</h2>
        <div className="h-72">
          <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
      </Card>
    </Layout>
  );
};

export default DashboardPage;
