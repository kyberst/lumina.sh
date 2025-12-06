
import React, { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { authService } from '../../services/authService';
import { User } from '../../types';
import { toast } from '../../services/toastService';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { RecoverForm } from './components/RecoverForm';

interface AuthProps {
    onLogin: (user: User) => void;
}

/**
 * AuthViews: Componente Orquestador.
 * Gestiona el estado de alto nivel (qué vista mostrar) y las transiciones.
 * Delega la lógica específica de cada formulario a componentes hijos.
 */
export const AuthViews: React.FC<AuthProps> = ({ onLogin }) => {
    const [view, setView] = useState<'login' | 'register' | 'recover'>('login');

    // Maneja el éxito del login desde cualquier subcomponente
    const handleLoginSuccess = (user: User) => {
        toast.success("Welcome back!");
        onLogin(user);
    };

    return (
        <AuthLayout>
            <div className="bg-card text-card-foreground rounded-xl p-8 md:p-10 shadow-lg border">
                
                {/* Renderizado Condicional de Formularios */}
                {view === 'login' && (
                    <LoginForm 
                        onSuccess={handleLoginSuccess}
                        onForgotPassword={() => setView('recover')}
                        onRegisterClick={() => setView('register')}
                    />
                )}

                {view === 'register' && (
                    <RegisterForm 
                        onSuccess={handleLoginSuccess}
                        onLoginClick={() => setView('login')}
                    />
                )}

                {view === 'recover' && (
                    <RecoverForm 
                        onSuccess={() => setView('login')}
                        onCancel={() => setView('login')}
                    />
                )}

            </div>
        </AuthLayout>
    );
};
