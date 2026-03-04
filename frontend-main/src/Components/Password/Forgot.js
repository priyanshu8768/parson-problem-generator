import React, { useState } from "react";
import { Button, Input, message } from "antd";
import { Card, Form } from "antd";
import { useAuth } from "../utils/useAuth";
import Loader from "../Loader/Loader";
import Lottie from "react-lottie";
import animationData from "./../../utils/loginanimation.json";

function ForgotPassword() {
	const [form] = Form.useForm();

	const { apiurl } = useAuth();
	const [loading, setLoading] = useState(false);

	const handleForgotPassword = async (values) => {
		setLoading(true);

		try {
			const response = await fetch(`${apiurl}/forgotpassword/`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(values),
			});

			const data = await response.json();
			if (response.ok) {
				setLoading(false);
				message.success(data.success);
				form.resetFields();
			} else {
				setLoading(false);
				message.success(data.error);
			}
		} catch (error) {
			setLoading(false);
			message.error("An error occurred. Please try again.");
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
							<h3>Forgot Password</h3>
						</center>
					}>
					<Form
						form={form}
						className="mt-50"
						layout="vertical"
						initialValues={{
							remember: true,
						}}
						onFinish={handleForgotPassword}
						autoComplete="off">
						<Form.Item
							label="Email ID"
							name="email"
							rules={[
								{
									required: true,
									message: "Please input your username!",
								},
								{
									type: "email",
									message: "Please input your valid Email ID",
								},
							]}>
							<Input className="inp" />
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
}

export default ForgotPassword;
