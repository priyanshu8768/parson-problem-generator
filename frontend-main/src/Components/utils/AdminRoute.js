import React, { useEffect, useState, useCallback } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";
import Loader from "../Loader/Loader";
import { message } from "antd";

export const AdminRoute = () => {
	const { token, user, apiurl } = useAuth();
	const [isLoading, setIsLoading] = useState(true);
	const [isAdmin, setIsAdmin] = useState(false);

	const verifyAdminAccess = useCallback(async (token) => {
		try {
			// First verify token is valid
			const response = await fetch(`${apiurl}/verify-token/`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ token }),
			});
			
			if (!response.ok) {
				throw new Error("Failed to verify token");
			}
			
			const data = await response.json();
			if (data.valid !== true) {
				return false;
			}
			
			// Check if user has admin role
			if (user && user.role === "admin") {
				return true;
			}
			
			// If user data not available, fetch user details
			if (!user) {
				const userResponse = await fetch(`${apiurl}/get-user-details/`, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
				});
				
				if (userResponse.ok) {
					const userData = await userResponse.json();
					return userData.data && userData.data.role === "admin";
				}
			}
			
			return false;
		} catch (error) {
			message.error("Authentication failed! Please login again.");
			return false;
		}
	}, [apiurl, user]);

	useEffect(() => {
		const checkAdminAccess = async () => {
			if (token && token !== "undefined" && token !== "null") {
				const hasAdminAccess = await verifyAdminAccess(token);
				setIsAdmin(hasAdminAccess);
			}
			setIsLoading(false);
		};

		checkAdminAccess();
	}, [token, verifyAdminAccess]);

	if (isLoading) {
		return <Loader />;
	}

	if (!isAdmin) {
		return (
			<Navigate
				to="/auth"
				state={{ error: "Access denied. Admin credentials required." }}
			/>
		);
	}

	return <Outlet />;
};
