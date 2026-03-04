import React from "react";
import { Tabs } from "antd";
import Main from "../Layouts/Main";
import Generate from "./Generate";
import AIGenerate from "./AIGenerate";
import ProblemManagement from "./ProblemManagement";
import "./../Home/Home.css";

const AdminHome = () => {
	return (
		<Main>
			<div className="admin-main">
				<Tabs
					defaultActiveKey="manual"
					centered
					items={[
						{
							key: "manual",
							label: "Manual Create Problem",
							children: <Generate />,
						},
						{
							key: "ai",
							label: "AI Generate Problem",
							children: <AIGenerate />,
						},
						{
							key: "manage",
							label: "Problem Management",
							children: <ProblemManagement />,
						},
					]}
				/>
			</div>
		</Main>
	);
};

export default AdminHome;