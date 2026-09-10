//import { UserForm } from "./components/UserForm";
//import { LoginPage } from "./auth/pages/LoginPage";
import {useEffect} from "react";
import { UserList } from "../components/UserList";
import { UserModalForm } from "../components/UserModalForm";
//import { UserContext } from "../context/UserContext";
//import {AuthContext} from "../auth/context/AuthContext.jsx";
import { useUsers } from "../hooks/useUsers.js";
import { useAuth } from "../auth/hooks/useAuth.js";

export const UsersPage = () => {
  const { users, visibleForm, isLoading, handlerOpenForm, getUsers } = useUsers();

  const {login} = useAuth();

  useEffect(() => {
    getUsers();
  }, []);

if(isLoading){
  return(
    <div className="container my-4">
      <div className="spinner-border text-danger" role="status">
      <span className="visually-hidden">Cargando...</span>
      </div>
    </div>
  )
}

  return (
    <>
    {/**
     * 
     {!visibleForm || <UserModalForm />}
      <div className="container my-4">
        <div className="row">
          <div className="col">
            {(visibleForm || !login.isAdmin) || (
              
              <button
                className="btn btn-primary my-2"
                onClick={handlerOpenForm}
              >
                Nuevo Usuario
              </button>
            )}

            {users.length === 0 ? (
              <div className="alert alert-warning">
                No hay usuarios en el sistema!
              </div>
            ) : (
              <UserList />
            )}
          </div>
        </div>
      </div>
     */}
      <UserList />
    </>
  );
};
