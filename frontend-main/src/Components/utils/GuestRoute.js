import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";

export const GuestRoute = ({ children }) => {
	const { token } = useAuth();

	if (token && token !== "undefined" && token !== "null") {
		return <Navigate to="/" replace />;
	}

	return children;
};
