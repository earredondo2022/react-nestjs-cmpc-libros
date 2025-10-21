import React, { useEffect, useState } from 'react';
import { BooksList } from '../components/BooksList';
import { BookForm } from '../components/BookForm';
import AuditLogs from '../components/AuditLogs';

// Agregar estilos CSS para animaciones
const styles = `
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

// Insertar estilos en el documento
if (typeof document !== 'undefined' && !document.getElementById('dashboard-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.id = 'dashboard-styles';
  styleSheet.innerHTML = styles;
  document.head.appendChild(styleSheet);
}

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

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
}

type CurrentView = 'dashboard' | 'book-form' | 'audit-logs';

export const DashboardPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
    const [currentView, setCurrentView] = useState<'dashboard' | 'book-form' | 'audit-logs'>('dashboard');
  const [editingBook, setEditingBook] = useState<Book | undefined>(undefined);

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      // Redirigir al login si no hay token
      window.location.href = '/';
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      console.error('Error parsing user data:', error);
      window.location.href = '/';
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const handleAddBook = () => {
    setCurrentView('book-form');
    setEditingBook(undefined);
  };

  const handleEditBook = (book: Book) => {
    setCurrentView('book-form');
    setEditingBook(book);
  };

  const handleBookSaved = () => {
    setCurrentView('dashboard');
    setEditingBook(undefined);
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setEditingBook(undefined);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" style={{
          animation: 'spin 1s infinite linear',
          borderRadius: '50%',
          height: '8rem',
          width: '8rem',
          borderBottom: '2px solid #2563eb'
        }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header className="bg-white shadow" style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '0 1rem'
        }}>
          <div className="flex justify-between items-center py-6" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.5rem 0'
          }}>
            <div className="flex items-center space-x-4" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <button
                onClick={handleBackToDashboard}
                className="text-3xl font-bold text-gray-900 hover:text-blue-600 transition-colors duration-200"
                style={{
                  fontSize: '1.875rem',
                  fontWeight: 'bold',
                  color: '#111827',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#111827';
                }}
              >
                📚 CMPC-libros
              </button>
              {currentView !== 'dashboard' && (
                <nav className="flex space-x-2 text-sm text-gray-600" style={{
                  display: 'flex',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#4b5563'
                }}>
                  <button 
                    onClick={handleBackToDashboard}
                    className="hover:text-blue-600 transition-colors duration-200"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#4b5563',
                      transition: 'color 0.2s ease',
                      outline: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#2563eb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#4b5563';
                    }}
                  >
                    Dashboard
                  </button>
                  <span style={{ color: '#4b5563' }}>›</span>
                  {currentView === 'book-form' && (
                    <span className="text-gray-900 font-medium" style={{
                      color: '#111827',
                      fontWeight: '500'
                    }}>
                      {editingBook ? 'Editar Libro' : 'Agregar Libro'}
                    </span>
                  )}
                  {currentView === 'audit-logs' && (
                    <span className="text-gray-900 font-medium" style={{
                      color: '#111827',
                      fontWeight: '500'
                    }}>
                      Auditoría del Sistema
                    </span>
                  )}
                </nav>
              )}
            </div>
            <div className="flex items-center space-x-4" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <span className="text-sm text-gray-700" style={{
                fontSize: '0.875rem',
                color: '#374151'
              }}>
                Bienvenido, {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={() => setCurrentView('audit-logs')}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center gap-2"
                style={{
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  fontWeight: '500',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#6d28d9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#7c3aed';
                }}
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Auditoría
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  fontWeight: '500',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#b91c1c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }}
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8" style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '1.5rem 1rem'
      }}>
        <div className="px-4 py-6 sm:px-0" style={{
          padding: '1.5rem 0'
        }}>
          {currentView === 'dashboard' && (
            <BooksList 
              onAddBook={handleAddBook}
              onEditBook={handleEditBook}
            />
          )}

          {currentView === 'book-form' && (
            <BookForm
              book={editingBook}
              onSave={handleBookSaved}
              onCancel={() => setCurrentView('dashboard')}
            />
          )}

          {currentView === 'audit-logs' && (
            <AuditLogs />
          )}
        </div>
      </main>
    </div>
  );
};