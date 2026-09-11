import { useState } from "react";
import Swal from "sweetalert2";
import { useAuth } from "../hooks/useAuth";

const initialLoginForm = {
    username: "",
    password: "",
};

export const LoginPage = () => {
    const { handlerLogin } = useAuth();
    const [loginForm, setLoginForm] = useState(initialLoginForm);
    const [isLoading, setIsLoading] = useState(false);
    const { username, password } = loginForm;

    const onInputChange = ({ target }) => {
        const { name, value } = target;
        setLoginForm({
            ...loginForm,
            [name]: value,
        });
    };

    const onSubmit = async (event) => {
        event.preventDefault();
        if (!username.trim() || !password.trim()) {
            Swal.fire("Campos incompletos", "Por favor ingresa tu usuario y contraseña", "warning");
            return;
        }

        try {
            setIsLoading(true);
            await handlerLogin({ username: username.trim(), password });
            setLoginForm(initialLoginForm);
        } catch (error) {
            console.error("Error al iniciar sesión:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-slate-100/70 font-sans selection:bg-emerald-100 selection:text-emerald-900">
            {/* Contenedor principal de la tarjeta */}
            <div className="relative w-full max-w-[420px] bg-white rounded-3xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.04)] border border-slate-200/60">
                {/* Encabezado sin icono de pastilla ni recuadros toscos */}
                <header className="text-center mb-8">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                        FARMACIA
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 font-normal leading-relaxed">
                        Ingresa tus credenciales para acceder al sistema
                    </p>
                </header>

                {/* Formulario de Login */}
                <form onSubmit={onSubmit} className="space-y-5">
                    {/* Campo: Usuario */}
                    <div className="space-y-1.5">
                        <label 
                            htmlFor="login-username" 
                            className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                        >
                            Usuario
                        </label>
                        <div className="relative group">
                            <span 
                                className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors"
                                aria-hidden="true"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                            </span>
                            <input
                                id="login-username"
                                type="text"
                                name="username"
                                value={username}
                                onChange={onInputChange}
                                autoComplete="username"
                                autoFocus
                                disabled={isLoading}
                                placeholder="Nombre de usuario"
                                className="w-full h-12 pl-11 pr-4 bg-slate-50/80 border border-slate-200 text-slate-900 text-sm rounded-xl outline-none placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Campo: Contraseña */}
                    <div className="space-y-1.5">
                        <label 
                            htmlFor="login-password" 
                            className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                        >
                            Contraseña
                        </label>
                        <div className="relative group">
                            <span 
                                className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors"
                                aria-hidden="true"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </span>
                            <input
                                id="login-password"
                                type="password"
                                name="password"
                                value={password}
                                onChange={onInputChange}
                                autoComplete="current-password"
                                disabled={isLoading}
                                placeholder="••••••••"
                                className="w-full h-12 pl-11 pr-4 bg-slate-50/80 border border-slate-200 text-slate-900 text-sm rounded-xl outline-none placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Botón de ingreso con Tailwind y estado de carga */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 mt-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all duration-200 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Iniciando sesión...</span>
                            </>
                        ) : (
                            <span>Iniciar Sesión</span>
                        )}
                    </button>
                </form>

                {/* Pie de seguridad discreto */}
                <footer className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    <span>Acceso restringido y protegido</span>
                </footer>
            </div>
        </div>
    );
};