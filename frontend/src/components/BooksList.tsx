import React, { useState, useEffect, useCallback } from 'react';

interface Book {
  id: string;
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
  createdAt: string;
  updatedAt: string;
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

interface BooksListProps {
  onAddBook: () => void;
  onEditBook: (book: Book) => void;
}

interface ApiResponse {
  books: Book[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Filters {
  title: string;
  authorId: string;
  publisherId: string;
  genreId: string;
  isAvailable: string;
}

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export const BooksList: React.FC<BooksListProps> = ({ onAddBook, onEditBook }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<number | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Filters
  const [filters, setFilters] = useState<Filters>({
    title: '',
    authorId: '',
    publisherId: '',
    genreId: '',
    isAvailable: ''
  });
  
  // Sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'createdAt',
    direction: 'desc'
  });
  
  // Search debounce
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback((newFilters: Filters) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = window.setTimeout(() => {
      setCurrentPage(1);
      fetchBooks(newFilters, sortConfig, 1, pageSize);
    }, 500);
    
    setSearchTimeout(timeout);
  }, [searchTimeout, sortConfig, pageSize]);

  useEffect(() => {
    fetchAuthors();
    fetchPublishers();
    fetchGenres();
  }, []);

  useEffect(() => {
    fetchBooks(filters, sortConfig, currentPage, pageSize);
  }, [currentPage, pageSize, sortConfig]);

  const fetchBooks = async (
    currentFilters: Filters = filters,
    currentSort: SortConfig = sortConfig,
    page: number = currentPage,
    limit: number = pageSize
  ) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      params.append('sortBy', currentSort.field);
      params.append('sortOrder', currentSort.direction);
      
      if (currentFilters.title) params.append('title', currentFilters.title);
      if (currentFilters.authorId) params.append('authorId', currentFilters.authorId);
      if (currentFilters.publisherId) params.append('publisherId', currentFilters.publisherId);
      if (currentFilters.genreId) params.append('genreId', currentFilters.genreId);
      if (currentFilters.isAvailable) params.append('isAvailable', currentFilters.isAvailable);

      const response = await fetch(`http://localhost:3001/api/books?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: ApiResponse = await response.json();
        setBooks(data.books || []);
        setTotalBooks(data.total || 0);
        setTotalPages(Math.ceil((data.total || 0) / limit));
      } else {
        setError('Error al cargar los libros');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/authors', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data: Author[] = await response.json();
        setAuthors(data);
      }
    } catch (error) {
      console.error('Error loading authors:', error);
    }
  };

  const fetchPublishers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/publishers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data: Publisher[] = await response.json();
        setPublishers(data);
      }
    } catch (error) {
      console.error('Error loading publishers:', error);
    }
  };

  const fetchGenres = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/genres', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data: Genre[] = await response.json();
        setGenres(data);
      }
    } catch (error) {
      console.error('Error loading genres:', error);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    debouncedSearch(newFilters);
  };

  const handleSort = (field: string) => {
    const newDirection: 'asc' | 'desc' = sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    const newSortConfig = { field, direction: newDirection };
    setSortConfig(newSortConfig);
  };

  const getAuthorName = (authorId?: string) => {
    if (!authorId) return 'N/A';
    const author = authors.find(a => a.id === authorId);
    return author?.name || 'N/A';
  };

  const getPublisherName = (publisherId?: string) => {
    if (!publisherId) return 'N/A';
    const publisher = publishers.find(p => p.id === publisherId);
    return publisher?.name || 'N/A';
  };

  const getGenreName = (genreId?: string) => {
    if (!genreId) return 'N/A';
    const genre = genres.find(g => g.id === genreId);
    return genre?.name || 'N/A';
  };

  const handleMouseEnter = (book: Book) => {
    // Cancelar cualquier timeout previo
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    
    // Mostrar el modal después de un pequeño delay
    const timeout = window.setTimeout(() => {
      setSelectedBook(book);
      setShowDetails(true);
    }, 300); // Reducido a 300ms para mejor experiencia
    
    setHoverTimeout(timeout);
  };

  const handleMouseLeave = () => {
    // Cancelar el timeout si el mouse sale antes de que se abra
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    
    // Si el modal está abierto, programar el cierre automático
    if (showDetails) {
      const closeTimeout = window.setTimeout(() => {
        handleCloseDetails();
      }, 2000); // Se cierra después de 2 segundos
      
      setHoverTimeout(closeTimeout);
    }
  };

  const handleModalMouseEnter = () => {
    // Cancelar el cierre automático cuando el mouse entra al modal
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  };

  const handleModalMouseLeave = () => {
    // Cerrar el modal cuando el mouse sale del modal
    const closeTimeout = window.setTimeout(() => {
      handleCloseDetails();
    }, 1000); // 1 segundo de delay antes de cerrar
    
    setHoverTimeout(closeTimeout);
  };

  const handleCloseDetails = () => {
    setSelectedBook(null);
    setShowDetails(false);
    // Limpiar cualquier timeout pendiente
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  };

  const handleDelete = async (book: Book) => {
    const confirmMessage = `¿Estás seguro de que deseas eliminar el libro "${book.title}"?\n\nEsta acción no se puede deshacer.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/books/${book.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Recargar la lista de libros después de eliminar
        fetchBooks(filters, sortConfig, currentPage, pageSize);
        
        // Mostrar mensaje de éxito (opcional)
        console.log(`Libro "${book.title}" eliminado exitosamente`);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al eliminar el libro');
      }
    } catch (error) {
      setError('Error de conexión al eliminar el libro');
      console.error('Error deleting book:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return undefined;
    if (imageUrl.startsWith('/uploads/')) {
      return `http://localhost:3001${imageUrl}`;
    }
    return imageUrl;
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortConfig.field !== field) {
      return <span className="text-gray-400">↕️</span>;
    }
    return sortConfig.direction === 'asc' ? 
      <span className="text-blue-600">↑</span> : 
      <span className="text-blue-600">↓</span>;
  };

