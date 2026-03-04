import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Form, Input, Card, Typography, message, Space, Divider } from "antd";
import { UserOutlined, LockOutlined, ArrowLeftOutlined, SafetyOutlined } from "@ant-design/icons";
import { useAuth } from "../utils/useAuth";
import Loader from "../Loader/Loader";

const { Title } = Typography;

const AdminLogin = () => {
	const [form] = Form.useForm();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const { apiurl, handleLogin } = useAuth();

	const handleAdminLogin = async () => {
		try {
			const values = await form.validateFields();
			setLoading(true);

			const response = await fetch(`${apiurl}/login/`, {
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
			if (response.ok) {
				// Verify that this is an admin user
				if (data.role === "admin") {
					handleLogin(data.access_token);
					message.success("Admin login successful");
					navigate("/admin/dashboard");
				} else {
					message.error("Access denied. Admin credentials required.");
				}
				setLoading(false);
			} else {
				message.error(data.error || "Admin login failed");
				setLoading(false);
			}
		} catch (error) {
			setLoading(false);
			message.error(error.toString());
		}
	};

	const handleBackToLogin = () => {
		navigate("/auth");
	};

	if (loading) {
		return <Loader />;
	}

	return (
		<div style={{ 
			minHeight: '100vh', 
			display: 'flex', 
			alignItems: 'center', 
			justifyContent: 'center',
			background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
			position: 'relative'
		}}>
			{/* Background decoration */}
			<div style={{
				position: 'absolute',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				background: 'rgba(255, 255, 255, 0.1)',
				backdropFilter: 'blur(10px)'
			}}></div>
			
			<Card
				style={{
					width: 420,
					boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
					borderRadius: '16px',
					border: '1px solid rgba(255, 255, 255, 0.2)',
					background: 'rgba(255, 255, 255, 0.95)',
					backdropFilter: 'blur(20px)',
					position: 'relative',
					zIndex: 1
				}}
				bodyStyle={{ padding: '40px' }}
			>
				<div style={{ textAlign: 'center', marginBottom: '32px' }}>
					<div style={{
						width: '64px',
						height: '64px',
						background: 'linear-gradient(135deg, #1890ff, #096dd9)',
						borderRadius: '50%',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						margin: '0 auto 16px',
						boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
					}}>
						<SafetyOutlined style={{ fontSize: '28px', color: '#fff' }} />
					</div>
					<Title level={2} style={{ 
						color: '#1890ff', 
						marginBottom: '8px',
						fontWeight: '600'
					}}>
						Admin Login
					</Title>
					<p style={{ 
						color: '#666', 
						margin: 0,
						fontSize: '14px'
					}}>
						Parson Problem Generator
					</p>
				</div>

				<Divider style={{ margin: '24px 0' }} />

				<Form
					form={form}
					layout="vertical"
					onFinish={handleAdminLogin}
					autoComplete="off"
					size="large"
				>
					<Form.Item
						label="Email or Username"
						name="email"
						rules={[
							{
								required: true,
								message: "Please input your admin email or username!",
							},
						]}
					>
						<Input 
							prefix={<UserOutlined style={{ color: '#1890ff' }} />} 
							placeholder="Admin email or username"
							style={{
								borderRadius: '8px',
								borderColor: '#d9d9d9'
							}}
						/>
					</Form.Item>

					<Form.Item
						label="Password"
						name="password"
						rules={[
							{
								required: true,
								message: "Please input your admin password!",
							},
						]}
					>
						<Input.Password
							prefix={<LockOutlined style={{ color: '#1890ff' }} />}
							placeholder="Admin password"
							style={{
								borderRadius: '8px',
								borderColor: '#d9d9d9'
							}}
						/>
					</Form.Item>

					<Form.Item style={{ marginBottom: '24px' }}>
						<Button 
							type="primary" 
							htmlType="submit" 
							block 
							style={{
								background: 'linear-gradient(135deg, #1890ff, #096dd9)',
								border: 'none',
								borderRadius: '8px',
								height: '48px',
								fontSize: '16px',
								fontWeight: '500',
								boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
							}}
						>
							Admin Login
						</Button>
					</Form.Item>

					<Divider style={{ margin: '16px 0' }} />

					<Space direction="vertical" size="small" style={{ width: '100%' }}>
						<Button 
							type="text" 
							block 
							onClick={handleBackToLogin}
							icon={<ArrowLeftOutlined />}
							style={{ 
								color: '#666',
								height: '40px',
								fontSize: '14px'
							}}
						>
							Back to User Login
						</Button>
					</Space>
				</Form>
			</Card>
		</div>
	);
};

export default AdminLogin;
