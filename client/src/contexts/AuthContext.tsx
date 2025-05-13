import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';

interface User {
  id: string;
  email: string;
  name: string;
}

interface ValidationError {
  field: string;
  message: string;
}

interface AuthError {
  message: string;
  validationErrors?: ValidationError[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: AuthError | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
  }
  if (!/[A-Z]/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one uppercase letter' });
  }
  if (!/[a-z]/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one lowercase letter' });
  }
  if (!/[0-9]/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one number' });
  }
  return errors;
};

const validateName = (name: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (name.length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
  }
  if (!/^[a-zA-Z\s-']+$/.test(name)) {
    errors.push({ field: 'name', message: 'Name can only contain letters, spaces, hyphens, and apostrophes' });
  }
  return errors;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const navigate = useNavigate();

  const clearError = () => setError(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await axios.get('/api/auth/me');
          setUser(response.data);
        } catch (err) {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          if (axios.isAxiosError(err)) {
            setError({ message: 'Session expired. Please login again.' });
          }
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleAxiosError = (err: unknown): AuthError => {
    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError<{ message: string; errors?: ValidationError[] }>;
      if (axiosError.response?.data) {
        return {
          message: axiosError.response.data.message || 'An error occurred',
          validationErrors: axiosError.response.data.errors,
        };
      }
      return { message: axiosError.message || 'Network error occurred' };
    }
    return { message: 'An unexpected error occurred' };
  };

  const login = async (email: string, password: string) => {
    try {
      clearError();
      
      // Validate email
      if (!validateEmail(email)) {
        throw { message: 'Invalid email format', validationErrors: [{ field: 'email', message: 'Please enter a valid email address' }] };
      }

      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      navigate('/');
    } catch (err) {
      const authError = handleAxiosError(err);
      setError(authError);
      throw authError;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      clearError();

      // Validate inputs
      const validationErrors: ValidationError[] = [];
      
      if (!validateEmail(email)) {
        validationErrors.push({ field: 'email', message: 'Please enter a valid email address' });
      }

      const passwordErrors = validatePassword(password);
      validationErrors.push(...passwordErrors);

      const nameErrors = validateName(name);
      validationErrors.push(...nameErrors);

      if (validationErrors.length > 0) {
        throw { message: 'Validation failed', validationErrors };
      }

      const response = await axios.post('/api/auth/register', { email, password, name });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      navigate('/');
    } catch (err) {
      const authError = handleAxiosError(err);
      setError(authError);
      throw authError;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 