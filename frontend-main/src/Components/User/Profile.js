import React, { useState, useEffect, useCallback } from "react";
import { Card, Avatar, Typography, Row, Col, Badge, Button, Divider, Spin } from "antd";
import { UserOutlined, TrophyOutlined, FireOutlined, BookOutlined } from "@ant-design/icons";
import { useAuth } from "../utils/useAuth";

const { Title, Text } = Typography;

const Profile = () => {
	const { user, apiurl, token } = useAuth();
	const [results, setResults] = useState([]);
	const [loading, setLoading] = useState(false);

	const fetchResults = useCallback(async () => {
		if (!token) return;
		
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
				setResults(responseData.data || []);
			} else {
				console.error("Failed to fetch results:", responseData);
				// Handle unauthorized access
				if (response.status === 401) {
					console.log("Authentication required for results");
				}
			}
		} catch (error) {
			console.error("Error fetching results:", error);
		} finally {
			setLoading(false);
		}
	}, [apiurl, token]);

	useEffect(() => {
		fetchResults();
	}, [fetchResults]);

	// Calculate statistics from results
	const calculateStats = useCallback(() => {
		const stats = {
			totalSolved: results.length,
			easySolved: 0,
			mediumSolved: 0,
			hardSolved: 0,
			successfulSolved: 0,
			streak: 0,
			points: 0
		};

		results.forEach(result => {
			// Count by difficulty
			if (result.level === 'EASY') stats.easySolved++;
			else if (result.level === 'MEDIUM') stats.mediumSolved++;
			else if (result.level === 'HARD') stats.hardSolved++;

			// Count successful submissions
			if (result.result && (result.result.includes("Test Passed") || result.result.includes("Success"))) {
				stats.successfulSolved++;
				stats.points += result.level === 'EASY' ? 10 : result.level === 'MEDIUM' ? 20 : 30;
			}
		});

		// Calculate streak (simplified - just count recent successful submissions)
		const successfulResults = results.filter(r => 
			r.result && (r.result.includes("Test Passed") || r.result.includes("Success"))
		);
		stats.streak = successfulResults.length;

		return stats;
	}, [results]);

	const statistics = calculateStats();

	if (!user) {
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
		<div style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
			{/* Profile Header */}
			<Card style={{ marginBottom: '24px', borderRadius: '12px' }}>
				<Row gutter={[24, 24]} align="middle">
					<Col xs={24} md={6}>
						<div style={{ textAlign: 'center' }}>
							<Avatar 
								size={120} 
								src={null} 
								icon={<UserOutlined />}
								style={{ 
									border: '4px solid #1890ff',
									boxShadow: '0 4px 12px rgba(24, 144, 255, 0.2)'
								}}
							/>
							<div style={{ marginTop: '16px' }}>
								<Button type="primary" ghost disabled>
									Change Photo
								</Button>
							</div>
						</div>
					</Col>
					<Col xs={24} md={18}>
						<Title level={2} style={{ color: '#1890ff', marginBottom: '8px' }}>
							{user.username || 'User'}
						</Title>
						<Text type="secondary" style={{ fontSize: '16px', marginBottom: '16px', display: 'block' }}>
							{user.email || 'No email available'}
						</Text>
						<Text type="secondary" style={{ fontSize: '14px' }}>
							Role: {user.role || 'Unknown'}
						</Text>
					</Col>
				</Row>
			</Card>

			{/* Statistics Overview */}
			<Card title="Learning Statistics" style={{ marginBottom: '24px', borderRadius: '12px' }}>
				<Row gutter={[16, 16]}>
					<Col xs={12} sm={6}>
						<Card size="small" style={{ textAlign: 'center', background: '#f0f8ff' }}>
							<TrophyOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
							<Title level={3} style={{ margin: 0, color: '#1890ff' }}>
								{loading ? <Spin size="small" /> : statistics.totalSolved}
							</Title>
							<Text type="secondary">Problems Solved</Text>
						</Card>
					</Col>
					<Col xs={12} sm={6}>
						<Card size="small" style={{ textAlign: 'center', background: '#f6ffed' }}>
							<FireOutlined style={{ fontSize: '24px', color: '#fa8c16', marginBottom: '8px' }} />
							<Title level={3} style={{ margin: 0, color: '#fa8c16' }}>
								{loading ? <Spin size="small" /> : statistics.successfulSolved}
							</Title>
							<Text type="secondary">Successful</Text>
						</Card>
					</Col>
					<Col xs={12} sm={6}>
						<Card size="small" style={{ textAlign: 'center', background: '#fff7e6' }}>
							<BookOutlined style={{ fontSize: '24px', color: '#fa8c16', marginBottom: '8px' }} />
							<Title level={3} style={{ margin: 0, color: '#fa8c16' }}>
								{loading ? <Spin size="small" /> : statistics.points}
							</Title>
							<Text type="secondary">Points</Text>
						</Card>
					</Col>
					<Col xs={12} sm={6}>
						<Card size="small" style={{ textAlign: 'center', background: '#f9f0ff' }}>
							<TrophyOutlined style={{ fontSize: '24px', color: '#722ed1', marginBottom: '8px' }} />
							<Title level={3} style={{ margin: 0, color: '#722ed1' }}>
								{loading ? <Spin size="small" /> : (statistics.totalSolved > 0 ? Math.round((statistics.successfulSolved / statistics.totalSolved) * 100) : 0)}%
							</Title>
							<Text type="secondary">Success Rate</Text>
						</Card>
					</Col>
				</Row>
			</Card>

			{/* Difficulty Breakdown */}
			<Card title="Problem Difficulty Breakdown" style={{ marginBottom: '24px', borderRadius: '12px' }}>
				<Row gutter={[16, 16]}>
					<Col xs={24} md={8}>
						<Card size="small" style={{ textAlign: 'center', border: '2px solid #1890ff' }}>
							<Badge count={loading ? 0 : statistics.easySolved} color="#1890ff">
								<Title level={4} style={{ margin: '16px 0' }}>Easy</Title>
							</Badge>
							<Text type="secondary">{loading ? 'Loading...' : `${statistics.easySolved} problems solved`}</Text>
						</Card>
					</Col>
					<Col xs={24} md={8}>
						<Card size="small" style={{ textAlign: 'center', border: '2px solid #fa8c16' }}>
							<Badge count={loading ? 0 : statistics.mediumSolved} color="#fa8c16">
								<Title level={4} style={{ margin: '16px 0' }}>Medium</Title>
							</Badge>
							<Text type="secondary">{loading ? 'Loading...' : `${statistics.mediumSolved} problems solved`}</Text>
						</Card>
					</Col>
					<Col xs={24} md={8}>
						<Card size="small" style={{ textAlign: 'center', border: '2px solid #f5222d' }}>
							<Badge count={loading ? 0 : statistics.hardSolved} color="#f5222d">
								<Title level={4} style={{ margin: '16px 0' }}>Hard</Title>
							</Badge>
							<Text type="secondary">{loading ? 'Loading...' : `${statistics.hardSolved} problems solved`}</Text>
						</Card>
					</Col>
				</Row>
			</Card>

			{/* Account Settings - Placeholder */}
			<Card title="Account Settings" style={{ borderRadius: '12px' }}>
				<Row gutter={[16, 16]}>
					<Col xs={24} md={12}>
						<Button block disabled style={{ height: '48px' }}>
							Edit Profile Information
						</Button>
					</Col>
					<Col xs={24} md={12}>
						<Button block disabled style={{ height: '48px' }}>
							Change Password
						</Button>
					</Col>
					<Col xs={24} md={12}>
						<Button block disabled style={{ height: '48px' }}>
							Notification Preferences
						</Button>
					</Col>
					<Col xs={24} md={12}>
						<Button block disabled style={{ height: '48px' }}>
							Privacy Settings
						</Button>
					</Col>
				</Row>
				<Divider />
				<Text type="secondary" style={{ fontSize: '12px' }}>
					Profile editing and settings features coming soon. These are UI placeholders for future development.
				</Text>
			</Card>
		</div>
	);
};

export default Profile;
