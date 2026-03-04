import React, { useState } from "react";
import { Form, Input, Button, Select, message, Card, Descriptions, Space, Modal } from "antd";
import { EditOutlined, SaveOutlined, ReloadOutlined } from "@ant-design/icons";
import { useAuth } from "../utils/useAuth";
import "./../../App.css";

const { Option } = Select;
const { TextArea } = Input;

const AIGenerate = () => {
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [preview, setPreview] = useState(null);
	const [editModal, setEditModal] = useState(false);
	const [editForm] = Form.useForm();
	const { apiurl, token } = useAuth();
	const [form] = Form.useForm();

	const generateProblem = async () => {
		const values = await form.validateFields(["level"]);
		setLoading(true);
		setPreview(null);
		try {
			const response = await fetch(`${apiurl}/generate-problem/`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					level: values.level,
					topic: values.topic || "",
				}),
			});
			let data;
			try {
				data = await response.json();
			} catch {
				message.error("Invalid server response");
				return;
			}
			if (response.ok) {
				setPreview(data);
				message.success("Problem generated successfully!");
			} else {
				message.error(data.error || "Failed to generate problem");
			}
		} catch (err) {
			message.error(err.message || "Failed to generate problem");
		} finally {
			setLoading(false);
		}
	};

	const openEditModal = () => {
		if (!preview) return;
		
		// Convert testcases from new format {input, output} to edit format
		const editableTestCases = preview.testcases.map(tc => 
			typeof tc === 'object' && tc.input !== undefined ? [tc.input, tc.output] : tc
		);
		
		editForm.setFieldsValue({
			name: preview.name,
			description: preview.description,
			instructions: preview.instructions,
			code: preview.code,
			testcases: editableTestCases,
		});
		setEditModal(true);
	};

	const saveProblem = async (values) => {
		if (!preview) return;
		setSaving(true);
		try {
			// Convert testcases back to the expected format
			const formattedTestCases = values.testcases.map(tc => ({
				input: tc[0],
				output: tc[1]
			}));

			const payload = {
				...values,
				level: preview.level,
				testcases: formattedTestCases,
			};

			const response = await fetch(`${apiurl}/save-generated-problem/`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(payload),
			});
			const data = await response.json();
			if (response.ok) {
				message.success(data.message);
				setPreview(null);
				setEditModal(false);
				form.resetFields();
				editForm.resetFields();
			} else {
				message.error(data.error || "Failed to save problem");
			}
		} catch (err) {
			message.error("Failed to save problem");
		}
		setSaving(false);
	};

	const handleEditSave = async () => {
		try {
			const values = await editForm.validateFields();
			await saveProblem(values);
		} catch (error) {
			// Validation failed
		}
	};

	return (
		<div className="form-container" style={{ maxWidth: 800 }}>
			<Card title="AI Generate Problem" style={{ marginBottom: 24 }}>
				<Form form={form} layout="vertical" onFinish={generateProblem}>
					<Form.Item
						label="Difficulty"
						name="level"
						rules={[{ required: true, message: "Please select difficulty" }]}
					>
						<Select placeholder="Select difficulty">
							<Option value="EASY">Easy</Option>
							<Option value="MEDIUM">Medium</Option>
							<Option value="HARD">Hard</Option>
						</Select>
					</Form.Item>
					<Form.Item label="Topic (optional)" name="topic">
						<Input placeholder="e.g. loops, recursion, lists" />
					</Form.Item>
					<Form.Item>
						<Space>
							<Button type="primary" htmlType="submit" loading={loading} icon={<ReloadOutlined />}>
								Generate Problem
							</Button>
							{preview && (
								<Button onClick={generateProblem} loading={loading}>
									Regenerate
								</Button>
							)}
						</Space>
					</Form.Item>
				</Form>
			</Card>

			{preview && (
				<Card
					title="Generated Problem Preview"
					extra={
						<Space>
							<Button icon={<EditOutlined />} onClick={openEditModal}>
								Edit & Save
							</Button>
							<Button type="primary" onClick={saveProblem} loading={saving} icon={<SaveOutlined />}>
								Save Directly
							</Button>
						</Space>
					}
				>
					<Descriptions column={1} bordered size="small">
						<Descriptions.Item label="Name">{preview.name}</Descriptions.Item>
						<Descriptions.Item label="Level">
							<span style={{
								padding: "2px 8px",
								borderRadius: "4px",
								backgroundColor: preview.level === "EASY" ? "#f6ffed" : 
												preview.level === "MEDIUM" ? "#fffbe6" : "#fff2f0",
								color: preview.level === "EASY" ? "#52c41a" : 
										preview.level === "MEDIUM" ? "#faad14" : "#ff4d4f"
							}}>
								{preview.level}
							</span>
						</Descriptions.Item>
						<Descriptions.Item label="Description">{preview.description}</Descriptions.Item>
						<Descriptions.Item label="Instructions">{preview.instructions}</Descriptions.Item>
						<Descriptions.Item label="Code">
							<pre style={{ 
								background: "#f5f5f5", 
								padding: 12, 
								borderRadius: 4, 
								overflow: "auto", 
								maxHeight: 200,
								fontSize: "12px",
								lineHeight: "1.4"
							}}>
								{preview.code}
							</pre>
						</Descriptions.Item>
						<Descriptions.Item label="Test Cases">
							{preview.testcases && preview.testcases.map((tc, i) => (
								<div key={i} style={{ 
									marginBottom: 8, 
									padding: "8px", 
									background: "#fafafa", 
									borderRadius: 4,
									border: "1px solid #d9d9d9"
								}}>
									<div style={{ fontWeight: "bold", marginBottom: 4 }}>Test Case {i + 1}:</div>
									<div>Input: <code style={{ background: "#e6f7ff", padding: "2px 4px" }}>{tc.input || tc[0]}</code></div>
									<div>Output: <code style={{ background: "#f6ffed", padding: "2px 4px" }}>{tc.output || tc[1]}</code></div>
								</div>
							))}
						</Descriptions.Item>
					</Descriptions>
				</Card>
			)}

			{/* Edit Modal */}
			<Modal
				title="Edit Problem Before Saving"
				open={editModal}
				onCancel={() => setEditModal(false)}
				onOk={handleEditSave}
				confirmLoading={saving}
				width={800}
				okText="Save Problem"
			>
				<Form form={editForm} layout="vertical">
					<Form.Item name="name" label="Name" rules={[{ required: true, message: "Please enter problem name" }]}>
						<Input />
					</Form.Item>
					<Form.Item name="description" label="Description" rules={[{ required: true, message: "Please enter description" }]}>
						<TextArea rows={3} />
					</Form.Item>
					<Form.Item name="instructions" label="Instructions" rules={[{ required: true, message: "Please enter instructions" }]}>
						<TextArea rows={3} />
					</Form.Item>
					<Form.Item name="code" label="Code" rules={[{ required: true, message: "Please enter code" }]}>
						<TextArea rows={8} style={{ fontFamily: "monospace" }} />
					</Form.Item>
					<Form.List name="testcases">
						{(fields, { add, remove }) => (
							<>
								{fields.map(({ key, name, ...restField }) => (
									<Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
										<Form.Item
											{...restField}
											name={[name, 0]}
											label={`Input ${name + 1}`}
											rules={[{ required: true, message: 'Input required' }]}
										>
											<TextArea rows={2} placeholder="Test input" />
										</Form.Item>
										<Form.Item
											{...restField}
											name={[name, 1]}
											label={`Output ${name + 1}`}
											rules={[{ required: true, message: 'Output required' }]}
										>
											<TextArea rows={2} placeholder="Expected output" />
										</Form.Item>
										<Button onClick={() => remove(name)} danger>
											Remove
										</Button>
									</Space>
								))}
								<Form.Item>
									<Button type="dashed" onClick={() => add()} block>
										Add Test Case
									</Button>
								</Form.Item>
							</>
						)}
					</Form.List>
				</Form>
			</Modal>
		</div>
	);
};

export default AIGenerate;
