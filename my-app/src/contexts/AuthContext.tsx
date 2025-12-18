import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User, LoginRequest, RegisterRequest } from '@/services/api';
import { socketService } from '@/services/socket';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check if user is already logged in on mount
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('access_token');
            const savedUser = localStorage.getItem('user');

            if (token && savedUser) {
                try {
                    // Verify token is still valid by fetching current user
                    const currentUser = await api.auth.getCurrentUser();
                    setUser(currentUser);
                    localStorage.setItem('user', JSON.stringify(currentUser));

                    // Connect socket
                    socketService.connect();
                } catch (error) {
                    console.error('Token validation failed:', error);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('user');
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = async (credentials: LoginRequest) => {
        try {
            // Get token
            const tokenResponse = await api.auth.login(credentials);
            localStorage.setItem('access_token', tokenResponse.access_token);

            // Get user info
            const currentUser = await api.auth.getCurrentUser();
            setUser(currentUser);
            localStorage.setItem('user', JSON.stringify(currentUser));

            // Connect socket
            socketService.connect();
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const register = async (data: RegisterRequest) => {
        try {
            // Register user
            const newUser = await api.auth.register(data);

            // Auto-login after registration
            await login({
                username: data.email,
                password: data.password,
            });
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setUser(null);
        socketService.disconnect();
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
