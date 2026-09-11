import { useNavigate, useParams } from "react-router-dom";
import { SaleForm } from "../components/SaleForm";

export const SalesRegisterPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    return (
        <SaleForm
            initialData={id ? { id } : null}
            onCancel={() => navigate("/sales")}
            onSuccess={() => navigate("/sales")}
        />
    );
};
