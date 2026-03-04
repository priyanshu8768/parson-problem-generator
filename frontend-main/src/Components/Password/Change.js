import React, { useState } from "react";
import { Button, Input, message, Form, Card } from "antd";
import { useAuth } from "../utils/useAuth";
import Loader from "../Loader/Loader";
import Lottie from "react-lottie";
import animationData from "./../../utils/loginanimation.json";
import { useNavigate } from "react-router-dom";

const ChangePasswordForm = () => {
	const navigate = useNavigate();
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);

	const { apiurl, token, handleLogout } = useAuth();

	const handleSubmit = async (values) => {
		setLoading(true);
		const currentPassword = values.currentPassword;
		const newPassword = values.newPassword;
		const confirmPassword = values.confirmPassword;

		try {
			const response = await fetch(`${apiurl}/changepassword/`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					currentPassword,
					newPassword,
					confirmPassword,
				}),
			});

			const data = await response.json();

			if (data.success) {
				message.success("Password changed successfully.");
				form.resetFields();
				handleLogout();
				navigate('/auth');
			} else {
				message.error(data.message);
			}
		} catch (error) {
			message.error("An error occurred while changing the password.");
		} finally {
			setLoading(false);
		}
	};


	const defaultOptions = {
		loop: true,
		autoplay: true,
		animationData: animationData,
	};

	if (loading) {
		return <Loader />;
	}

	return (
		<div className="login-main">
			
			<div className="section-2">
				<div className="left-section">
					<Lottie
						isClickToPauseDisabled={true}
						className="login-animation"
						options={defaultOptions}
					/>
				</div>
				<Card
					className="right-section"
					title={
						<center>
							<h3>Change Password</h3>
						</center>
					}>
					<Form
						form={form}
						className="mt-50"
						layout="vertical"
						onFinish={handleSubmit}
						autoComplete="off">
						<Form.Item
							label="Current Password"
							name="currentPassword"
							rules={[
								{
									required: true,
									message: "Please input your password!",
								},
							]}>
							<Input.Password className="inp" />
						</Form.Item>

						<Form.Item
							label="New Password"
							name="newPassword"
							rules={[
								{
									required: true,
									message: "Please input your password!",
								},
							]}>
							<Input.Password className="inp" />
						</Form.Item>

						<Form.Item
							label="Confirm New Password"
							name="confirmPassword"
							rules={[
								{
									required: true,
									message: "Please input your password!",
								},
							]}>
							<Input.Password className="inp" />
						</Form.Item>
						<Form.Item className="centerbtn">
							<Button type="primary" htmlType="submit">
								Submit
							</Button>
						</Form.Item>
					</Form>
				</Card>
			</div>
		</div>
	);
};

export default ChangePasswordForm;
