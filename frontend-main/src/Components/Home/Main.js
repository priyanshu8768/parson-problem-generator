import React, { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../utils/useAuth";
import { message } from "antd";
import Loader from "../Loader/Loader";

const MainHome = () => {
	const { apiurl, token, user } = useAuth();
	const [userDetails, setUserDetails] = useState(null);

	// Fallback API call if user data is not available in context
	const fetchUserDetails = useCallback(async () => {
		try {
			const response = await fetch(`${apiurl}/get-user-details/`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				setUserDetails(data.data);
			} else {
				const data = await response.json();
				message.error(data.error);
			}
		} catch (error) {
			message.error("Please Try Again");
		}
	}, [apiurl, token]);

	useEffect(() => {
		if (user) {
			// Use the user data from context instead of making another API call
			setUserDetails(user);
		} else {
			// Only fetch if user data is not available
			fetchUserDetails();
		}
	}, [user, fetchUserDetails]);

	if (userDetails?.role === "user") {
		return <Navigate to="/dashboard" replace />; // Redirect to user dashboard
	}

	if (userDetails?.role === "admin") {
		return <Navigate to="/admin/dashboard" replace />;
	}

	return <Loader />;
};

export default MainHome;
