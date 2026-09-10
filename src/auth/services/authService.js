import axios from 'axios';

export const loginUser = async ({username, password}) => {
  //ese ternario esta de mas por eso lo saque
  //return (userLogin.username === "admin" && userLogin.password === "12345")? true: false;
  ////return userLogin.username === "admin" && userLogin.password === "12345";

  try {
    //return await axios.post(`${import.meta.env.VITE_API_BASE_URL}/login` ,{
      //return await axios.post(`http://localhost:8080/login`,{
    return await axios.post(`${import.meta.env.VITE_API_BASE_URL}/login`,{
      username,
      password,
    })
  }catch (e) {
    console.error(e.message);
    throw e;
  }

};
