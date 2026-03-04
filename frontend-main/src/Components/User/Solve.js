import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Card, Typography, Spin, Space, Alert, Divider, Badge, Button } from "antd";
import { 
	BookOutlined, 
	PlayCircleOutlined, 
	BulbOutlined, 
	CheckCircleOutlined, 
	CloseCircleOutlined 
} from "@ant-design/icons";
import { useAuth } from "../utils/useAuth";
import SolveEasy from "./SolveEasy";
import SolveMedium from "./SolveMedium";
import SolveHard from "./SolveHard";
import AIExplanationButton from "../AI/AIExplanationButton";

const { Title, Text } = Typography;

const Solve = () => {
	const [testData, setTestData] = useState(null);
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState(null);
	const [aiExplanation, setAiExplanation] = useState(null);
	const { id } = useParams();
	const { apiurl, token } = useAuth();

	const fetchTest = useCallback(async () => {
		setLoading(true);
		try {
			const response = await fetch(`${apiurl}/test/`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ id: id }),
			});
			const responseData = await response.json();
			if (response.ok) {
				setTestData(responseData.data);
			} else {
				console.error("Failed to fetch test:", responseData);
				// Handle unauthorized access
				if (response.status === 401) {
					console.log("Authentication required");
				} else if (response.status === 404) {
					console.log("Problem not found");
				}
			}
		} catch (error) {
			console.error("Error fetching test:", error);
		} finally {
			setLoading(false);
		}
	}, [apiurl, token, id]);

	useEffect(() => {
		fetchTest();
	}, [fetchTest]); // Add fetchTest to dependency array

	const handleResult = useCallback((resultData) => {
		// Determine success/failure status from backend response
		const resultStatus = determineResultStatus(resultData);
		setResult(resultStatus);
		
		// Capture AI explanation if available
		if (resultData.ai_explanation) {
			setAiExplanation(resultData.ai_explanation);
		} else {
			setAiExplanation(null);
		}
	}, []);

	// Parse backend result to determine success/failure status
	const determineResultStatus = (resultData) => {
		if (!resultData || !resultData.message) {
			return { success: false, message: 'No result data available' };
		}

		// Handle message as string or array
		const message = resultData.message || '';
		let messageString = '';
		
		if (Array.isArray(message)) {
			// If message is an array, join it into a string
			messageString = message.join(' ');
		} else if (typeof message === 'string') {
			messageString = message;
		}
		
		// Check if all test cases passed
		if (messageString.includes('Test Passed!') && !messageString.includes('Test Failed!')) {
			return { success: true, message: messageString };
		}
		
		// Check if any test case failed
		if (messageString.includes('Test Failed!')) {
			return { success: false, message: messageString };
		}
		
		// Default to failure if message exists but no clear success
		if (messageString.trim()) {
			return { success: false, message: messageString };
		}
		
		return { success: false, message: 'Unknown result' };
	};

	// Parse test case results from backend message
	const parseTestResults = (message) => {
		if (!message) {
			return <Text>No test case details available</Text>;
		}

		// Handle message as string or array
		let messageString = '';
		if (Array.isArray(message)) {
			// If message is an array, join it into a string with proper spacing
			messageString = message.join(' ');
		} else if (typeof message === 'string') {
			messageString = message;
		} else {
			return <Text>Invalid message format</Text>;
		}

		// Split by test case indicators
		const testCases = messageString.split(/Running Test Case #\d+:/);
		
		if (testCases.length <= 1) {
			return <Text>{messageString}</Text>;
		}

		return (
			<div>
				{testCases.map((testCase, index) => {
					if (index === 0) return null; // Skip empty first element
					
					const lines = testCase.trim().split('\n');
					const testCaseNumber = lines[0]?.match(/Running Test Case #(\d+)/)?.[1];
					const testResult = lines[1]?.trim();
					const expectedMatch = testResult?.match(/Expected Output:\s*(.+)/);
					const actualMatch = testResult?.match(/Actual Output:\s*(.+)/);
					
					const isPassed = testResult?.includes('Test Passed!');
					
					return (
						<div key={index} style={{ 
							marginBottom: '12px', 
							padding: '12px',
							background: isPassed ? '#f6ffed' : '#fff2f0',
							border: `1px solid ${isPassed ? '#b7eb8f' : '#ffccc7'}`,
							borderRadius: '6px'
						}}>
							<div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
								{isPassed ? (
									<CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
								) : (
									<CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
								)}
								<Text strong style={{ color: isPassed ? '#52c41a' : '#ff4d4f' }}>
									Test Case #{testCaseNumber}: {isPassed ? 'Passed' : 'Failed'}
								</Text>
							</div>
							
							{!isPassed && (
								<div>
									{expectedMatch && (
										<div style={{ marginBottom: '4px' }}>
											<Text type="secondary" style={{ fontSize: '12px' }}>Expected Output:</Text>
											<div style={{ 
												background: '#f5f5f5',
												border: '1px solid #d9d9d9',
												borderRadius: '4px',
												padding: '8px',
												fontFamily: 'monospace',
												fontSize: '12px',
												marginTop: '4px'
											}}>
												{expectedMatch[1]?.trim()}
											</div>
										</div>
									)}
									
									{actualMatch && (
										<div>
											<Text type="secondary" style={{ fontSize: '12px' }}>Actual Output:</Text>
											<div style={{ 
												background: '#f5f5f5',
												border: '1px solid #d9d9d9',
												borderRadius: '4px',
												padding: '8px',
												fontFamily: 'monospace',
												fontSize: '12px',
												marginTop: '4px'
											}}>
												{actualMatch[1]?.trim() || '(No output)'}
											</div>
										</div>
									)}
								</div>
							)}
							
							{isPassed && (
								<Text type="success" style={{ fontSize: '12px', fontStyle: 'italic' }}>
									Passed
								</Text>
							)}
						</div>
					);
				}).filter(Boolean)}
			</div>
		);
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

	if (!testData) {
		return (
			<div style={{ 
				display: 'flex', 
				justifyContent: 'center', 
				alignItems: 'center', 
				height: '100%' 
			}}>
				<Text>No data found for the provided ID</Text>
			</div>
		);
	}

	const { level, shuffled_blocks, name, description, instructions } = testData;

	const getDifficultyColor = (level) => {
		switch (level) {
			case 'EASY': return '#1890ff';
			case 'MEDIUM': return '#fa8c16';
			case 'HARD': return '#f5222d';
			default: return '#666';
		}
	};

	return (
		<div style={{ 
			padding: '24px', 
			height: '100%', 
			overflow: 'auto',
			background: '#f5f5f5'
		}}>
			{/* Problem Header Section */}
			<Card 
				style={{ 
					marginBottom: '24px', 
					borderRadius: '12px',
					boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
				}}
				bodyStyle={{ padding: '24px' }}
			>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
					<Title 
						level={2} 
						style={{ 
							margin: 0, 
							color: '#1890ff',
							fontSize: '28px',
							fontWeight: '700'
						}}
					>
						{name}
					</Title>
					<Badge 
					color={getDifficultyColor(level)}
					style={{ 
						fontSize: '14px', 
						fontWeight: '600',
						padding: '6px 16px',
						borderRadius: '20px',
						textTransform: 'uppercase'
					}}
				>
					{level}
				</Badge>
			</div>
		</Card>

				{/* Description and Instructions Section */}
			<Card 
				title={
					<div style={{ display: 'flex', alignItems: 'center' }}>
						<BookOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
						<span>Problem Details</span>
					</div>
				}
				style={{ 
					marginBottom: '24px', 
					borderRadius: '12px',
					boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
				}}
				bodyStyle={{ padding: '24px' }}
			>
				<div style={{ marginBottom: '24px' }}>
					<Title level={4} style={{ color: '#1890ff', marginBottom: '12px' }}>Description</Title>
					<Text style={{ fontSize: '16px', lineHeight: '1.6' }}>{description}</Text>
				</div>
				
				<Divider />
				
				<div>
					<Title level={4} style={{ color: '#1890ff', marginBottom: '12px' }}>Instructions</Title>
					<Text style={{ fontSize: '16px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
						{instructions}
					</Text>
				</div>
			</Card>

				{/* Code Blocks Section */}
			<Card 
				title={
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<div style={{ display: 'flex', alignItems: 'center' }}>
							<PlayCircleOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
							<span>Code Blocks</span>
						</div>
						<Space>
							<Button type="default" icon={<BulbOutlined />} disabled>
								Get Hint
							</Button>
						</Space>
					</div>
				}
				style={{ 
					marginBottom: '24px', 
					borderRadius: '12px',
					boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
				}}
				bodyStyle={{ padding: '24px' }}
			>
				<div style={{ minHeight: '300px' }}>
					{level === "EASY" && <SolveEasy id={id} blocks={shuffled_blocks} onResult={handleResult} />}
					{level === "MEDIUM" && <SolveMedium id={id} blocks={shuffled_blocks} onResult={handleResult} />}
					{level === "HARD" && <SolveHard id={id} blocks={shuffled_blocks} onResult={handleResult} />}
				</div>
			</Card>

				{/* Output Section */}
			{result && (
				<Card 
					title={
						<div style={{ display: 'flex', alignItems: 'center' }}>
							{result.success ? (
								<CheckCircleOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
							) : (
								<CloseCircleOutlined style={{ marginRight: '8px', color: '#ff4d4f' }} />
							)}
							<span>Output & Results</span>
						</div>
					}
					style={{ 
						marginBottom: '24px', 
						borderRadius: '12px',
						boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
						border: `2px solid ${result.success ? '#52c41a' : '#ff4d4f'}`
					}}
					bodyStyle={{ padding: '24px' }}
				>
					{/* Overall Result Status */}
					<Alert
						message={result.success ? "All Test Cases Passed" : "Some Test Cases Failed"}
						description={result.success ? "Great job! Your solution passed all test cases." : "Please review your solution and try again."}
						type={result.success ? "success" : "error"}
						showIcon
						style={{ marginBottom: '16px' }}
					/>

					{/* Test Case Results */}
					{result.message && !result.success && (
						<div style={{ marginBottom: '20px' }}>
							<Title level={5} style={{ marginBottom: '12px', color: '#ff4d4f' }}>
								Test Case Results
							</Title>
							<div style={{ 
								background: '#fff2f0', 
								border: '1px solid #ffccc7',
								borderRadius: '8px',
								padding: '16px'
							}}>
								{parseTestResults(result.message)}
							</div>
							
							{/* AI Explanation Button */}
							{aiExplanation && (
								<div style={{ marginTop: '16px', textAlign: 'center' }}>
									<AIExplanationButton 
										explanation={aiExplanation}
									/>
								</div>
							)}
						</div>
					)}

					{/* Program Output Section */}
					<div style={{ marginBottom: '16px' }}>
						<Title level={5} style={{ marginBottom: '8px' }}>Program Output:</Title>
						<div style={{
							background: '#f5f5f5',
							border: '1px solid #d9d9d9',
							borderRadius: '6px',
							padding: '12px',
							fontFamily: 'monospace',
							fontSize: '14px',
							whiteSpace: 'pre-wrap',
							minHeight: '60px',
							maxHeight: '200px',
							overflow: 'auto'
						}}>
							{result.output ? result.output : "No output generated"}
						</div>
					</div>
				</Card>
			)}
				<Card 
				title={
					<div style={{ display: 'flex', alignItems: 'center' }}>
						<BulbOutlined style={{ marginRight: '8px', color: '#fa8c16' }} />
						<span>Learning Tips</span>
					</div>
				}
				style={{ 
					marginBottom: '24px', 
					borderRadius: '12px',
					boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
					background: '#fff7e6',
					border: '1px solid #ffd591'
				}}
				bodyStyle={{ padding: '24px' }}
			>
				<ul style={{ margin: 0, paddingLeft: '20px' }}>
					<li>Drag and drop the code blocks in the correct order</li>
					<li>Think about the logical flow of the program</li>
					<li>Consider the input/output requirements</li>
					<li>Test your solution before submitting</li>
				</ul>
			</Card>
		</div>
	);
	};

export default Solve;
