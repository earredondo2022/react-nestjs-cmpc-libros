import React, { useState, useEffect } from 'react';

// Add keyframe animation for loading spinner
const spinKeyframes = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Inject the keyframes into the document head
if (!document.querySelector('#spin-animation')) {
  const style = document.createElement('style');
  style.id = 'spin-animation';
  style.textContent = spinKeyframes;
  document.head.appendChild(style);
}

interface Author {
  id: string;
  name: string;
}

interface Publisher {
  id: string;
  name: string;
}

interface Genre {
  id: string;
  name: string;
}

interface Book {
  id?: string;
  title: string;
  isbn?: string;
  price: number;
  stockQuantity: number;
  isAvailable: boolean;
  publicationDate?: string;
  pages?: number;
  description?: string;
  imageUrl?: string;
  authorId?: string;
  publisherId?: string;
  genreId?: string;
}

interface BookFormProps {
  book?: Book;
  onSave: () => void;
  onCancel: () => void;
}

interface FormErrors {
  title?: string;
  isbn?: string;
  price?: string;
  stockQuantity?: string;
  authorId?: string;
  publisherId?: string;
  genreId?: string;
  publicationDate?: string;
  pages?: string;
  imageUrl?: string;
  description?: string;
  image?: string;
}

export const BookForm: React.FC<BookFormProps> = ({ book, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Book>({
    title: '',
    isbn: '',
    price: 0,
    stockQuantity: 0,
    isAvailable: true,
    publicationDate: '',
    pages: 0,
    description: '',
    imageUrl: '',
    authorId: '',
    publisherId: '',
    genreId: '',
    ...book
  });

  const [authors, setAuthors] = useState<Author[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchSelectOptions();
    
    // Actualizar formData cuando cambie el book prop
    if (book) {
      const newFormData = {
        title: book.title || '',
        isbn: book.isbn || '',
        price: book.price || 0,
        stockQuantity: book.stockQuantity || 0,
        isAvailable: book.isAvailable ?? true,
        publicationDate: book.publicationDate || '',
        pages: book.pages || 0,
        description: book.description || '',
        imageUrl: book.imageUrl || '',
        authorId: book.authorId || '',
        publisherId: book.publisherId || '',
        genreId: book.genreId || '',
      };
      setFormData(newFormData);
      setSelectedImage(null); // Clear any selected file
    } else {
      // Reset form for new book
      setFormData({
        title: '',
        isbn: '',
        price: 0,
        stockQuantity: 0,
        isAvailable: true,
        publicationDate: '',
        pages: 0,
        description: '',
        imageUrl: '',
        authorId: '',
        publisherId: '',
        genreId: '',
      });
      setSelectedImage(null);
    }
  }, [book]);

  // Efecto separado para manejar la imagen cuando cambie formData.imageUrl
  useEffect(() => {
    if (formData.imageUrl && !selectedImage) {
      const imageUrl = formData.imageUrl.startsWith('/uploads') 
        ? `http://localhost:3001${formData.imageUrl}`
        : formData.imageUrl;
      
      setImagePreview(imageUrl);
    } else if (!formData.imageUrl && !selectedImage) {
      setImagePreview(null);
    }
  }, [formData.imageUrl, selectedImage]);

  // Función de validación reactiva
  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case 'title':
        if (!value || value.trim().length === 0) {
          return 'El título es requerido';
        }
        if (value.trim().length < 3) {
          return 'El título debe tener al menos 3 caracteres';
        }
        if (value.trim().length > 500) {
          return 'El título no puede exceder 500 caracteres';
        }
        break;
      
      case 'isbn':
        if (value && value.trim().length > 0) {
          const isbnRegex = /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/;
          if (!isbnRegex.test(value.trim().replace(/[-\s]/g, ''))) {
            return 'Formato de ISBN inválido';
          }
        }
        break;
      
      case 'price':
        const priceNum = parseFloat(value);
        if (isNaN(priceNum) || priceNum < 0) {
          return 'El precio debe ser un número mayor o igual a 0';
        }
        if (priceNum > 999999.99) {
          return 'El precio no puede exceder $999,999.99';
        }
        break;
      
      case 'stockQuantity':
        const stockNum = parseInt(value);
        if (isNaN(stockNum) || stockNum < 0) {
          return 'La cantidad en stock es requerida y debe ser mayor o igual a 0';
        }
        if (stockNum > 999999) {
          return 'La cantidad no puede exceder 999,999 unidades';
        }
        break;
      
      case 'pages':
        if (value && value.toString().trim().length > 0) {
          const pagesNum = parseInt(value);
          if (isNaN(pagesNum) || pagesNum < 1) {
            return 'El número de páginas debe ser mayor a 0';
          }
          if (pagesNum > 50000) {
            return 'El número de páginas no puede exceder 50,000';
          }
        }
        break;
      
      case 'imageUrl':
        if (value && value.trim().length > 0) {
          // Permitir URLs completas o rutas locales que empiecen con /uploads/
          const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
          const localPathRegex = /^\/uploads\/[\w\-\.]+\.(jpg|jpeg|png|webp)$/i;
          
          if (!urlRegex.test(value.trim()) && !localPathRegex.test(value.trim())) {
            return 'URL de imagen inválida';
          }
        }
        break;
      
      case 'description':
        if (value && value.trim().length > 2000) {
          return 'La descripción no puede exceder 2000 caracteres';
        }
        break;
      
      default:
        break;
    }
    return undefined;
  };

  // Función para validar todo el formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Validar campos requeridos
    newErrors.title = validateField('title', formData.title);
    newErrors.price = validateField('price', formData.price);
    newErrors.stockQuantity = validateField('stockQuantity', formData.stockQuantity);
    
    // Validar campos opcionales
    if (formData.isbn) newErrors.isbn = validateField('isbn', formData.isbn);
    if (formData.pages) newErrors.pages = validateField('pages', formData.pages);
    if (formData.imageUrl) newErrors.imageUrl = validateField('imageUrl', formData.imageUrl);
    if (formData.description) newErrors.description = validateField('description', formData.description);
    
    // Validar imagen
    if (selectedImage) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (allowedTypes.indexOf(selectedImage.type) === -1) {
        newErrors.image = 'Solo se permiten archivos JPG, PNG y WebP';
      } else if (selectedImage.size > 5 * 1024 * 1024) { // 5MB
        newErrors.image = 'La imagen no puede exceder 5MB';
      }
    }
    
    // Filtrar errores undefined
    Object.keys(newErrors).forEach(key => {
      if (newErrors[key as keyof FormErrors] === undefined) {
        delete newErrors[key as keyof FormErrors];
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Función para manejar la selección de imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      
      // Limpiar URL de imagen si existe
      if (formData.imageUrl) {
        setFormData(prev => ({ ...prev, imageUrl: '' }));
      }
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Validar imagen inmediatamente
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (allowedTypes.indexOf(file.type) === -1) {
        setErrors(prev => ({ ...prev, image: 'Solo se permiten archivos JPG, PNG y WebP' }));
      } else if (file.size > 5 * 1024 * 1024) { // 5MB
        setErrors(prev => ({ ...prev, image: 'La imagen no puede exceder 5MB' }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.image;
          return newErrors;
        });
      }
    } else {
      // Si no hay archivo seleccionado, limpiar todo
      setSelectedImage(null);
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.image;
        return newErrors;
      });
    }
  };

  const fetchSelectOptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const [authorsRes, publishersRes, genresRes] = await Promise.all([
        fetch('http://localhost:3001/api/authors', { headers }),
        fetch('http://localhost:3001/api/publishers', { headers }),
        fetch('http://localhost:3001/api/genres', { headers })
      ]);

      if (authorsRes.ok) setAuthors(await authorsRes.json());
      if (publishersRes.ok) setPublishers(await publishersRes.json());
      if (genresRes.ok) setGenres(await genresRes.json());
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validar formulario antes de enviar
    if (!validateForm()) {
      setLoading(false);
      setError('Por favor, corrige los errores en el formulario');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = book?.id 
        ? `http://localhost:3001/api/books/${book.id}`
        : 'http://localhost:3001/api/books';
      
      const method = book?.id ? 'PATCH' : 'POST';

      // Crear FormData para manejar imagen
      const formDataToSend = new FormData();
      
      // Agregar campos del formulario
      formDataToSend.append('title', formData.title);
      if (formData.isbn?.trim()) formDataToSend.append('isbn', formData.isbn.trim());
      formDataToSend.append('price', formData.price.toString());
      formDataToSend.append('stockQuantity', formData.stockQuantity.toString());
      formDataToSend.append('isAvailable', formData.isAvailable.toString());
      
      if (formData.publicationDate?.trim()) {
        formDataToSend.append('publicationDate', formData.publicationDate.trim());
      }
      if (formData.pages && formData.pages > 0) {
        formDataToSend.append('pages', formData.pages.toString());
      }
      if (formData.description?.trim()) {
        formDataToSend.append('description', formData.description.trim());
      }
      if (formData.authorId) formDataToSend.append('authorId', formData.authorId);
      if (formData.publisherId) formDataToSend.append('publisherId', formData.publisherId);
      if (formData.genreId) formDataToSend.append('genreId', formData.genreId);
      
      // Manejar imagen: archivo tiene prioridad sobre URL
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      } else if (formData.imageUrl?.trim()) {
        formDataToSend.append('imageUrl', formData.imageUrl.trim());
      } else if (book?.id) {
        // Para edición: si no hay imagen nueva ni URL, enviar string vacío para limpiar
        formDataToSend.append('imageUrl', '');
      }
      // Para libros nuevos sin imagen, no agregar ningún campo de imagen

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          // No agregar Content-Type para FormData
        },
        body: formDataToSend,
      });

      if (response.ok) {
        onSave();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al guardar el libro');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    // Si es el campo imageUrl y hay una imagen seleccionada, limpiar la imagen seleccionada
    if (name === 'imageUrl' && selectedImage) {
      setSelectedImage(null);
    }
    
    // Actualizar formData
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Validación reactiva
    const fieldError = validateField(name, newValue);
    setErrors(prev => {
      const newErrors = { ...prev };
      if (fieldError) {
        newErrors[name as keyof FormErrors] = fieldError;
      } else {
        delete newErrors[name as keyof FormErrors];
      }
      return newErrors;
    });
  };

  // Componente helper para mostrar errores
  const ErrorMessage = ({ error }: { error?: string }) => {
    if (!error) return null;
    return (
      <p style={{
        color: '#dc2626',
        fontSize: '0.75rem',
        marginTop: '0.25rem',
        display: 'flex',
        alignItems: 'center'
      }}>
        <span style={{ marginRight: '0.25rem' }}>⚠️</span>
        {error}
      </p>
    );
  };

  return (
    <div className="max-w-4xl mx-auto" style={{
      maxWidth: '56rem',
      margin: '0 auto',
      padding: '1rem',
      boxSizing: 'border-box',
      width: '100%'
    }}>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4" style={{
          background: 'linear-gradient(to right, #2563eb, #4f46e5)',
          padding: '1rem 1.5rem'
        }}>
          <h2 className="text-xl font-bold text-white flex items-center" style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            margin: 0
          }}>
            <span className="mr-2" style={{ marginRight: '0.5rem' }}>
              {book?.id ? '✏️' : '➕'}
            </span>
            {book?.id ? 'Editar Libro' : 'Agregar Nuevo Libro'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6" style={{
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg" style={{
              backgroundColor: '#fef2f2',
              borderLeft: '4px solid #f87171',
              padding: '1rem',
              borderRadius: '0 0.5rem 0.5rem 0'
            }}>
              <div className="flex" style={{ display: 'flex', alignItems: 'center' }}>
                <span className="mr-2" style={{ marginRight: '0.5rem' }}>❌</span>
                <p className="text-red-700" style={{
                  color: '#b91c1c',
                  margin: 0,
                  fontSize: '0.875rem'
                }}>{error}</p>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
            alignItems: 'start',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ marginBottom: '1rem', width: '100%', boxSizing: 'border-box' }}>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.75rem'
              }}>
                Título *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ingresa el título del libro"
                style={{
                  display: 'block',
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  padding: '0.5rem 0.75rem',
                  border: `1px solid ${errors.title ? '#dc2626' : '#d1d5db'}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = errors.title ? '#dc2626' : '#3b82f6';
                  e.target.style.boxShadow = `0 0 0 3px rgba(${errors.title ? '220, 38, 38' : '59, 130, 246'}, 0.1)`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.title ? '#dc2626' : '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <ErrorMessage error={errors.title} />
            </div>

            <div style={{ marginBottom: '1rem', width: '100%', boxSizing: 'border-box' }}>
              <label htmlFor="isbn" className="block text-sm font-semibold text-gray-700 mb-2" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.75rem'
              }}>
                ISBN
              </label>
              <input
                type="text"
                id="isbn"
                name="isbn"
                value={formData.isbn}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="978-XXXXXXXXXX"
                style={{
                  display: 'block',
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem', width: '100%', boxSizing: 'border-box' }}>
              <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-2" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.75rem'
              }}>
                Precio *
              </label>
              <div className="relative" style={{ position: 'relative' }}>
                <span className="absolute left-3 top-2 text-gray-500" style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '0.5rem',
                  color: '#6b7280',
                  fontSize: '0.875rem'
                }}>$</span>
                <input
                  type="number"
                  id="price"
                  name="price"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  style={{
                    display: 'block',
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    paddingLeft: '1.75rem',
                    paddingRight: '0.75rem',
                    paddingTop: '0.5rem',
                    paddingBottom: '0.5rem',
                    border: `1px solid ${errors.price ? '#dc2626' : '#d1d5db'}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = errors.price ? '#dc2626' : '#3b82f6';
                    e.target.style.boxShadow = `0 0 0 3px rgba(${errors.price ? '220, 38, 38' : '59, 130, 246'}, 0.1)`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.price ? '#dc2626' : '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <ErrorMessage error={errors.price} />
              </div>
            </div>

            <div style={{ marginBottom: '1rem', width: '100%', boxSizing: 'border-box' }}>
              <label htmlFor="stockQuantity" className="block text-sm font-semibold text-gray-700 mb-2" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.75rem'
              }}>
                Cantidad en Stock *
              </label>
              <input
                type="number"
                id="stockQuantity"
                name="stockQuantity"
                required
                min="0"
                value={formData.stockQuantity}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 10"
                style={{
                  display: 'block',
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  padding: '0.5rem 0.75rem',
                  border: `1px solid ${errors.stockQuantity ? '#dc2626' : '#d1d5db'}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = errors.stockQuantity ? '#dc2626' : '#3b82f6';
                  e.target.style.boxShadow = `0 0 0 3px rgba(${errors.stockQuantity ? '220, 38, 38' : '59, 130, 246'}, 0.1)`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.stockQuantity ? '#dc2626' : '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <ErrorMessage error={errors.stockQuantity} />
            </div>

            <div style={{ marginBottom: '1rem', width: '100%', boxSizing: 'border-box' }}>
              <label htmlFor="authorId" className="block text-sm font-semibold text-gray-700 mb-2" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.75rem'
              }}>
                Autor
              </label>
              <select
                id="authorId"
                name="authorId"
                value={formData.authorId}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{
                  display: 'block',
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  backgroundColor: 'white',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="">Seleccionar autor</option>
                {authors.map(author => (
                  <option key={author.id} value={author.id}>{author.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem', width: '100%', boxSizing: 'border-box' }}>
              <label htmlFor="publisherId" className="block text-sm font-semibold text-gray-700 mb-2" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.75rem'
              }}>
                Editorial
              </label>
              <select
                id="publisherId"
                name="publisherId"
                value={formData.publisherId}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{
                  display: 'block',
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  backgroundColor: 'white',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="">Seleccionar editorial</option>
                {publishers.map(publisher => (
                  <option key={publisher.id} value={publisher.id}>{publisher.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem', width: '100%', boxSizing: 'border-box' }}>
              <label htmlFor="genreId" className="block text-sm font-semibold text-gray-700 mb-2" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.75rem'
              }}>
                Género
              </label>
              <select
                id="genreId"
                name="genreId"
                value={formData.genreId}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{
                  display: 'block',
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  backgroundColor: 'white',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="">Seleccionar género</option>
                {genres.map(genre => (
                  <option key={genre.id} value={genre.id}>{genre.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem', width: '100%', boxSizing: 'border-box' }}>
              <label htmlFor="publicationDate" className="block text-sm font-semibold text-gray-700 mb-2" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.75rem'
              }}>
                Fecha de Publicación
              </label>
              <input
                type="date"
                id="publicationDate"
                name="publicationDate"
                value={formData.publicationDate}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{
                  display: 'block',
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem', width: '100%', boxSizing: 'border-box' }}>
              <label htmlFor="pages" className="block text-sm font-semibold text-gray-700 mb-2" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.75rem'
              }}>
                Número de Páginas
              </label>
              <input
                type="number"
                id="pages"
                name="pages"
                min="1"
                value={formData.pages || ''}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                style={{
                  display: 'block',
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Image Upload Section */}
          <div style={{ marginBottom: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
            <label className="block text-sm font-semibold text-gray-700 mb-2" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.75rem'
            }}>
              Imagen del Libro
            </label>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '1.5rem',
              alignItems: 'start'
            }}>
              {/* File Upload */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1" style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  marginBottom: '0.5rem'
                }}>
                  Subir archivo (JPG, PNG, WebP - máx. 5MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  style={{
                    display: 'block',
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    padding: '0.5rem 0.75rem',
                    border: `1px solid ${errors.image ? '#dc2626' : '#d1d5db'}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    backgroundColor: '#f9fafb',
                    cursor: 'pointer'
                  }}
                />
                <ErrorMessage error={errors.image} />
                
                {/* Campo URL oculto pero funcional para libros existentes */}
                <input
                  type="hidden"
                  name="imageUrl"
                  value={formData.imageUrl}
                />
              </div>
              
              {/* Image Preview */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1" style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  marginBottom: '0.5rem'
                }}>
                  {book?.id ? 'Imagen actual' : 'Vista previa'}
                </label>
                <div style={{
                  width: '100%',
                  height: '200px',
                  border: '2px dashed #d1d5db',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f9fafb',
                  overflow: 'hidden'
                }}>
                  {(() => {
                    return imagePreview ? (
                      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <img 
                          src={imagePreview} 
                          alt={book?.id ? 'Imagen actual del libro' : 'Vista previa'}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '0.25rem'
                          }}
                          onError={(e) => {
                            setImagePreview(null);
                            if (!selectedImage) {
                              setFormData(prev => ({ ...prev, imageUrl: '' }));
                            }
                          }}
                          onLoad={() => {
                            // Image loaded successfully
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: '0.25rem',
                          left: '0.25rem',
                          right: '0.25rem',
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          color: 'white',
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          textAlign: 'center'
                        }}>
                          {selectedImage ? '📁 Nuevo archivo seleccionado' : 
                           book?.id ? '🖼️ Imagen actual' : '🌐 URL externa'}
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        textAlign: 'center',
                        color: '#9ca3af',
                        padding: '1rem'
                      }}>
                        <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📚</span>
                        <span style={{ fontSize: '0.875rem' }}>
                          {selectedImage ? 'Procesando imagen...' : 
                           formData.imageUrl ? 'Cargando imagen...' : 
                           book?.id ? 'Este libro no tiene imagen' : 'Sin imagen seleccionada'}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                
                {(selectedImage || (formData.imageUrl && imagePreview)) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                      setFormData(prev => ({ ...prev, imageUrl: '' }));
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.image;
                        delete newErrors.imageUrl;
                        return newErrors;
                      });
                      // Limpiar el input file
                      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.75rem',
                      color: '#dc2626',
                      backgroundColor: 'transparent',
                      border: '1px solid #dc2626',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    🗑️ {book?.id ? 'Quitar imagen actual' : 'Quitar imagen'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.75rem'
            }}>
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descripción del libro..."
              style={{
                display: 'block',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                outline: 'none',
                resize: 'vertical',
                minHeight: '100px',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Availability */}
          <div className="flex items-center" style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <input
              type="checkbox"
              id="isAvailable"
              name="isAvailable"
              checked={formData.isAvailable}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              style={{
                height: '1rem',
                width: '1rem',
                accentColor: '#3b82f6',
                borderRadius: '0.25rem'
              }}
            />
            <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-700" style={{
              marginLeft: '0.5rem',
              display: 'block',
              fontSize: '0.875rem',
              color: '#374151'
            }}>
              Libro disponible para venta
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200" style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors duration-200"
              style={{
                padding: '0.5rem 1.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                color: '#374151',
                backgroundColor: 'white',
                fontWeight: '500',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              style={{
                padding: '0.5rem 1.5rem',
                background: loading ? '#9ca3af' : 'linear-gradient(to right, #2563eb, #4f46e5)',
                color: 'white',
                borderRadius: '0.5rem',
                fontWeight: '500',
                fontSize: '0.875rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'linear-gradient(to right, #1d4ed8, #4338ca)';
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'linear-gradient(to right, #2563eb, #4f46e5)';
                }
              }}
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2" style={{ 
                    marginRight: '0.5rem',
                    display: 'inline-block',
                    animation: 'spin 1s linear infinite'
                  }}>⏳</span>
                  Guardando...
                </>
              ) : (
                <>
                  <span className="mr-2" style={{ marginRight: '0.5rem' }}>💾</span>
                  {book?.id ? 'Actualizar' : 'Guardar'} Libro
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};