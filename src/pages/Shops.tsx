
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Shops = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to HRMS store management since we're now using HR stores
    if (user) {
      navigate('/hrms/stores', { replace: true });
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to Store Management...</h1>
        <p className="text-muted-foreground">
          Store management has been moved to the HRMS section. You are being redirected automatically.
        </p>
      </div>
    </div>
  );
};

export default Shops;
