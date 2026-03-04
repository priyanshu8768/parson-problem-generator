import React, { createContext, useEffect, useState, useCallback } from "react";
import Loader from "../Loader/Loader";

export const UserContext = createContext();
export const UserProvider = ({ children }) => {
	const [isLoading, setIsLoading] = useState(true);
	const [token, setToken] = useState(null);
	const [user, setUser] = useState(null);

	const apiurl = process.env.REACT_APP_API_URL;
	console.log("UserContext apiurl:", apiurl);

	const fetchUserData = useCallback(async (authToken) => {
		try {
			const response = await fetch(`${apiurl}/get-user-details/`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${authToken}`,
				},
			});
			if (response.ok) {
				const contentType = response.headers.get("content-type");
				if (contentType && contentType.includes("application/json")) {
					const userData = await response.json();
					setUser(userData.data);
				} else {
					console.error("Non-JSON response from server");
					handleLogout();
				}
			} else {
				console.error("Failed to fetch user data");
				// Token might be invalid, clear it
				handleLogout();
			}
		} catch (error) {
			console.error("Error fetching user data:", error);
			handleLogout();
		} finally {
			setIsLoading(false);
		}
	}, [apiurl]);

	useEffect(() => {
		const storedToken = localStorage.getItem("parsonproblemtk");
		if (storedToken) {
			setToken(storedToken);
			fetchUserData(storedToken);
		} else {
			const sessionToken = sessionStorage.getItem("parsonproblemtk");
			if (sessionToken) {
				setToken(sessionToken);
				fetchUserData(sessionToken);
			} else {
				setIsLoading(false);
			}
		}
	}, [fetchUserData]);

	const handleLogin = (token) => {
		setToken(token);
		localStorage.setItem("parsonproblemtk", token);
		fetchUserData(token);
	};

	const handleSessionLogin = (token) => {
		setToken(token);
		sessionStorage.setItem("parsonproblemtk", token);
		fetchUserData(token);
	};

	const handleLogout = () => {
		setToken(null);
		setUser(null);
		localStorage.removeItem("parsonproblemtk");
		sessionStorage.removeItem("parsonproblemtk");
	};

	const getAuthHeaders = () => {
		const storedToken = localStorage.getItem("parsonproblemtk") || sessionStorage.getItem("parsonproblemtk");
		const headers = { "Content-Type": "application/json" };
		if (storedToken && storedToken !== "undefined" && storedToken !== "null") {
			headers.Authorization = `Bearer ${storedToken}`;
		}
		return headers;
	};

	if (isLoading) {
		return <Loader></Loader>;
	}

	return (
		<UserContext.Provider
			value={{
				handleLogin,
				handleSessionLogin,
				handleLogout,
				token,
				user,
				apiurl,
				getAuthHeaders,
			}}>
			{children}
		</UserContext.Provider>
	);
};