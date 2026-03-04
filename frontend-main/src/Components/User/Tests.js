import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { List, Typography, Spin, Input, Select, Row, Col, Badge, Button } from "antd";
import { SearchOutlined, BookOutlined } from "@ant-design/icons";
import { useAuth } from "../utils/useAuth";

const { Title, Text } = Typography;
const { Option } = Select;

const Tests = () => {
	const [tests, setTests] = useState([]);
	const [loading, setLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [difficultyFilter, setDifficultyFilter] = useState('all');
	const [sortBy, setSortBy] = useState('latest');
	const { apiurl, token } = useAuth();

	const fetchTests = useCallback(async () => {
		setLoading(true);
		try {
			const response = await fetch(`${apiurl}/problems/`, {
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
				console.error("Failed to fetch tests:", responseData);
				// Handle unauthorized access
				if (response.status === 401) {
					// Token might be expired, handle gracefully
					console.log("Authentication required");
				}
			}
		} catch (error) {
			console.error("Error fetching tests:", error);
		} finally {
			setLoading(false);
		}
	}, [apiurl, token]);

	useEffect(() => {
		fetchTests();
	}, [fetchTests]); // Add fetchTests to dependency array

	// Filter and sort tests
	const filteredAndSortedTests = React.useMemo(() => {
		let filtered = tests.filter(test => {
			const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesDifficulty = difficultyFilter === 'all' || test.level === difficultyFilter;
			return matchesSearch && matchesDifficulty;
		});

		// Sort tests
		return filtered.sort((a, b) => {
			switch (sortBy) {
				case 'latest':
					return new Date(b.created_at || 0) - new Date(a.created_at || 0);
				case 'difficulty':
					const difficultyOrder = { 'EASY': 1, 'MEDIUM': 2, 'HARD': 3 };
					return difficultyOrder[a.level] - difficultyOrder[b.level];
				case 'name':
					return a.name.localeCompare(b.name);
				default:
					return 0;
			}
		});
	}, [tests, searchTerm, difficultyFilter, sortBy]);

	const getDifficultyColor = useCallback((level) => {
		switch (level) {
			case 'EASY': return '#1890ff';
			case 'MEDIUM': return '#fa8c16';
			case 'HARD': return '#f5222d';
			default: return '#666';
		}
	}, []);

	const getDifficultyBadge = useCallback((level) => {
		const color = getDifficultyColor(level);
		return (
			<Badge 
				color={color} 
				style={{ 
					fontSize: '12px', 
					fontWeight: '600',
					padding: '4px 8px',
					borderRadius: '12px',
					textTransform: 'uppercase'
				}}
			>
				{level}
			</Badge>
		);
	}, [getDifficultyColor]);

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
			overflow: 'hidden',
			display: 'flex',
			flexDirection: 'column'
		}}>
			{/* Header Section - Fixed */}
			<div style={{ marginBottom: '24px', flexShrink: 0 }}>
				<Title level={2} style={{ color: '#1890ff', marginBottom: '24px' }}>
					Problem Library
				</Title>
				
				{/* Controls Row */}
				<Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
					<Col xs={24} sm={12} md={8}>
						<Input.Search
							placeholder="Search problems..."
							prefix={<SearchOutlined />}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							style={{ borderRadius: '8px' }}
							allowClear
						/>
					</Col>
					<Col xs={12} sm={6} md={4}>
						<Select
							value={difficultyFilter}
							onChange={setDifficultyFilter}
							style={{ width: '100%', borderRadius: '8px' }}
							placeholder="Difficulty"
						>
							<Option value="all">All Levels</Option>
							<Option value="EASY">Easy</Option>
							<Option value="MEDIUM">Medium</Option>
							<Option value="HARD">Hard</Option>
						</Select>
					</Col>
					<Col xs={12} sm={6} md={4}>
						<Select
							value={sortBy}
							onChange={setSortBy}
							style={{ width: '100%', borderRadius: '8px' }}
							placeholder="Sort by"
						>
							<Option value="latest">Latest</Option>
							<Option value="difficulty">Difficulty</Option>
							<Option value="name">Name</Option>
						</Select>
					</Col>
				</Row>
			</div>

			{/* Problem List - Scrollable */}
			<div style={{ 
				flex: 1, 
				overflow: 'hidden',
				background: '#fff',
				borderRadius: '12px',
				border: '1px solid #f0f0f0'
			}}>
				{filteredAndSortedTests.length === 0 ? (
					<div style={{ 
						display: 'flex', 
						flexDirection: 'column',
						justifyContent: 'center', 
						alignItems: 'center', 
						height: '100%',
						padding: '40px'
					}}>
						<BookOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
						<Title level={4} style={{ color: '#8c8c8c', marginBottom: '8px' }}>
							{tests.length === 0 ? 'No problems available' : 'No problems match your filters'}
						</Title>
						<Text type="secondary">
							{tests.length === 0 
								? 'Check back later for new programming problems.' 
								: 'Try adjusting your search or filter criteria.'
							}
						</Text>
					</div>
				) : (
					<List
						dataSource={filteredAndSortedTests}
						style={{ 
							height: '100%', 
							overflow: 'auto',
							padding: '0 16px'
						}}
						renderItem={(test) => (
							<List.Item
								style={{ 
									padding: '16px 0',
									borderBottom: '1px solid #f0f0f0',
									display: 'flex',
									alignItems: 'center'
								}}
								actions={[
									<Link to={`/test/${test.id}`}>
										<Button 
											type="primary" 
											style={{ 
												borderRadius: '6px',
												fontWeight: '600',
												boxShadow: '0 2px 4px rgba(24, 144, 255, 0.3)'
											}}
										>
											Solve
										</Button>
									</Link>
								]}
							>
								<List.Item.Meta
									avatar={
										<div style={{ 
											width: '48px', 
											height: '48px', 
											borderRadius: '8px',
											background: '#f0f8ff',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center'
										}}>
											<BookOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
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
												{test.name}
											</Title>
											{getDifficultyBadge(test.level)}
										</div>
									}
									description={
										<div>
											<Text 
												type="secondary" 
												style={{ 
													fontSize: '14px',
													display: 'block',
													marginBottom: '8px',
													lineHeight: '1.4'
												}}
											>
												{test.description || 'No description available'}
											</Text>
											<Text type="secondary" style={{ fontSize: '12px' }}>
												Created by <Text strong>{test.created_by || 'Unknown'}</Text>
											</Text>
										</div>
									}
								/>
							</List.Item>
						)}
					/>
				)}
			</div>
		</div>
	);
};

export default Tests;
