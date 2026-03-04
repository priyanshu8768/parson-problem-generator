import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Form, Input, message } from "antd";
import { Link } from "react-router-dom";
import { useAuth } from "../utils/useAuth";
import Loader from "../Loader/Loader";

const Login = () => {
	const [form] = Form.useForm();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const { apiurl, handleLogin } = useAuth();

	const handleAuthentication = async () => {
		try {
			const values = await form.validateFields();
			setLoading(true);

			const loginUrl = `${apiurl}/login/`;
			console.log("Attempting login to:", loginUrl);
			console.log("Form values:", values);

			const response = await fetch(loginUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(values),
			});

			// Check if response is JSON before parsing
			const contentType = response.headers.get("content-type");
			let data;
			
			if (contentType && contentType.includes("application/json")) {
				data = await response.json();
			} else {
				// If not JSON, get text and create error object
				const text = await response.text();
				data = { error: "Server returned non-JSON response" };
				console.error("Non-JSON response:", text);
			}
			if (response.ok){
				// Only allow regular users to login through this form
				if (data.role === "admin") {
					message.error("Please use Admin Login for admin accounts.");
					setLoading(false);
					return;
				}
				
				handleLogin(data.access_token);
				message.success("Login successful");
				setLoading(false);
				navigate("/dashboard"); // Regular users go to user dashboard
			}
			else{
				message.error(data.error || "Login failed");
				setLoading(false);
			}
		} catch (error) {
			setLoading(false);
			message.error(error.toString());
		}
	};

	if (loading) {
		return <Loader />;
	}

	return (
		<>
			<div className="login-form">
				<Form
					form={form}
					className="form-cont"
					layout="vertical"
					initialValues={{
						remember: true,
					}}
					onFinish={handleAuthentication}
					autoComplete="off">
					<Form.Item
						label="Email"
						name="email"
						rules={[
							{
								required: true,
								message: "Please input your username!",
							},
						]}>
						<Input className="inp" />
					</Form.Item>

					<Form.Item
						label="Password"
						name="password"
						rules={[
							{
								required: true,
								message: "Please input your password!",
							},
						]}>
						<Input.Password
							className="inp"
						/>
					</Form.Item>

					<div className="forgotpass">
						<Link to="/forgot-password">Forgot Password</Link>
					</div>
					
					<div style={{ textAlign: 'center', marginTop: '8px' }}>
						<Link 
							to="/admin/login" 
							style={{ 
								color: '#666', 
								fontSize: '12px',
								textDecoration: 'none'
							}}
						>
							Admin Login
						</Link>
					</div>
					<br />
					<br />
					<Form.Item className="btn">
						<Button type="primary" htmlType="submit">
							Log In
						</Button>
					</Form.Item>
				</Form>
			</div>
		</>
	);
};

export default Login;
