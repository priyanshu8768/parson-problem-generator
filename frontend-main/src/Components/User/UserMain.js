import React, { useState } from "react";
import { Layout, Menu, Typography, Avatar, Badge, Button, message } from "antd";
import { UserOutlined, TrophyOutlined, BookOutlined, BarChartOutlined, LogoutOutlined } from "@ant-design/icons";
import { useAuth } from "../utils/useAuth";
import { useNavigate } from "react-router-dom";
import './../../App.css'
import Tests from "./Tests";
import Results from "./Results";
import Profile from "./Profile";
import Dashboard from "./Dashboard";

const { Header, Content } = Layout;
const { Title } = Typography;

const UserMain = () => {
	const [activeTab, setActiveTab] = useState("tests");
	const { user, handleLogout } = useAuth();
	const navigate = useNavigate();

	const handleLogoutClick = () => {
		handleLogout();
		message.success("Logout successful");
		navigate("/auth");
	};

	const menuItems = [
		{
			key: "tests",
			icon: <BookOutlined />,
			label: "Problems",
		},
		{
			key: "dashboard",
			icon: <BarChartOutlined />,
			label: "Dashboard",
		},
		{
			key: "results",
			icon: <TrophyOutlined />,
			label: "Results",
		},
		{
			key: "profile",
			icon: <UserOutlined />,
			label: "Profile",
		},
	];

	const handleMenuClick = (e) => {
		setActiveTab(e.key);
	};

	const renderContent = () => {
		switch (activeTab) {
			case "tests":
				return <Tests />;
			case "dashboard":
				return <Dashboard />;
			case "results":
				return <Results />;
			case "profile":
				return <Profile />;
			default:
				return <Tests />;
		}
	};

	return (
		<Layout style={{ height: '100vh', overflow: 'hidden' }}>
			{/* Fixed Top Navbar */}
			<Header 
				style={{ 
					background: '#fff', 
					borderBottom: '1px solid #f0f0f0',
					padding: '0 24px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center' }}>
					<Title 
						level={3} 
						style={{ 
							margin: 0, 
							color: '#1890ff',
							fontWeight: '700',
							display: 'flex',
							alignItems: 'center'
						}}
					>
						<BookOutlined style={{ marginRight: '12px' }} />
						Parson Problem Generator
					</Title>
				</div>
				
				<div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
					<Badge count={0} showZero={false}>
						<Avatar 
							icon={<UserOutlined />} 
							style={{ backgroundColor: '#1890ff' }}
							title={user?.username || 'User'}
						/>
					</Badge>
					<Button 
						type="text" 
						icon={<LogoutOutlined />} 
						style={{ color: '#666' }}
						onClick={handleLogoutClick}
					>
						Logout
					</Button>
				</div>
			</Header>

			{/* Main Content Area */}
			<Layout style={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
				{/* Sidebar Navigation */}
				<Layout.Sider 
					width={240} 
					style={{ 
						background: '#fff', 
						borderRight: '1px solid #f0f0f0',
						overflow: 'auto'
					}}
				>
					<Menu
						mode="inline"
						selectedKeys={[activeTab]}
						items={menuItems}
						onClick={handleMenuClick}
						style={{ 
							height: '100%', 
							borderRight: 0,
							padding: '16px 0'
						}}
					/>
				</Layout.Sider>

				{/* Content Area */}
				<Content style={{ 
					background: '#f5f5f5', 
					overflow: 'hidden',
					display: 'flex',
					flexDirection: 'column'
				}}>
					{renderContent()}
				</Content>
			</Layout>
		</Layout>
	);
};

export default UserMain;
