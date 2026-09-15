import {useNavigate} from "react-router-dom";
import Swal from "sweetalert2";
import {findAll, remove, save, update} from "../services/UserService.js";
import { useDispatch, useSelector } from "react-redux";
import { initialUserForm, addUser,removeUser,updateUser,loadingUsers, onUserSelectedForm, onOpenForm, onCloseForm, loadingError} from "../store/slices/users/usersSlice.js";
import { useAuth } from "../auth/hooks/useAuth.js";
import { isTokenExpired, getStoredToken } from "../auth/utils/tokenUtils.js";

export const useUsers = () => {
    const {users, userSelected, visibleForm, errors, isLoading} = useSelector(state => state.users)
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {login, handlerLogout} = useAuth();

    const getUsers = async () => {

        try {
            const result = await findAll();
            console.log(result);
            dispatch(loadingUsers(result.data));
        } catch (error) {
            if (!error.response) {
                console.warn("⚠️ [useUsers] Microcorte o error de conexión al cargar usuarios:", error.message);
                return;
            }
            if (error.response?.status == 401) {
                if (isTokenExpired(getStoredToken())) {
                    handlerLogout();
                } else {
                    console.warn("⚠️ [useUsers] 401 recibido pero el token sigue vigente (7 días). Conservando sesión.");
                }
            }
        }
    };

    const handlerAddUser = async (user) => {
        // console.log(user);
        if (!login.isAdmin) return;
        let response;
        try {

            if (user.id === 0) {
                response = await save(user);
                dispatch(addUser({... response.data}))
            } else {
                response = await update(user);
                dispatch(updateUser({... response.data}));
            }

            Swal.fire(
                (user.id === 0) ?
                    'Usuario Creado' :
                    'Usuario Actualizado',
                (user.id === 0) ?
                    'El usuario ha sido creado con exito!' :
                    'El usuario ha sido actualizado con exito!',
                'success'
            );
            handlerCloseForm();
            navigate('/users');
        } catch (error) {
            if (error.response && error.response.status == 400) {
                console.log(error.response.data);
                dispatch(loadingError((error.response.data)));
            } else if (error.response && error.response.status == 500 &&
                error.response.data?.message?.includes('constraint')) {
                if (error.response.data?.message?.includes('UK_username')) {
                    dispatch(loadingError({username: 'El username ya existe.'}))
                }
                if (error.response.data?.message?.includes('UK_email')) {
                    dispatch(loadingError(({email: 'El email ya existe.'})))
                }
            } else if (error.response?.status == 401) {
                if (isTokenExpired(getStoredToken())) {
                    handlerLogout();
                } else {
                    console.warn("⚠️ [useUsers] 401 recibido al registrar usuario pero token sigue vigente.");
                }
            } else {
                throw error;
            }
        }
    }

    const handlerRemoveUser = (id) => {
        // console.log(id);

        if (!login.isAdmin) return;
        Swal.fire({
            title: 'Esta seguro que desea eliminar?',
            text: "Cuidado el usuario sera eliminado!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Si, eliminar!'
        }).then(async (result) => {
            if (result.isConfirmed) {

                try {
                    await remove(id);
                    dispatch (removeUser(id))
                    //dispatch({
                    //    type: 'removeUser',
                    //    payload: id,
                    //});
                    Swal.fire(
                        'Usuario Eliminado!',
                        'El usuario ha sido eliminado con exito!',
                        'success'
                    )
                } catch (error) {
                    if (error.response?.status == 401) {
                        if (isTokenExpired(getStoredToken())) {
                            handlerLogout();
                        } else {
                            console.warn("⚠️ [useUsers] 401 recibido al eliminar usuario pero token sigue vigente.");
                        }
                    }
                }
            }
        })

    }

    const handlerUserSelectedForm = (user) => {
        // console.log(user)
        //setVisibleForm(true);
        //setUserSelected({...user});
        dispatch(onUserSelectedForm({...user}));
    }

    const handlerOpenForm = () => {
        //setVisibleForm(true);
        dispatch(onOpenForm());
    }

    const handlerCloseForm = () => {
        //setVisibleForm(false);
        //setUserSelected(initialUserForm);
        dispatch(onCloseForm());
        //setErrors({});
        dispatch(loadingError({}));
    }

    return {
        users,
        userSelected,
        initialUserForm,
        visibleForm,
        errors,
        isLoading,
        handlerAddUser,
        handlerRemoveUser,
        handlerUserSelectedForm,
        handlerOpenForm,
        handlerCloseForm,
        getUsers,
    }
}