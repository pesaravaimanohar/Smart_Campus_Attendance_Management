import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
            navigate("/login");
        } else if (!loading && user && allowedRoles && !allowedRoles.includes(user.role)) {
            navigate("/unauthorized");
        }
    }, [user, loading, navigate, allowedRoles]);

    if (loading || !user) return <div>Loading...</div>;

    return children;
};

export default ProtectedRoute;
