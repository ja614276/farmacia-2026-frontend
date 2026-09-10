import { NavLink } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { useUsers } from "../../hooks/useUsers.js";
import { useState } from "react";

export const Navbar = () => {
    const { login, handlerLogout } = useAuth();
    const { users } = useUsers();
    const [showDropdown, setShowDropdown] = useState(false);

    // Si users está vacío o login.user no está definido, evitamos errores
    const currentUser = users.length > 0 && login.user
        ? users.find(user => user.username?.toLowerCase() === login.user.username?.toLowerCase())
        : null;

    const userEmail = currentUser?.email || "Cargando...";

    return (
        <nav className="navbar navbar-expand-lg bg-body-tertiary">
            <div className="container-fluid">
                <NavLink className="navbar-brand" to="/">
                    FarmaciaApp
                </NavLink>
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                    aria-controls="navbarNav"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav">
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/users">Usuarios</NavLink>
                        </li>

                        {login?.isAdmin && (
                            <li className="nav-item">
                                <NavLink className="nav-link" to="/users/register">Registrar Usuarios</NavLink>
                            </li>
                        )}

                        <li className="nav-item">
                            <NavLink className="nav-link" to="/products">Productos</NavLink>
                        </li>

                        {login?.isAdmin && (
                            <li className="nav-item">
                                <NavLink className="nav-link" to="/products/register">Registrar Productos</NavLink>
                            </li>
                        )}

                        <li className="nav-item">
                            <NavLink className="nav-link" to="/categories">Categorías</NavLink>
                        </li>

                        <li className="nav-item">
                            <NavLink className="nav-link" to="/clients">Clientes</NavLink>
                        </li>

                        <li className="nav-item">
                            <NavLink className="nav-link" to="/sales">Ventas</NavLink>
                        </li>

                        <li className="nav-item">
                            <NavLink className="nav-link" to="/providers">Proveedores</NavLink>
                        </li>

                        <li className="nav-item">
                            <NavLink className="nav-link" to="/reports">Reportes</NavLink>
                        </li>
                    </ul>
                </div>

                {/* Dropdown del usuario */}
                <div className="collapse navbar-collapse justify-content-end" id="navbarNavLogout">
                    <div className="nav-item dropdown position-relative">
                        <span
                            className="nav-link dropdown-toggle text-dark"
                            style={{ cursor: "pointer" }}
                            onClick={() => setShowDropdown(!showDropdown)}
                        >
                            Username: <strong>{login.user?.username || "Invitado"}</strong>
                        </span>

                        {showDropdown && (
                            <ul className="dropdown-menu show position-absolute end-0 w-auto">
                                <li className="dropdown-item">
                                    <strong>Rol:</strong> {login?.isAdmin ? "Administrador" : "Usuario"}
                                </li>
                                <li className="dropdown-item">
                                    <strong>Email:</strong> {userEmail}
                                </li>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                    <button onClick={handlerLogout} className="dropdown-item text-danger">
                                        Logout
                                    </button>
                                </li>
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};
