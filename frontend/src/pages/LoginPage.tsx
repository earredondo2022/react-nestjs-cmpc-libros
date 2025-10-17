import React, { useState } from 'react';

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
if (typeof document !== 'undefined' && !document.getElementById('login-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.id = 'login-styles';
  styleSheet.innerHTML = styles;
  document.head.appendChild(styleSheet);
}

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@cmpc-libros.com');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Guardar token en localStorage
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirigir al dashboard
        window.location.href = '/dashboard';
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error de autenticación');
      }
    } catch (error) {
      setError('Error de conexión. Verifica que el backend esté funcionando.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 50%, #f3e8ff 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30" style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.3
      }}>
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{
          position: 'absolute',
          top: '2.5rem',
          left: '2.5rem',
          width: '8rem',
          height: '8rem',
          backgroundColor: '#bfdbfe',
          borderRadius: '50%',
          filter: 'blur(1rem)',
          animation: 'pulse 2s infinite'
        }}></div>
        <div className="absolute top-40 right-10 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000" style={{
          position: 'absolute',
          top: '10rem',
          right: '2.5rem',
          width: '8rem',
          height: '8rem',
          backgroundColor: '#e9d5ff',
          borderRadius: '50%',
          filter: 'blur(1rem)',
          animation: 'pulse 2s infinite',
          animationDelay: '1s'
        }}></div>
        <div className="absolute bottom-10 left-1/2 w-32 h-32 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000" style={{
          position: 'absolute',
          bottom: '2.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '8rem',
          height: '8rem',
          backgroundColor: '#c7d2fe',
          borderRadius: '50%',
          filter: 'blur(1rem)',
          animation: 'pulse 2s infinite',
          animationDelay: '2s'
        }}></div>
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10" style={{
        margin: '0 auto',
        width: '100%',
        maxWidth: '28rem',
        position: 'relative',
        zIndex: 10
      }}>
        <div className="text-center" style={{ textAlign: 'center' }}>
          <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-3 shadow-lg" style={{
            margin: '0 auto 0.75rem auto',
            height: '3rem',
            width: '3rem',
            background: 'linear-gradient(to right, #2563eb, #4f46e5)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}>
            <span className="text-xl text-white" style={{
              fontSize: '1.25rem',
              color: 'white'
            }}>📚</span>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent" style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            background: 'linear-gradient(to right, #2563eb, #4f46e5)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: 0
          }}>
            CMPC-libros
          </h2>
          <p className="mt-2 text-sm text-gray-600 font-medium" style={{
            marginTop: '0.5rem',
            fontSize: '0.875rem',
            color: '#4b5563',
            fontWeight: '500'
          }}>
            Sistema de Gestión de Inventario
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10" style={{
        marginTop: '2rem',
        margin: '2rem auto 0 auto',
        width: '100%',
        maxWidth: '28rem',
        position: 'relative',
        zIndex: 10
      }}>
        <div className="bg-white/80 backdrop-blur-sm py-8 px-6 shadow-2xl rounded-2xl border border-white/20 sm:px-10" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          padding: '2rem 2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          borderRadius: '1rem',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '100%'
        }}>
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-r-lg shadow-sm" style={{
              marginBottom: '1rem',
              backgroundColor: '#fef2f2',
              borderLeft: '4px solid #f87171',
              color: '#b91c1c',
              padding: '0.75rem 1rem',
              borderRadius: '0 0.5rem 0.5rem 0',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <div className="flex items-center" style={{
                display: 'flex',
                alignItems: 'center'
              }}>
                <span className="mr-2" style={{ marginRight: '0.5rem' }}>❌</span>
                {error}
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ marginBottom: '1rem', width: '100%', boxSizing: 'border-box' }}>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2" style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Correo electrónico
                </label>
                <div className="relative" style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    paddingLeft: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none'
                  }}>
                    <span className="text-gray-400" style={{ color: '#9ca3af' }}>✉️</span>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    className="block w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white sm:text-sm"
                    placeholder="tu@ejemplo.com"
                    style={{
                      display: 'block',
                      width: 'calc(100% - 2px)',
                      maxWidth: '100%',
                      boxSizing: 'border-box',
                      paddingLeft: '2rem',
                      paddingRight: '1rem',
                      paddingTop: '0.625rem',
                      paddingBottom: '0.625rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      backgroundColor: '#f9fafb',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = '#f9fafb';
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem', width: '100%', boxSizing: 'border-box' }}>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2" style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Contraseña
                </label>
                <div className="relative" style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    paddingLeft: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none'
                  }}>
                    <span className="text-gray-400" style={{ color: '#9ca3af' }}>🔒</span>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    className="block w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white sm:text-sm"
                    placeholder="••••••••"
                    style={{
                      display: 'block',
                      width: 'calc(100% - 2px)',
                      maxWidth: '100%',
                      boxSizing: 'border-box',
                      paddingLeft: '2rem',
                      paddingRight: '1rem',
                      paddingTop: '0.625rem',
                      paddingBottom: '0.625rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      backgroundColor: '#f9fafb',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = '#f9fafb';
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '0.625rem 1rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'white',
                  background: 'linear-gradient(to right, #2563eb, #4f46e5)',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.5 : 1,
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'linear-gradient(to right, #1d4ed8, #4338ca)';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'linear-gradient(to right, #2563eb, #4f46e5)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                  }
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                }}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2" style={{ 
                      marginRight: '0.5rem',
                      animation: 'spin 1s linear infinite'
                    }}>⏳</span>
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <span className="mr-2" style={{ marginRight: '0.5rem' }}>🚀</span>
                    Iniciar Sesión
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6" style={{ marginTop: '1.5rem' }}>
            <div className="relative" style={{ position: 'relative' }}>
              <div className="absolute inset-0 flex items-center" style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center'
              }}>
                <div className="w-full border-t border-gray-200" style={{
                  width: '100%',
                  borderTop: '1px solid #e5e7eb'
                }} />
              </div>
              <div className="relative flex justify-center text-sm" style={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                fontSize: '0.875rem'
              }}>
                <span className="px-3 bg-white/80 text-gray-500" style={{
                  padding: '0 0.75rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  color: '#6b7280'
                }}>Información</span>
              </div>
            </div>

            <div className="mt-4 text-center" style={{
              marginTop: '1rem',
              textAlign: 'center'
            }}>
              <p className="text-xs text-gray-600 flex items-center justify-center" style={{
                fontSize: '0.75rem',
                color: '#4b5563',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2" style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  backgroundColor: '#4ade80',
                  borderRadius: '50%',
                  marginRight: '0.5rem'
                }}></span>
                v1.0.0 - CMPC-libros System
              </p>
              <p className="text-xs text-gray-500 mt-1" style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                marginTop: '0.25rem'
              }}>
                React • NestJS • PostgreSQL
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};