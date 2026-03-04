import React, { useEffect, useState, useCallback } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";
import Loader from "../Loader/Loader";
import { message } from "antd";

export const AuthRoute = () => {
	const { token, apiurl } = useAuth();
	const [isLoading, setIsLoading] = useState(true);
	const [isValidToken, setIsValidToken] = useState(false);

	const verifyToken = useCallback(async (token) => {
		try {
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
			return data.valid === true;
		} catch (error) {
			message.error("Token expired! Please Login again.");
			return false;
		}
	}, [apiurl]);

	useEffect(() => {
		const checkTokenValidity = async () => {
			if (token && token !== "undefined" && token !== "null") {
				const isValid = await verifyToken(token);
				setIsValidToken(isValid);
			}
			setIsLoading(false);
		};

		checkTokenValidity();
	}, [token, verifyToken]);

	if (isLoading) {
		return (
			<div>
				<Loader />
			</div>
		);
	}

	if (!isValidToken) {
		return (
			<Navigate
				to="/auth"
				state={{ error: "Token expired. Please login again." }}
			/>
		);
	}

	return <Outlet />;
};
