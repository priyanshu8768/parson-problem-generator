import React from "react";
import { Card, Typography, Row, Col, Progress, Skeleton, Badge, Alert, Space } from "antd";
import { 
	BarChartOutlined, 
	TrophyOutlined, 
	FireOutlined, 
	RiseOutlined, 
	AimOutlined,
	LineChartOutlined,
	PieChartOutlined,
	ThunderboltOutlined,
	StarOutlined
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

const Dashboard = () => {
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
					<BarChartOutlined style={{ marginRight: '12px' }} />
					Dashboard
				</Title>
				<Badge 
					color="orange" 
					style={{ 
						fontSize: '12px', 
						fontWeight: '600',
						padding: '4px 12px',
						borderRadius: '12px'
					}}
				>
					BETA - Coming Soon
				</Badge>
			</div>

			{/* Welcome Alert */}
			<Alert
				message="Dashboard Under Development"
				description="This is a preview of upcoming features. Full dashboard functionality with backend integration will be available soon."
				type="info"
				showIcon
				style={{ marginBottom: '24px' }}
			/>

			{/* Overview Statistics */}
			<Card title="Learning Overview" style={{ marginBottom: '24px', borderRadius: '12px' }}>
				<Row gutter={[16, 16]}>
					<Col xs={24} sm={12} md={6}>
						<Card size="small" style={{ textAlign: 'center', background: '#f0f8ff' }}>
							<Skeleton.Button active size="small" style={{ width: 60, height: 60, marginBottom: 8 }} />
							<Title level={3} style={{ margin: 0, color: '#1890ff' }}>--</Title>
							<Text type="secondary">Problems Solved</Text>
						</Card>
					</Col>
					<Col xs={24} sm={12} md={6}>
						<Card size="small" style={{ textAlign: 'center', background: '#f6ffed' }}>
							<Skeleton.Button active size="small" style={{ width: 60, height: 60, marginBottom: 8 }} />
							<Title level={3} style={{ margin: 0, color: '#52c41a' }}>--</Title>
							<Text type="secondary">Current Streak</Text>
						</Card>
					</Col>
					<Col xs={24} sm={12} md={6}>
						<Card size="small" style={{ textAlign: 'center', background: '#fff7e6' }}>
							<Skeleton.Button active size="small" style={{ width: 60, height: 60, marginBottom: 8 }} />
							<Title level={3} style={{ margin: 0, color: '#fa8c16' }}>--</Title>
							<Text type="secondary">Learning Points</Text>
						</Card>
					</Col>
					<Col xs={24} sm={12} md={6}>
						<Card size="small" style={{ textAlign: 'center', background: '#f9f0ff' }}>
							<Skeleton.Button active size="small" style={{ width: 60, height: 60, marginBottom: 8 }} />
							<Title level={3} style={{ margin: 0, color: '#722ed1' }}>--%</Title>
							<Text type="secondary">Progress Rate</Text>
						</Card>
					</Col>
				</Row>
			</Card>

			{/* Progress Tracking */}
			<Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
				<Col xs={24} md={12}>
					<Card 
						title={
							<div style={{ display: 'flex', alignItems: 'center' }}>
								<LineChartOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
								<span>Progress Tracking</span>
							</div>
						}
						style={{ borderRadius: '12px', height: '300px' }}
					>
						<div style={{ textAlign: 'center', padding: '40px 0' }}>
							<Skeleton.Button active style={{ width: '100%', height: 200, marginBottom: 16 }} />
							<Text type="secondary">Weekly progress chart coming soon</Text>
						</div>
					</Card>
				</Col>
				<Col xs={24} md={12}>
					<Card 
						title={
							<div style={{ display: 'flex', alignItems: 'center' }}>
								<PieChartOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
								<span>Topic Distribution</span>
							</div>
						}
						style={{ borderRadius: '12px', height: '300px' }}
					>
						<div style={{ textAlign: 'center', padding: '40px 0' }}>
							<Skeleton.Button active style={{ width: '100%', height: 200, marginBottom: 16 }} />
							<Text type="secondary">Topic-wise analysis coming soon</Text>
						</div>
					</Card>
				</Col>
			</Row>

			{/* Learning Streaks & Achievements */}
			<Card 
				title={
					<div style={{ display: 'flex', alignItems: 'center' }}>
						<FireOutlined style={{ marginRight: '8px', color: '#fa8c16' }} />
						<span>Learning Streaks & Achievements</span>
					</div>
				}
				style={{ marginBottom: '24px', borderRadius: '12px' }}
			>
				<Row gutter={[16, 16]}>
					<Col xs={24} md={12}>
						<div style={{ textAlign: 'center', padding: '20px' }}>
							<Skeleton.Avatar active size={80} style={{ marginBottom: 16 }} />
							<Title level={4}>Streak Tracking</Title>
							<Paragraph type="secondary">
								Track your daily learning streaks and maintain consistency in your coding practice.
							</Paragraph>
							<Progress percent={0} showInfo={false} style={{ marginTop: 16 }} />
						</div>
					</Col>
					<Col xs={24} md={12}>
						<div style={{ textAlign: 'center', padding: '20px' }}>
							<Skeleton.Avatar active size={80} style={{ marginBottom: 16 }} />
							<Title level={4}>Achievement Badges</Title>
							<Paragraph type="secondary">
								Earn badges and rewards as you complete problems and reach milestones.
							</Paragraph>
							<Space size="large" style={{ marginTop: 16 }}>
								<Skeleton.Button active size="small" />
								<Skeleton.Button active size="small" />
								<Skeleton.Button active size="small" />
							</Space>
						</div>
					</Col>
				</Row>
			</Card>

			{/* Recommendations */}
			<Card 
				title={
					<div style={{ display: 'flex', alignItems: 'center' }}>
						<AimOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
						<span>Personalized Recommendations</span>
					</div>
				}
				style={{ marginBottom: '24px', borderRadius: '12px' }}
			>
				<Row gutter={[16, 16]}>
					{[1, 2, 3].map((item) => (
						<Col xs={24} md={8} key={item}>
							<Card size="small" style={{ height: '120px' }}>
								<Skeleton active paragraph={{ rows: 2 }} />
							</Card>
						</Col>
					))}
				</Row>
				<div style={{ textAlign: 'center', marginTop: 16 }}>
					<Text type="secondary">
						Get AI-powered problem recommendations based on your learning patterns and progress.
					</Text>
				</div>
			</Card>

			{/* Upcoming Features */}
			<Card 
				title={
					<div style={{ display: 'flex', alignItems: 'center' }}>
						<RiseOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
						<span>Upcoming Features</span>
					</div>
				}
				style={{ borderRadius: '12px' }}
			>
				<Row gutter={[16, 16]}>
					<Col xs={24} md={8}>
						<div style={{ textAlign: 'center', padding: '16px' }}>
							<ThunderboltOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '12px' }} />
							<Title level={5}>Performance Analytics</Title>
							<Text type="secondary">
								Detailed insights into your coding performance and improvement areas.
							</Text>
						</div>
					</Col>
					<Col xs={24} md={8}>
						<div style={{ textAlign: 'center', padding: '16px' }}>
							<StarOutlined style={{ fontSize: '32px', color: '#fa8c16', marginBottom: '12px' }} />
							<Title level={5}>Learning Paths</Title>
							<Text type="secondary">
								Structured learning paths for different programming topics and skills.
							</Text>
						</div>
					</Col>
					<Col xs={24} md={8}>
						<div style={{ textAlign: 'center', padding: '16px' }}>
							<TrophyOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '12px' }} />
							<Title level={5}>Leaderboards</Title>
							<Text type="secondary">
								Compete with peers and track your ranking on global leaderboards.
							</Text>
						</div>
					</Col>
				</Row>
			</Card>

			{/* Beta Notice */}
			<Alert
				message="Beta Version Notice"
				description="This dashboard is currently in beta. All data shown is for demonstration purposes only. Full functionality with real data integration will be available in upcoming releases."
				type="warning"
				showIcon
				style={{ marginTop: '24px' }}
			/>
		</div>
	);
};

export default Dashboard;
