import React, { useState, useEffect } from 'react';

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

interface BooksListDebugProps {
  onAddBook: () => void;
  onEditBook: (book: Book) => void;
}

export const BooksListDebug: React.FC<BooksListDebugProps> = ({ onAddBook, onEditBook }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    console.log('BooksListDebug: Component mounted');
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    console.log('BooksListDebug: Starting fetchBooks');
    try {
      const token = localStorage.getItem('token');
      console.log('BooksListDebug: Token:', token ? 'Found' : 'Not found');
      
      const response = await fetch('http://localhost:3001/api/books', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('BooksListDebug: Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('BooksListDebug: Response data:', data);
        setBooks(data.books || []);
        console.log('BooksListDebug: Books set:', data.books?.length || 0, 'books');
      } else {
        const errorText = await response.text();
        console.error('BooksListDebug: Error response:', errorText);
        setError('Error al cargar los libros: ' + response.status);
      }
    } catch (error) {
      console.error('BooksListDebug: Fetch error:', error);
      setError('Error de conexión: ' + (error as Error).message);
    } finally {
      setLoading(false);
      console.log('BooksListDebug: Loading finished');
    }
  };

  console.log('BooksListDebug: Render - loading:', loading, 'error:', error, 'books:', books.length);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4">Cargando libros...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button 
          onClick={fetchBooks}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Libros (Debug)</h1>
        <button
          onClick={onAddBook}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Agregar Libro
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <p><strong>Total de libros:</strong> {books.length}</p>
        <p><strong>Estado:</strong> Cargado correctamente</p>
      </div>

      {books.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No hay libros disponibles</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <div key={book.id} className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-bold text-lg mb-2">{book.title}</h3>
              
              <div className="space-y-1 text-sm text-gray-600 mb-3">
                {book.authorId && (
                  <p><span className="font-medium">Autor ID:</span> {book.authorId}</p>
                )}
                {book.publisherId && (
                  <p><span className="font-medium">Editorial ID:</span> {book.publisherId}</p>
                )}
                {book.genreId && (
                  <p><span className="font-medium">Género ID:</span> {book.genreId}</p>
                )}
                {book.isbn && (
                  <p><span className="font-medium">ISBN:</span> {book.isbn}</p>
                )}
              </div>

              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-bold text-blue-600">
                  ${book.price}
                </span>
                <span className="text-sm text-gray-600">
                  Stock: {book.stockQuantity}
                </span>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => onEditBook(book)}
                  className="flex-1 bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors"
                >
                  Editar
                </button>
                <button
                  className="flex-1 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                  onClick={() => console.log('Delete book:', book.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};