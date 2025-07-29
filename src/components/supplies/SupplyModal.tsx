import React, { useEffect, useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Supply } from '../../types/supply';
import { X } from 'lucide-react';
import apiClient from '../../api/apiClient';
import { deleteImage, fetchImagesByEntity, uploadProductImage } from '../../api/images';


interface SupplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  supply?: Supply;
  categories: Array<{ id: number; denominacion: string; esInsumo: boolean }>;
}

type UnidadMedida = { id: number; denominacion: string };

const SupplyModal: React.FC<SupplyModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  supply,
  categories,
}) => {
  const [formData, setFormData] = useState<Partial<Supply>>({
    denominacion: '',
    categoria: undefined,
    unidadMedida: undefined,
    precioCompra: 0,
    stockActual: 0,
    stockMinimo: 0,
    stockMaximo: 100,
    precioVenta: 0,
    esParaElaborar: false,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [unitOptions, setUnitOptions] = useState<UnidadMedida[]>([]);
  const [ventaInvalida, setVentaInvalida] = useState(false);
  const [imageInfo, setImageInfo] = useState<{ publicId: string; uuid: string } | null>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      if (supply) {
        setFormData(supply);

        if (!supply.esParaElaborar) {
          try {
            const images = await fetchImagesByEntity(supply.id!, 'insumo');
            if (images.length > 0) {
              const image = images[0];
              setImagePreview(image.url); // vista previa
              setImageInfo({
                publicId: image.name, // name = publicId
                uuid: image.id.toString(), // id = uuid
              });
            } else {
              setImagePreview(null);
              setImageInfo(null);
            }
          } catch (err) {
            console.error('Error al cargar imagen del insumo:', err);
          }
        } else {
          setImagePreview(null);
          setImageInfo(null);
        }
      } else {
        setFormData({
          denominacion: '',
          categoria: undefined,
          unidadMedida: undefined,
          precioCompra: 0,
          precioVenta: 0,
          stockActual: 0,
          stockMinimo: 0,
          stockMaximo: 100,
          esParaElaborar: false,
        });
        setImagePreview(null);
        setImageInfo(null);
      }

      setVentaInvalida(false);
      setImageFile(null);
      setImageError(null);
    };

    cargarDatos();
  }, [supply]);


  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await apiClient.get('/unidadmedida');
        setUnitOptions(res.data);
      } catch (err) {
        console.error('Error cargando unidades de medida:', err);
      }
    };

    if (isOpen) fetchUnits();
  }, [isOpen]);

  useEffect(() => {
    if (!supply) return;
    if (!unitOptions.length) return;

    const unidad = typeof supply.unidadMedida === 'string'
      ? unitOptions.find(u => u.denominacion === supply.unidadMedida)
      : unitOptions.find(u => u.id === (supply.unidadMedida as UnidadMedida).id);

    setFormData({ ...supply, unidadMedida: unidad ?? undefined });
  }, [supply, unitOptions]);

  if (!isOpen) return null;
  const handleImageChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageError('Selecciona solo imágenes');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('La imagen debe pesar menos de 5MB');
      return;
    }

    setImageError(null);
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.esParaElaborar && (formData.precioVenta ?? 0) < (formData.precioCompra ?? 0)) {
      setVentaInvalida(true);
      return;
    }

    if (formData.esParaElaborar) {
      formData.precioVenta = formData.precioCompra;
    }

    const categoriaId = formData.esParaElaborar
      ? categories.find(c => c.esInsumo && c.denominacion.toLowerCase() === 'insumos')?.id
      : formData.categoria?.id;

    if (!categoriaId) {
      console.log('Categorías disponibles:', categories);
      alert('No se encontró la categoría "Insumos".');
      return;
    }

    const payload = {
      type: 'INSUMO',
      denominacion: formData.denominacion,
      categoria: { id: categoriaId },
      unidadMedida: { id: (formData.unidadMedida as UnidadMedida).id },
      precioCompra: formData.precioCompra,
      precioVenta: formData.precioVenta,
      stockActual: formData.stockActual,
      stockMinimo: formData.stockMinimo,
      stockMaximo: formData.stockMaximo,
      esParaElaborar: formData.esParaElaborar,
    };

    try {
      if (supply?.id) {
        // 📝 Actualizar insumo existente
        await apiClient.put(`/articuloInsumo/modificar/${supply.id}`, payload);
        console.log('Insumo actualizado:', supply.id);

        if (!formData.esParaElaborar && imageFile) {
          await uploadProductImage(Number(supply.id), imageFile, 'insumo');
        }
      } else {
        // 🆕 Crear nuevo insumo
        const res = await apiClient.post('/articuloInsumo/crear', payload);
        const created = res.data;

        console.log('Nuevo insumo creado:', created.id);

        if (!formData.esParaElaborar && imageFile) {
          await uploadProductImage(Number(created.id), imageFile, 'insumo');
        }
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error('Error guardando insumo:', error);
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-serif font-bold text-gray-800">
            {supply ? 'Editar Insumo' : 'Nuevo Insumo'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 flex items-center gap-2">
              <input
                id="esParaElaborar"
                type="checkbox"
                checked={formData.esParaElaborar}
                onChange={(e) =>
                  setFormData({ ...formData, esParaElaborar: e.target.checked })
                }
              />
              <label htmlFor="esParaElaborar" className="text-sm text-gray-700">
                Es para elaborar (no se vende directamente)
              </label>
            </div>

            <div className="md:col-span-2">
              <Input
                label="Nombre del insumo"
                value={formData.denominacion}
                onChange={(e) =>
                  setFormData({ ...formData, denominacion: e.target.value })
                }
                required
              />
            </div>

            {!formData.esParaElaborar && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                  value={formData.categoria?.id || ''}
                  onChange={(e) => {
                    const selected = categories.find(cat => cat.id === Number(e.target.value));
                    setFormData({ ...formData, categoria: selected });
                  }}
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categories
                    .filter(c => !c.esInsumo) // solo subcategorías
                    .map(category => (
                      <option key={category.id} value={category.id}>
                        {category.denominacion}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de medida</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                value={
                  formData.unidadMedida && typeof formData.unidadMedida === 'object'
                    ? formData.unidadMedida.id
                    : ''
                }
                onChange={(e) => {
                  const selected = unitOptions.find(
                    (u) => u.id === Number(e.target.value)
                  );
                  setFormData({ ...formData, unidadMedida: selected });
                }}
                required
              >
                <option value="">Seleccionar unidad</option>
                {unitOptions.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.denominacion}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Input
                label="Precio de compra"
                type="number"
                step="0.01"
                value={formData.precioCompra}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    precioCompra: parseFloat(e.target.value),
                    ...(formData.esParaElaborar && {
                      precioVenta: parseFloat(e.target.value),
                    }),
                  })
                }
                required
              />
            </div>

            {!formData.esParaElaborar && (
              <div>
                <Input
                  label="Precio de venta"
                  type="number"
                  step="0.01"
                  value={formData.precioVenta}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setFormData({ ...formData, precioVenta: val });
                    setVentaInvalida(val < (formData.precioCompra ?? 0));
                  }}
                  className={ventaInvalida ? 'border-red-500' : ''}
                  required
                />
                {ventaInvalida && (
                  <p className="text-red-500 text-sm mt-1">
                    El precio de venta no puede ser menor al precio de compra.
                  </p>
                )}
              </div>
            )}

            <div>
              <Input
                label="Stock actual"
                type="number"
                value={formData.stockActual}
                onChange={(e) =>
                  setFormData({ ...formData, stockActual: parseInt(e.target.value) })
                }
                required
              />
            </div>

            <div>
              <Input
                label="Stock mínimo"
                type="number"
                value={formData.stockMinimo}
                onChange={(e) =>
                  setFormData({ ...formData, stockMinimo: parseInt(e.target.value) })
                }
              />
            </div>

            <div>
              <Input
                label="Stock máximo"
                type="number"
                value={formData.stockMaximo}
                onChange={(e) =>
                  setFormData({ ...formData, stockMaximo: parseInt(e.target.value) })
                }
              />
            </div>
          </div>
          {!formData.esParaElaborar && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del insumo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageChange(file);
                }}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
              />
              {imageError && <p className="text-red-500 text-sm mt-1">{imageError}</p>}
              {imagePreview && (
                <div className="mt-4 flex items-center space-x-4">
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    className="w-32 h-32 object-cover rounded-md border"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300"
                    onClick={async () => {
                      if (imageInfo) {
                        try {
                          console.log('Eliminando imagen:', imageInfo);
                          await deleteImage(imageInfo.publicId, imageInfo.uuid);
                          /* setImagePreview(null);
                          setImageInfo(null);
                          setImageFile(null); */
                          alert('Imagen eliminada correctamente');
                        } catch (err) {
                          console.error('Error al eliminar imagen:', err);
                          alert('No se pudo eliminar la imagen');
                        }
                      }
                    }}
                  >
                    Eliminar imagen
                  </Button>
                </div>
              )}
            </div>
          )}


          <div className="mt-6 flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={ventaInvalida}>Guardar</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplyModal;
