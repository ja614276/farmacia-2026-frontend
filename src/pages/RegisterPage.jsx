import { useEffect, useState } from "react";
import { UserForm } from "../components/UserForm";
import { useParams, useNavigate } from "react-router-dom";
import { useUsers } from "../hooks/useUsers";

export const RegisterPage = () => {
  const { users = [], initialUserForm } = useUsers();
  const [userSelected, setUserSelected] = useState(initialUserForm);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (id && users.length > 0) {
      const user = users.find((u) => String(u.id) === String(id)) || initialUserForm;
      setUserSelected(user);
    } else {
      setUserSelected(initialUserForm);
    }
  }, [id, users, initialUserForm]);

  const handleReturn = () => {
    navigate("/users");
  };

  return (
    <div className="w-100 p-0">
      <UserForm
        userSelected={userSelected}
        handlerCloseForm={handleReturn}
      />
    </div>
  );
};

export default RegisterPage;