  if (loading && books.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={() => fetchBooks()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="p-6" style={{ 
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6" style={{
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 className="text-3xl font-bold text-gray-800" style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '0.25rem'
          }}>Gestión de Libros</h1>
          <p className="text-gray-600 mt-1" style={{
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            {totalBooks} libro{totalBooks !== 1 ? 's' : ''} encontrado{totalBooks !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onAddBook}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '0.5rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
        >
          <span>+</span>
          Agregar Libro
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6" style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        padding: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="text-lg font-semibold text-gray-800" style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#1f2937',
            margin: 0
          }}>Filtros de Búsqueda</h3>
          <p style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            margin: 0,
            fontStyle: 'italic'
          }}>💡 Pasa el mouse sobre el título de un libro para ver sus detalles</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {/* Title Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.25rem'
            }}>Título</label>
            <input
              type="text"
              placeholder="Buscar por título..."
              value={filters.title}
              onChange={(e) => handleFilterChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Author Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.25rem'
            }}>Autor</label>
            <select
              value={filters.authorId}
              onChange={(e) => handleFilterChange('authorId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            >
              <option value="">Todos los autores</option>
              {authors.map(author => (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              ))}
            </select>
          </div>

          {/* Publisher Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.25rem'
            }}>Editorial</label>
            <select
              value={filters.publisherId}
              onChange={(e) => handleFilterChange('publisherId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            >
              <option value="">Todas las editoriales</option>
              {publishers.map(publisher => (
                <option key={publisher.id} value={publisher.id}>
                  {publisher.name}
                </option>
              ))}
            </select>
          </div>

          {/* Genre Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.25rem'
            }}>Género</label>
            <select
              value={filters.genreId}
              onChange={(e) => handleFilterChange('genreId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            >
              <option value="">Todos los géneros</option>
              {genres.map(genre => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.25rem'
            }}>Disponibilidad</label>
            <select
              value={filters.isAvailable}
              onChange={(e) => handleFilterChange('isAvailable', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            >
              <option value="">Todos</option>
              <option value="true">Disponibles</option>
              <option value="false">No disponibles</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <div className="overflow-x-auto" style={{ overflowX: 'auto' }}>
          <table className="min-w-full divide-y divide-gray-200" style={{
            minWidth: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead className="bg-gray-50" style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('title')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                >
                  <div className="flex items-center space-x-1" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>Título</span>
                    <SortIcon field="title" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('authorId')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                >
                  <div className="flex items-center space-x-1" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>Autor</span>
                    <SortIcon field="authorId" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('publisherId')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                >
                  <div className="flex items-center space-x-1" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>Editorial</span>
                    <SortIcon field="publisherId" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('genreId')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                >
                  <div className="flex items-center space-x-1" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>Género</span>
                    <SortIcon field="genreId" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('price')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                >
                  <div className="flex items-center space-x-1" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>Precio</span>
                    <SortIcon field="price" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('stockQuantity')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                >
                  <div className="flex items-center space-x-1" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>Stock</span>
                    <SortIcon field="stockQuantity" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('isAvailable')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                >
                  <div className="flex items-center space-x-1" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>Estado</span>
                    <SortIcon field="isAvailable" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{
                  padding: '0.75rem 1.5rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200" style={{
              backgroundColor: 'white'
            }}>
              {books.map((book) => (
                <tr key={book.id} className="hover:bg-gray-50" style={{
                  transition: 'background-color 0.2s'
                }} 
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                  <td className="px-6 py-4 whitespace-nowrap" style={{
                    padding: '1rem 1.5rem',
                    whiteSpace: 'nowrap'
                  }}>
                    <div>
                      <div 
                        className="text-sm font-medium text-gray-900" 
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#111827',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          borderRadius: '0.25rem',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={() => handleMouseEnter(book)}
                        onMouseLeave={handleMouseLeave}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#eff6ff';
                          e.currentTarget.style.color = '#2563eb';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#111827';
                        }}
                      >
                        {book.title}
                      </div>
                      {book.isbn && (
                        <div className="text-sm text-gray-500" style={{
                          fontSize: '0.875rem',
                          color: '#6b7280'
                        }}>ISBN: {book.isbn}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{
                    padding: '1rem 1.5rem',
                    whiteSpace: 'nowrap',
                    fontSize: '0.875rem',
                    color: '#111827'
                  }}>
                    {getAuthorName(book.authorId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{
                    padding: '1rem 1.5rem',
                    whiteSpace: 'nowrap',
                    fontSize: '0.875rem',
                    color: '#111827'
                  }}>
                    {getPublisherName(book.publisherId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{
                    padding: '1rem 1.5rem',
                    whiteSpace: 'nowrap',
                    fontSize: '0.875rem',
                    color: '#111827'
                  }}>
                    {getGenreName(book.genreId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{
                    padding: '1rem 1.5rem',
                    whiteSpace: 'nowrap',
                    fontSize: '0.875rem',
                    color: '#111827'
                  }}>
                    ${book.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{
                    padding: '1rem 1.5rem',
                    whiteSpace: 'nowrap',
                    fontSize: '0.875rem',
                    color: '#111827'
                  }}>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      book.stockQuantity > 5 
                        ? 'bg-green-100 text-green-800' 
                        : book.stockQuantity > 0 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-red-100 text-red-800'
                    }`} style={{
                      display: 'inline-flex',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      borderRadius: '9999px',
                      backgroundColor: book.stockQuantity > 5 ? '#dcfce7' : book.stockQuantity > 0 ? '#fef3c7' : '#fee2e2',
                      color: book.stockQuantity > 5 ? '#166534' : book.stockQuantity > 0 ? '#92400e' : '#991b1b'
                    }}>
                      {book.stockQuantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" style={{
                    padding: '1rem 1.5rem',
                    whiteSpace: 'nowrap'
                  }}>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      book.isAvailable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`} style={{
                      display: 'inline-flex',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      borderRadius: '9999px',
                      backgroundColor: book.isAvailable ? '#dcfce7' : '#fee2e2',
                      color: book.isAvailable ? '#166534' : '#991b1b'
                    }}>
                      {book.isAvailable ? 'Disponible' : 'No disponible'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{
                    padding: '1rem 1.5rem',
                    whiteSpace: 'nowrap',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    <div className="flex space-x-2" style={{
                      display: 'flex',
                      gap: '0.5rem'
                    }}>
                      <button
                        onClick={() => onEditBook(book)}
                        className="text-blue-600 hover:text-blue-900 px-3 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                        style={{
                          color: '#2563eb',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.25rem',
                          backgroundColor: '#eff6ff',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.color = '#1e40af';
                          e.currentTarget.style.backgroundColor = '#dbeafe';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.color = '#2563eb';
                          e.currentTarget.style.backgroundColor = '#eff6ff';
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(book)}
                        className="text-red-600 hover:text-red-900 px-3 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
                        style={{
                          color: '#dc2626',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.25rem',
                          backgroundColor: '#fef2f2',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.color = '#991b1b';
                          e.currentTarget.style.backgroundColor = '#fee2e2';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.color = '#dc2626';
                          e.currentTarget.style.backgroundColor = '#fef2f2';
                        }}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {books.length === 0 && !loading && (
          <div className="text-center py-12" style={{
            textAlign: 'center',
            padding: '3rem 0'
          }}>
            <p className="text-gray-500" style={{
              color: '#6b7280',
              fontSize: '1rem'
            }}>No se encontraron libros con los filtros aplicados</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between" style={{
          marginTop: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div className="flex items-center space-x-2" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span className="text-sm text-gray-700" style={{
              fontSize: '0.875rem',
              color: '#374151'
            }}>
              Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, totalBooks)} de {totalBooks} resultados
            </span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              style={{
                padding: '0.25rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            >
              <option value={5}>5 por página</option>
              <option value={10}>10 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: currentPage === 1 ? '#9ca3af' : '#6b7280',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1,
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseOut={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              Anterior
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              const isCurrentPage = currentPage === pageNumber;
              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    isCurrentPage
                      ? 'text-blue-600 bg-blue-50 border border-blue-300'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                  style={{
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    borderRadius: '0.375rem',
                    border: `1px solid ${isCurrentPage ? '#93c5fd' : '#d1d5db'}`,
                    backgroundColor: isCurrentPage ? '#eff6ff' : 'white',
                    color: isCurrentPage ? '#2563eb' : '#6b7280',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => {
                    if (!isCurrentPage) {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isCurrentPage) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  {pageNumber}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: currentPage === totalPages ? '#9ca3af' : '#6b7280',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.5 : 1,
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseOut={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal para mostrar detalles del libro */}
      {showDetails && selectedBook && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={handleCloseDetails}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '2rem',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={handleModalMouseEnter}
            onMouseLeave={handleModalMouseLeave}
          >
            {/* Header del modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: '#1f2937',
                margin: 0
              }}>
                Detalles del Libro
              </h2>
              <button
                onClick={handleCloseDetails}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                ✕
              </button>
            </div>

            {/* Contenido del modal */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
              {/* Imagen del libro */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img
                  src={getImageUrl(selectedBook.imageUrl)}
                  alt={selectedBook.title}
                  style={{
                    width: '200px',
                    height: '280px',
                    objectFit: 'cover',
                    borderRadius: '0.5rem',
                    border: '2px solid #e5e7eb',
                    marginBottom: '1rem'
                  }}
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/200x280?text=Sin+Imagen';
                  }}
                />
                {selectedBook.imageUrl && (
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280', 
                    textAlign: 'center',
                    margin: 0
                  }}>
                    URL: {selectedBook.imageUrl}
                  </p>
                )}
              </div>

              {/* Información del libro */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Título */}
                <div>
                  <h3 style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: '600', 
                    color: '#1f2937',
                    margin: '0 0 0.5rem 0'
                  }}>
                    {selectedBook.title}
                  </h3>
                  <p style={{ 
                    fontSize: '1rem', 
                    color: '#6b7280',
                    margin: 0
                  }}>
                    ISBN: {selectedBook.isbn || 'No especificado'}
                  </p>
                </div>

                {/* Grid de información básica */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '600', 
                      color: '#374151',
                      display: 'block',
                      marginBottom: '0.25rem'
                    }}>
                      Autor
                    </label>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: '#1f2937',
                      margin: 0
                    }}>
                      {getAuthorName(selectedBook.authorId)}
                    </p>
                  </div>

                  <div>
                    <label style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '600', 
                      color: '#374151',
                      display: 'block',
                      marginBottom: '0.25rem'
                    }}>
                      Editorial
                    </label>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: '#1f2937',
                      margin: 0
                    }}>
                      {getPublisherName(selectedBook.publisherId)}
                    </p>
                  </div>

                  <div>
                    <label style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '600', 
                      color: '#374151',
                      display: 'block',
                      marginBottom: '0.25rem'
                    }}>
                      Género
                    </label>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: '#1f2937',
                      margin: 0
                    }}>
                      {getGenreName(selectedBook.genreId)}
                    </p>
                  </div>

                  <div>
                    <label style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '600', 
                      color: '#374151',
                      display: 'block',
                      marginBottom: '0.25rem'
                    }}>
                      Fecha de Publicación
                    </label>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: '#1f2937',
                      margin: 0
                    }}>
                      {formatDate(selectedBook.publicationDate)}
                    </p>
                  </div>

                  <div>
                    <label style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '600', 
                      color: '#374151',
                      display: 'block',
                      marginBottom: '0.25rem'
                    }}>
                      Páginas
                    </label>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: '#1f2937',
                      margin: 0
                    }}>
                      {selectedBook.pages || 'No especificado'}
                    </p>
                  </div>

                  <div>
                    <label style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '600', 
                      color: '#374151',
                      display: 'block',
                      marginBottom: '0.25rem'
                    }}>
                      Precio
                    </label>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: '#1f2937',
                      margin: 0,
                      fontWeight: '600'
                    }}>
                      ${selectedBook.price?.toLocaleString('es-CL') || '0'}
                    </p>
                  </div>

                  <div>
                    <label style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '600', 
                      color: '#374151',
                      display: 'block',
                      marginBottom: '0.25rem'
                    }}>
                      Stock
                    </label>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: selectedBook.stockQuantity > 0 ? '#059669' : '#dc2626',
                      margin: 0,
                      fontWeight: '600'
                    }}>
                      {selectedBook.stockQuantity} unidades
                    </p>
                  </div>

                  <div>
                    <label style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '600', 
                      color: '#374151',
                      display: 'block',
                      marginBottom: '0.25rem'
                    }}>
                      Estado
                    </label>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: selectedBook.isAvailable ? '#d1fae5' : '#fee2e2',
                      color: selectedBook.isAvailable ? '#065f46' : '#991b1b'
                    }}>
                      {selectedBook.isAvailable ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>
                </div>

                {/* Descripción */}
                {selectedBook.description && (
                  <div>
                    <label style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '600', 
                      color: '#374151',
                      display: 'block',
                      marginBottom: '0.5rem'
                    }}>
                      Descripción
                    </label>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: '#1f2937',
                      lineHeight: '1.5',
                      margin: 0,
                      padding: '0.75rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '0.375rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      {selectedBook.description}
                    </p>
                  </div>
                )}

                {/* Fechas de sistema */}
                <div style={{ 
                  borderTop: '1px solid #e5e7eb', 
                  paddingTop: '1rem',
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '1rem' 
                }}>
                  <div>
                    <label style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: '600', 
                      color: '#6b7280',
                      display: 'block',
                      marginBottom: '0.25rem'
                    }}>
                      Creado el
                    </label>
                    <p style={{ 
                      fontSize: '0.75rem', 
                      color: '#6b7280',
                      margin: 0
                    }}>
                      {formatDate(selectedBook.createdAt)}
                    </p>
                  </div>

                  <div>
                    <label style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: '600', 
                      color: '#6b7280',
                      display: 'block',
                      marginBottom: '0.25rem'
                    }}>
                      Última actualización
                    </label>
                    <p style={{ 
                      fontSize: '0.75rem', 
                      color: '#6b7280',
                      margin: 0
                    }}>
                      {formatDate(selectedBook.updatedAt)}
                    </p>
                  </div>
                </div>

                {/* Botón de editar */}
                <div style={{ marginTop: '1rem' }}>
                  <button
                    onClick={() => {
                      handleCloseDetails();
                      onEditBook(selectedBook);
                    }}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      width: '100%'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#3b82f6';
                    }}
                  >
                    Editar Libro
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};