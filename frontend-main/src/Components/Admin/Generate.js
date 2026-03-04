import React, { useState } from "react";
import { Form, Input, Button, Select, message, Space } from "antd";
import "./../../App.css";
import { useAuth } from "../utils/useAuth";
const { Option } = Select;

const Generate = () => {
	const [loading, setLoading] = useState(false);
	const [testCases, setTestCases] = useState([["", ""]]); // Changed to list of lists
	const { apiurl, token } = useAuth();
	const [form] = Form.useForm();

	const onFinish = async (values) => {
		setLoading(true);
		try {
			const response = await fetch(`${apiurl}/shuffle/`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ ...values, testcases: testCases }),
			});

			const responseData = await response.json();

			if (response.ok) {
				message.success(responseData.message);
				form.resetFields();
				setTestCases([["", ""]]); // Reset test cases to empty list
			} else {
				message.error("Failed to create test");
			}
		} catch (error) {
			message.error("Failed to create test");
		}
		setLoading(false);
	};

	const handleAddTestCase = () => {
		setTestCases([...testCases, ["", ""]]); // Append an empty test case
	};

	const handleChangeTestCaseInput = (value, index) => {
		const updatedTestCases = [...testCases];
		updatedTestCases[index][0] = value; // Update input at index
		setTestCases(updatedTestCases);
	};

	const handleChangeTestCaseOutput = (value, index) => {
		const updatedTestCases = [...testCases];
		updatedTestCases[index][1] = value; // Update output at index
		setTestCases(updatedTestCases);
	};

	return (
		<div className="form-container">
			<Form form={form} name="test_form" layout="vertical" onFinish={onFinish}>
				<Form.Item
					label="Name"
					name="name"
					rules={[{ required: true, message: "Please input the test name" }]}
					className="form-item">
					<Input.TextArea />
				</Form.Item>

				<Form.Item
					label="Level"
					name="level"
					rules={[{ required: true, message: "Please select the level" }]}
					className="form-item">
					<Select placeholder="Select a level">
						<Option value="EASY">Easy</Option>
						<Option value="MEDIUM">Medium</Option>
						<Option value="HARD">Hard</Option>
					</Select>
				</Form.Item>

				<Form.Item
					label="Description"
					name="description"
					rules={[
						{ required: true, message: "Please input the test description" },
					]}
					className="form-item">
					<Input.TextArea />
				</Form.Item>

				<Form.Item
					label="Instructions"
					name="instructions"
					rules={[
						{ required: true, message: "Please input the test instructions" },
					]}
					className="form-item">
					<Input.TextArea />
				</Form.Item>

				<Form.Item
					label="Code"
					name="code"
					rules={[{ required: true, message: "Please input the test code" }]}
					className="form-item">
					<Input.TextArea />
				</Form.Item>

				<Form.Item label="Test Cases" className="form-item">
					{testCases.map((testCase, index) => (
						<Space
							key={index}
							style={{ display: "flex", marginBottom: 8 }}
							align="baseline">
							<Form.Item
								label={`Input ${index + 1}`}
								name={`input${index}`}
								fieldKey={`input${index}`}
								rules={[
									{
										required: true,
										message: "Please input the test case input",
									},
								]}>
								<Input.TextArea
									rows={3}
									value={testCase[0]} // Use input value
									onChange={(e) =>
										handleChangeTestCaseInput(e.target.value, index)
									}
								/>
							</Form.Item>
							<Form.Item
								label={`Output ${index + 1}`}
								name={`output${index}`}
								fieldKey={`output${index}`}
								rules={[
									{
										required: true,
										message: "Please input the expected output",
									},
								]}>
								<Input.TextArea
									rows={3}
									value={testCase[1]} // Use output value
									onChange={(e) =>
										handleChangeTestCaseOutput(e.target.value, index)
									}
								/>
							</Form.Item>
							{index === testCases.length - 1 && (
								<Button
									className="add-button"
									onClick={handleAddTestCase}
									type="primary">
									Add Test Case
								</Button>
							)}
						</Space>
					))}
				</Form.Item>

				<Form.Item>
					<Button type="primary" htmlType="submit" loading={loading}>
						Submit
					</Button>
				</Form.Item>
			</Form>
		</div>
	);
};

export default Generate;
