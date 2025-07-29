import React, { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface SubcategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: { denominacion: string; esInsumo: boolean; id?: number },
    parentCategoryId: number
  ) => void;
  categories: Array<{ id: number; denominacion: string }>;
  selectedParentCategory: number | null;
  setSelectedParentCategory: (id: number) => void;
  initialData?: { id: number; denominacion: string; categoriaId: number };
}

const SubcategoryModal: React.FC<SubcategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  selectedParentCategory,
  setSelectedParentCategory,
  initialData,
}) => {
  const [form, setForm] = useState<{ denominacion: string }>({ denominacion: '' });

  useEffect(() => {
    if (initialData) {
      setForm({ denominacion: initialData.denominacion });
      setSelectedParentCategory(initialData.categoriaId);
    } else {
      setForm({ denominacion: '' });
    }
  }, [initialData, setSelectedParentCategory]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleParentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedParentCategory(Number(e.target.value));
  };

  const handleSubmit = () => {
    if (!form.denominacion || selectedParentCategory === null) return;

    const subcategoryPayload = {
      denominacion: form.denominacion,
      esInsumo: false,
      ...(initialData?.id && { id: initialData.id }),
    };

    onSave(subcategoryPayload, selectedParentCategory);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
        <div className="bg-white rounded-lg p-6 z-50 max-w-md w-full mx-auto shadow-lg relative">
          <Dialog.Title className="text-lg font-bold mb-4">
            {initialData ? 'Editar Subcategoría' : 'Nueva Subcategoría'}
          </Dialog.Title>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Categoría Padre
              <select
                className="mt-1 block w-full border border-gray-300 rounded-md"
                value={selectedParentCategory ?? ''}
                onChange={handleParentChange}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.denominacion}
                  </option>
                ))}
              </select>
            </label>

            <Input
              label="Denominación"
              name="denominacion"
              value={form.denominacion}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {initialData ? 'Guardar Cambios' : 'Crear'}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default SubcategoryModal;
