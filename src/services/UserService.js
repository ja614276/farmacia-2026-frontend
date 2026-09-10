import usersApi from "../apis/usersApi.js";

/*
//funcion reemplazada por userApi
const BASE_URL = 'http://localhost:8080/users';
const config = () => {
    return {
        headers: {
            "Authorization": sessionStorage.getItem('token'),
            "Content-Type": "application/json",
        }
    }
}
*/

//importante
//const BASE_URL = '';

//const BASE_URL = 'http://localhost:8080/users';

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/users`;

export const findAll = async () => {
    try {
        const response = await usersApi.get(BASE_URL);
        return response;
    } catch (error) {
        console.error(error);
    }
    return null;
}

export const findAllPages = async (page= 0) => {
    try {
        const response = await usersApi.get(`${BASE_URL}/page/${page}`);
        return response;
    } catch (error) {
        console.error(error);
    }
    return null;
}

export const save = async ({username, email, password, admin}) => {
    try {
        return await usersApi.post(BASE_URL, {
            username,
            email,
            password,
            admin,
        });
    } catch (error) {
        console.error
        throw error;
    }
}

export const update = async ({id, username, email, admin}) => {
    try {
        return await usersApi.put(`${BASE_URL}/${id}`, {
            username,
            email,
            // password: 'nothing',
            admin,
        });
    } catch (error) {
        console.error("Error al actualizar el usuario:", error);
        throw error;
    }
}

export const remove = async (id) => {
    try {
        await usersApi.delete(`${BASE_URL}/${id}`);
    } catch (error) {
        console.error(error);
        throw error;
    }
}