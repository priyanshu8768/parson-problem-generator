import React, { useState } from "react";
import { Layout, Button, message } from "antd";
import "./Main.css";
import { useNavigate } from "react-router-dom";
import { Modal } from "antd";
import { useAuth } from "../utils/useAuth";

const { Header } = Layout;
const Main = ({ children }) => {
	const navigate = useNavigate();
	const { handleLogout } = useAuth();
	const [isModalOpen, setIsModalOpen] = useState(false);

	const Logout = () => {
		handleLogout();
		message.success("logout successful");
		navigate("/auth");
	};

	return (
		<>
			<Layout>
				<Header className="head">
					<div className="header-logo">
						<a href="/">
							<h2>PARSON PROBLEM GENERATOR</h2>
						</a>
					</div>
					<div className="header-buttons">
						<Button onClick={() => setIsModalOpen(true)}>Logout</Button>
					</div>
				</Header>

				<Modal
					open={isModalOpen}
					onOk={() => {
						Logout();
						setIsModalOpen(false);
					}}
					onCancel={() => setIsModalOpen(false)}>
					<h3>Are you sure to logout?</h3>
				</Modal>
				<div className="content">{children}</div>
			</Layout>
		</>
	);
};
export default Main;
