import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, message } from "antd";
import "./auth.css";
import { useAuth } from "../utils/useAuth";
import Loader from "../Loader/Loader";

const Signup = () => {
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { apiurl } = useAuth();

	const handleRegistration = async (values) => {
		setLoading(true);
		try {
			if (values.password === values.confirmpassword) {
				const bodyobj = {
					email: values.email,
					password: values.password,
					username: values.username,
					role: "user",
				};

				const response = await fetch(`${apiurl}/signup/`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(bodyobj),
				});

				const data = await response.json();
				if (response.ok) {
					setLoading(false);
					navigate("/auth", { state: { signupSuccess: data.message }, replace: true });
				} else {
					setLoading(false);
					message.error(data.error);
				}
			} else {
				message.warning("Password and Confirm Password do not match");
				setLoading(false);
			}
		} catch (error) {
			setLoading(false);
			message.error("Registration failed. Please try again.");
		}
	};

	if (loading) {
		return <Loader />;
	}

	return (
		<>
			<div className="signup-form">
				<Form
					className="form-cont"
					layout="vertical"
					onFinish={handleRegistration}
					autoComplete="off">
					<Form.Item
						label="User Name"
						name="username"
						rules={[
							{
								required: true,
								message: "Please enter your user name!",
							},
						]}>
						<Input type="text" className="inp" />
					</Form.Item>
					<Form.Item
						label="Email"
						name="email"
						rules={[
							{
								required: true,
								message: "Please enter your email!",
							},
						]}>
						<Input className="inp" type="email" />
					</Form.Item>
					<Form.Item
						label="Password"
						name="password"
						rules={[
							{
								required: true,
								message: "Please enter your password!",
							},
							{
								min: 8,
								message: "Password must contain at least 8 characters.",
							},
						]}>
						<Input.Password className="inp" />
					</Form.Item>
					<Form.Item
						label="Confirm Password"
						name="confirmpassword"
						rules={[
							{
								required: true,
								message: "Please confirm your password!",
							},
						]}>
						<Input.Password className="inp" />
					</Form.Item>

					<Form.Item className="btn">
						<Button type="primary" className="btn1" htmlType="submit">
							Sign Up
						</Button>
					</Form.Item>
				</Form>
			</div>
		</>
	);
};

export default Signup;
