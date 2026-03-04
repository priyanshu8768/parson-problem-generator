import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { List, Typography, Spin, Card, Badge, Button, Tag, Empty } from "antd";
import { TrophyOutlined, CheckCircleOutlined, CloseCircleOutlined, BookOutlined } from "@ant-design/icons";
import { useAuth } from "../utils/useAuth";

const { Title, Text } = Typography;

const Results = () => {
	const [tests, setTests] = useState([]);
	const [loading, setLoading] = useState(false);
	const { apiurl, token } = useAuth();

	const fetchTests = useCallback(async () => {
		setLoading(true);
		try {
			const response = await fetch(`${apiurl}/result/`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			});
			const responseData = await response.json();
			if (response.ok) {
				setTests(responseData.data || []);
			} else {
				console.error("Failed to fetch results:", responseData);
				// Handle unauthorized access
				if (response.status === 401) {
					console.log("Authentication required");
				}
			}
		} catch (error) {
			console.error("Error fetching results:", error);
		} finally {
			setLoading(false);
		}
	}, [apiurl, token]);

	useEffect(() => {
		fetchTests();
	}, [fetchTests]); // Add fetchTests to dependency array

	const getResultStatus = (result) => {
		if (result.includes("Test Passed") || result.includes("Success")) {
			return {
				status: "success",
				color: "#52c41a",
				icon: <CheckCircleOutlined />,
				text: "Passed"
			};
		} else {
			return {
				status: "error",
				color: "#ff4d4f",
				icon: <CloseCircleOutlined />,
				text: "Failed"
			};
		}
	};

	const getDifficultyColor = (level) => {
		switch (level) {
			case 'EASY': return '#1890ff';
			case 'MEDIUM': return '#fa8c16';
			case 'HARD': return '#f5222d';
			default: return '#666';
		}
	};

	const formatDate = (dateString) => {
		if (!dateString) return "Unknown date";
		try {
			return new Date(dateString).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return "Invalid date";
		}
	};

	if (loading) {
		return (
			<div style={{ 
				display: 'flex', 
				justifyContent: 'center', 
				alignItems: 'center', 
				height: '100%' 
			}}>
				<Spin size="large" />
			</div>
		);
	}

	return (
		<div style={{ 
			padding: '24px', 
			height: '100%', 
			overflow: 'auto',
			background: '#f5f5f5'
		}}>
			{/* Header Section */}
			<div style={{ marginBottom: '24px' }}>
				<Title level={2} style={{ color: '#1890ff', marginBottom: '8px' }}>
					<TrophyOutlined style={{ marginRight: '12px' }} />
					Submission Results
				</Title>
				<Text type="secondary">
					View your problem-solving history and performance
				</Text>
			</div>

			{/* Results List */}
			<Card 
				style={{ 
					borderRadius: '12px',
					boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
				}}
				bodyStyle={{ padding: 0 }}
			>
				{tests.length === 0 ? (
					<div style={{ padding: '60px 24px', textAlign: 'center' }}>
						<Empty
							image={<TrophyOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />}
							description={
								<div>
									<Title level={4} style={{ color: '#8c8c8c', marginBottom: '8px' }}>
										No submissions yet
									</Title>
									<Text type="secondary">
										Start solving problems to see your results here
									</Text>
								</div>
							}
						>
							<Link to="/usermain">
								<Button type="primary" icon={<BookOutlined />}>
									Browse Problems
								</Button>
							</Link>
						</Empty>
					</div>
				) : (
					<List
						dataSource={tests}
						style={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}
						renderItem={(result) => {
							const statusInfo = getResultStatus(result.result);
							return (
								<List.Item
									style={{ 
										padding: '20px 24px',
										borderBottom: '1px solid #f0f0f0',
										display: 'flex',
										alignItems: 'center'
									}}
									actions={[
										<Tag color={statusInfo.color} icon={statusInfo.icon}>
											{statusInfo.text}
										</Tag>
									]}
								>
									<List.Item.Meta
										avatar={
											<div style={{ 
												width: '48px', 
												height: '48px', 
												borderRadius: '8px',
												background: statusInfo.status === 'success' ? '#f6ffed' : '#fff2f0',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center'
											}}>
												{statusInfo.icon}
											</div>
										}
										title={
											<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
												<Title 
													level={5} 
													style={{ 
														margin: 0, 
														color: '#1890ff',
														fontWeight: '600'
													}}
												>
													{result.test}
												</Title>
												{result.level && (
													<Badge 
														color={getDifficultyColor(result.level)}
														style={{ 
															fontSize: '10px', 
															fontWeight: '600',
															padding: '2px 6px',
															borderRadius: '8px',
															textTransform: 'uppercase'
														}}
													>
														{result.level}
													</Badge>
												)}
											</div>
										}
										description={
											<div>
												<Text 
													type="secondary" 
													style={{ 
														fontSize: '13px',
														display: 'block',
														marginBottom: '8px',
														lineHeight: '1.4'
													}}
												>
													{result.result}
												</Text>
												<div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
													<Text type="secondary" style={{ fontSize: '12px' }}>
														Submitted by <Text strong>{result.user}</Text>
													</Text>
													{result.created_at && (
														<Text type="secondary" style={{ fontSize: '12px' }}>
															{formatDate(result.created_at)}
														</Text>
													)}
												</div>
											</div>
										}
									/>
								</List.Item>
							);
						}}
					/>
				)}
			</Card>
		</div>
	);
};

export default Results;
