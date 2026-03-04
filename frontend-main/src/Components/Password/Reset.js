import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Input, message, Card, Form } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../utils/useAuth";
import Loader from "../Loader/Loader";
import animationData from "./../../utils/loginanimation.json";
import Lottie from "react-lottie";

const ResetPasswordForm = () => {
	const [form] = Form.useForm();
	const { uidb64, token } = useParams();
	const navigate = useNavigate();
	const { apiurl } = useAuth();
	const [loading,setLoading] = useState(false);

	const handleSubmit = async (values) => {
		setLoading(true);
		if (values.password !== values.confirmPassword) {
			message.error("Passwords do not match");
			return;
		}

		try {
			const password = values.password;
			
			const response = await fetch(
				`${apiurl}/resetpassword/${uidb64}/${token}/`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ password }),
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				message.error(errorData.message);
				setLoading(false);
				return;

			}
			message.success("Reset Successful.! Redirecting you to login");
			form.resetFields();
			setLoading(false);
			setTimeout(() => {
				navigate("/login");
			}, 1000);
		} catch (error) {
			setLoading(false);
			message.error("An error occurred while resetting the password");
		}
	};

	const defaultOptions = {
		loop: true,
		autoplay: true,
		animationData: animationData,
	};

	if (loading) {
		return (
				<Loader />
		);
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
							<h3>Reset Password</h3>
						</center>
					}>
					<Form
						form={form}
						className="mt-50"
						layout="vertical"
						initialValues={{
							remember: true,
						}}
						onFinish={handleSubmit}
						autoComplete="off">
						<Form.Item
							label="Password"
							name="password"
							rules={[
								{
									required: true,
									message: "Please input your password!",
								},
							]}>
							<Input.Password className="inp" />
						</Form.Item>

						<Form.Item
							label="Confirm Password"
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

export default ResetPasswordForm;
