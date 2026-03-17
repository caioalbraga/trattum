import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Results page is no longer used in the new flow.
// Redirect to confirmation or dashboard.
export default function Results() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/confirmacao', { replace: true });
  }, [navigate]);

  return null;
}
