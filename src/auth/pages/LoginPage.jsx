import { useState } from "react";
import Swal from "sweetalert2";
import { useAuth } from "../hooks/useAuth";
import "./LoginPage.css";

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
        <div className="login-page-container">
            <div className="login-card">
                {/* Encabezado sin icono viejo ni recuadro */}
                <header className="login-header">
                    <h1 className="login-title">FARMACIA</h1>
                    <p className="login-subtitle">Ingresa tus credenciales para acceder al sistema</p>
                </header>

                {/* Formulario */}
                <form onSubmit={onSubmit} className="login-form">
                    {/* Campo: Usuario */}
                    <div className="login-field">
                        <label htmlFor="login-username" className="login-label">Usuario</label>
                        <div className="login-input-wrapper">
                            <span className="login-input-icon" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </span>
                            <input
                                id="login-username"
                                className="login-input"
                                placeholder="Nombre de usuario"
                                name="username"
                                value={username}
                                onChange={onInputChange}
                                autoComplete="username"
                                autoFocus
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Campo: Contraseña */}
                    <div className="login-field">
                        <label htmlFor="login-password" className="login-label">Contraseña</label>
                        <div className="login-input-wrapper">
                            <span className="login-input-icon" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </span>
                            <input
                                id="login-password"
                                className="login-input"
                                placeholder="••••••••"
                                type="password"
                                name="password"
                                value={password}
                                onChange={onInputChange}
                                autoComplete="current-password"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Botón de ingreso con microinteracciones y spinner */}
                    <button
                        type="submit"
                        className="login-submit-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="login-spinner" aria-hidden="true"></span>
                                <span>Iniciando sesión...</span>
                            </>
                        ) : (
                            <span>Iniciar Sesión</span>
                        )}
                    </button>
                </form>

                {/* Pie de seguridad */}
                <footer className="login-footer">
                    <span className="login-footer-icon" aria-hidden="true">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                    </span>
                    <span className="login-footer-text">Acceso restringido y protegido</span>
                </footer>
            </div>
        </div>
    );
};