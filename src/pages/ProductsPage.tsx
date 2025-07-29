import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Search, Plus, Edit, Trash2, ListFilter } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MenuItem } from '../types/menuItem';
import ProductModal from '../components/products/ProductModal';
import apiClient from '../api/apiClient';
import { fetchCategories, FlatCategory } from '../api/categories';
import { normalizeManufacturedProduct } from '../utils/normalizeManufacturedProduct';
import { serializeManufacturedProduct } from '../utils/serializeManufacturedProduct';
import { uploadProductImage } from '../api/images';


const fetchProducts = async (): Promise<MenuItem[]> => {
  const response = await apiClient.get('/articuloManufacturadoDetalle/todos');
  return response.data;
};

const ProductsPage: React.FC = () => {
  const [categoryOptions, setCategoryOptions] = useState<FlatCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;



  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };
  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      setCategoryOptions(data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };
  const categories = Array.from(
    new Set(
      products
        .map(product => product.categoria?.denominacion)
        .filter(denom => denom != null)
    )
  );

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.denominacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.categoria?.denominacion === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const handleEdit = (product: MenuItem) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (productId: string) => {
    try {
      // Llamar al backend para hacer la baja lógica
      await apiClient.delete(`/articulosManufacturados/baja/${productId}`);

      // Si fue exitoso, actualizar el estado local
      setProducts(prev => prev.filter(p => p.id !== productId));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error al eliminar el producto:', error);
      alert('Ocurrió un error al eliminar el producto');
    }
  };

  const handleSave = async (productData: Partial<MenuItem>, imageFile?: File): Promise<MenuItem> => {
    try {
      // Estructura base para el payload del backend
      const payload = {
        type: "MANUFACTURADO", // 👈 NECESARIO para el backend
        denominacion: productData.denominacion,
        categoriaId: Number(productData.categoria?.id ?? productData.categoriaId),
        descripcion: productData.descripcion,
        tiempoEstimadoMinutos: productData.tiempoEstimadoMinutos,
        preparacion: productData.preparacion,
        precioVenta: productData.precioVenta,
        detalles: (productData.detalles || [])
          .filter(detalle => detalle.item)
          .map((detalle) => ({
            tipo: detalle.tipo ?? "INSUMO",
            cantidad: detalle.cantidad,
            item: {
              id: (detalle.item as any).id,
            },
          })),
      };
      const payloadWithDetails = serializeManufacturedProduct(productData);
      if (selectedProduct) {
        // 📝 Modificación
        const response = await apiClient.put<MenuItem>(
          `/articulosManufacturados/modificar/${selectedProduct.id}`,
          payloadWithDetails
        );

        const updatedProduct = normalizeManufacturedProduct(response.data);


        setProducts((prev) =>
          prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
        );
        if (imageFile) {
          await uploadProductImage(Number(updatedProduct.id), imageFile, 'manufacturado');
        }
        return updatedProduct;
      } else {
        // 🆕 Creación
        const response = await apiClient.post<MenuItem>(
          '/articuloManufacturadoDetalle/crearArticuloManufacturado',
          payload
        );

        const createdProduct = normalizeManufacturedProduct(response.data);
        setProducts((prev) => [...prev, createdProduct]);
        if (imageFile) {
          await uploadProductImage(Number(createdProduct.id), imageFile, 'manufacturado');
        }
        return createdProduct;
      }
    } catch (error: any) {
      // Si el backend envía un mensaje, lo devolvemos para mostrarlo en el modal
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  };



  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-800">Productos</h1>
          <p className="text-gray-600">Gestiona el menú del restaurante</p>
        </div>
        <div className="flex gap-2">
          <Link to="/products/categories">
            <Button variant="outline" icon={<ListFilter size={18} />}>
              Categorías
            </Button>
          </Link>
          <Button
            variant="primary"
            icon={<Plus size={18} />}
            onClick={() => {
              setSelectedProduct(undefined);
              setIsModalOpen(true);
            }}
          >
            Nuevo Producto
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre o descripción"
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiempo de preparación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insumos</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedProducts.map((product) => (

                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.denominacion}</div>
                      <div
                        className="text-sm text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap max-w-xs"
                        title={product.descripcion}
                      >
                        {product.descripcion}
                      </div>

                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="secondary" size="sm">
                      {product.categoria?.denominacion ?? 'Sin categoría'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{product.tiempoEstimadoMinutos} minutos</td>
                  <td className="px-6 py-4 text-sm text-gray-900">${product.precioVenta.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {product.detalles.length} insumos
                    </div>
                    {product.detalles.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {product.detalles.slice(0, 2).map((detalle, index) => (
                          <div key={index}>
                            {detalle.cantidad} {(detalle.item as any).unidadMedida} de {(detalle.item as any).denominacion}
                          </div>
                        ))}
                        {product.detalles.length > 2 && (
                          <div>+{product.detalles.length - 2} más</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Edit size={16} />}
                        onClick={() => handleEdit(product)}
                        aria-label="Editar producto"
                      />
                      {showDeleteConfirm === product.id ? (
                        <div className="flex space-x-1">
                          <Button variant="danger" size="sm" onClick={() => handleDelete(product.id)}>
                            Eliminar
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(null)}>
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={16} />}
                          onClick={() => setShowDeleteConfirm(product.id)}
                          aria-label="Eliminar producto"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between w-full">
              <p className="text-sm text-gray-700">
                Mostrando{' '}
                <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>{' '}
                a{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
                </span>{' '}
                de <span className="font-medium">{filteredProducts.length}</span> resultados
              </p>

              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  &laquo;
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === currentPage
                        ? 'bg-amber-50 border-amber-500 text-amber-600'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  &raquo;
                </button>
              </nav>
            </div>
          </div>

        </div>
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(undefined);
        }}
        onSave={handleSave}
        product={selectedProduct}
        categories={categoryOptions}
      />
    </Layout>
  );
};

export default ProductsPage;