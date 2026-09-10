import { useNavigate, useParams } from "react-router-dom";
import { ClientForm } from "../components/ClientForm"; // Ajusta la ruta a tu ClientForm

export const ClientsRegisterPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <ClientForm
      initialData={id ? { id } : null}
      onCancel={() => navigate("/clients")}
      onSaveSuccess={() => navigate("/clients")}
    />
  );
};