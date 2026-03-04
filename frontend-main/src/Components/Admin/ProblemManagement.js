import React, { useEffect, useState, useCallback } from "react";
import { Table, Button, message, Modal, Badge, Space, Form, Input, Select, Tag, Tooltip } from "antd";
import { EyeOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
import { useAuth } from "../utils/useAuth";
import "./../../App.css";

const { Option } = Select;
const { TextArea } = Input;

const ProblemManagement = () => {
	const [problems, setProblems] = useState([]);
	const [counts, setCounts] = useState({ EASY: 0, MEDIUM: 0, HARD: 0 });
	const [loading, setLoading] = useState(true);
	const [viewModal, setViewModal] = useState(false);
	const [editModal, setEditModal] = useState(false);
	const [selected, setSelected] = useState(null);
	const [form] = Form.useForm();
	const { apiurl, token } = useAuth();

	const fetchProblems = useCallback(async () => {
		setLoading(true);
		try {
			const response = await fetch(`${apiurl}/problems/`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await response.json();
			if (response.ok) {
				setProblems(data.data || []);
				setCounts(data.counts || { EASY: 0, MEDIUM: 0, HARD: 0 });
			} else {
				message.error(data.error || "Failed to fetch problems");
			}
		} catch (err) {
			message.error("Failed to fetch problems");
		}
		setLoading(false);
	}, [apiurl, token]);

	useEffect(() => {
		fetchProblems();
	}, [fetchProblems]);

	const fetchOne = async (id) => {
		try {
			const response = await fetch(`${apiurl}/problems/${id}/`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await response.json();
			if (response.ok) return data;
		} catch (err) {}
		return null;
	};

	const handleView = async (record) => {
		const full = await fetchOne(record.id);
		if (full) {
			setSelected(full);
			setViewModal(true);
		}
	};

	const handleEdit = async (record) => {
		const full = await fetchOne(record.id);
		if (full) {
			setSelected(full);
			form.setFieldsValue({
				name: full.name,
				level: full.level,
				description: full.description,
				instructions: full.instructions,
				code: full.code,
			});
			setEditModal(true);
		}
	};

	const handleDelete = (record) => {
		Modal.confirm({
			title: "Delete Problem",
			content: `Are you sure you want to delete "${record.name}"? This action cannot be undone.`,
			okText: "Delete",
			okType: "danger",
			cancelText: "Cancel",
			onOk: async () => {
				try {
					const response = await fetch(`${apiurl}/problems/${record.id}/`, {
						method: "DELETE",
						headers: { Authorization: `Bearer ${token}` },
					});
					const data = await response.json();
					if (response.ok) {
						message.success(data.message || "Problem deleted successfully");
						fetchProblems();
					} else {
						message.error(data.error || "Delete failed");
					}
				} catch (err) {
					message.error("Delete failed");
				}
			},
		});
	};

	const handleEditSave = async () => {
		const values = await form.validateFields();
		if (!selected) return;
		try {
			const payload = {
				...values,
				testcases: selected.testcases || [],
			};
			const response = await fetch(`${apiurl}/problems/${selected.id}/`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(payload),
			});
			const data = await response.json();
			if (response.ok) {
				message.success(data.message || "Problem updated successfully");
				setEditModal(false);
				fetchProblems();
			} else {
				message.error(data.error || "Update failed");
			}
		} catch (err) {
			message.error("Update failed");
		}
	};

	const getDifficultyColor = (level) => {
		switch (level) {
			case "EASY": return "green";
			case "MEDIUM": return "orange";
			case "HARD": return "red";
			default: return "default";
		}
	};

	const columns = [
		{ 
			title: "Name", 
			dataIndex: "name", 
			key: "name", 
			ellipsis: true,
			render: (text) => (
				<Tooltip title={text}>
					<span style={{ fontWeight: 500 }}>{text}</span>
				</Tooltip>
			)
		},
		{
			title: "Difficulty",
			dataIndex: "level",
			key: "level",
			width: 120,
			render: (level) => (
				<Tag color={getDifficultyColor(level)}>
					{level}
				</Tag>
			),
		},
		{ 
			title: "Created By", 
			dataIndex: "created_by", 
			key: "created_by", 
			width: 140,
			render: (text) => (
				<span style={{ color: "#666" }}>{text || "—"}</span>
			)
		},
		{
			title: "Actions",
			key: "actions",
			width: 200,
			render: (_, record) => (
				<Space size="small">
					<Tooltip title="View">
						<Button 
							size="small" 
							icon={<EyeOutlined />} 
							onClick={() => handleView(record)}
						/>
					</Tooltip>
					<Tooltip title="Edit">
						<Button 
							size="small" 
							type="primary" 
							icon={<EditOutlined />} 
							onClick={() => handleEdit(record)}
						/>
					</Tooltip>
					<Tooltip title="Delete">
						<Button 
							size="small" 
							danger 
							icon={<DeleteOutlined />} 
							onClick={() => handleDelete(record)}
						/>
					</Tooltip>
				</Space>
			),
		},
	];

	return (
		<div className="admin-problem-mgmt" style={{ padding: "0 20px" }}>
			{/* Header with counts and refresh */}
			<div style={{ 
				marginBottom: 24, 
				display: "flex", 
				justifyContent: "space-between", 
				alignItems: "center",
				flexWrap: "wrap",
				gap: 16
			}}>
				<div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
					<span style={{ fontWeight: 600, fontSize: "16px" }}>Problem Overview</span>
					<Space size="middle">
						<Badge count={counts.EASY} showZero style={{ backgroundColor: "#52c41a" }}>
							<Tag color="green" style={{ padding: "4px 12px" }}>EASY</Tag>
						</Badge>
						<Badge count={counts.MEDIUM} showZero style={{ backgroundColor: "#faad14" }}>
							<Tag color="orange" style={{ padding: "4px 12px" }}>MEDIUM</Tag>
						</Badge>
						<Badge count={counts.HARD} showZero style={{ backgroundColor: "#ff4d4f" }}>
							<Tag color="red" style={{ padding: "4px 12px" }}>HARD</Tag>
						</Badge>
					</Space>
				</div>
				<Button 
					icon={<ReloadOutlined />} 
					onClick={fetchProblems}
					loading={loading}
				>
					Refresh
				</Button>
			</div>

			{/* Enhanced Table */}
			<Table
				columns={columns}
				dataSource={problems}
				rowKey="id"
				loading={loading}
				pagination={{ 
					pageSize: 10,
					showSizeChanger: true,
					showQuickJumper: true,
					showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} problems`
				}}
				scroll={{ x: 800 }}
				size="middle"
				style={{ 
					background: "#fff",
					borderRadius: "8px",
					boxShadow: "0 1px 3px rgba(0,0,0,0.12)"
				}}
			/>

			{/* View Modal */}
			<Modal
				title="Problem Details"
				open={viewModal}
				onCancel={() => setViewModal(false)}
				footer={[
					<Button key="close" onClick={() => setViewModal(false)}>Close</Button>,
					<Button key="edit" type="primary" onClick={() => { 
						setViewModal(false); 
						selected && handleEdit({ id: selected.id }); 
					}}>
						Edit Problem
					</Button>,
				]}
				width={800}
			>
				{selected && (
					<div style={{ lineHeight: "1.6" }}>
						<div style={{ marginBottom: 16 }}>
							<strong>Name:</strong> 
							<span style={{ marginLeft: 8, fontSize: "16px", color: "#1890ff" }}>
								{selected.name}
							</span>
						</div>
						<div style={{ marginBottom: 16 }}>
							<strong>Difficulty:</strong> 
							<Tag color={getDifficultyColor(selected.level)} style={{ marginLeft: 8 }}>
								{selected.level}
							</Tag>
						</div>
						<div style={{ marginBottom: 16 }}>
							<strong>Created By:</strong> 
							<span style={{ marginLeft: 8, color: "#666" }}>
								{selected.created_by || "—"}
							</span>
						</div>
						<div style={{ marginBottom: 16 }}>
							<strong>Description:</strong>
							<p style={{ marginTop: 8, padding: "12px", background: "#f5f5f5", borderRadius: "4px" }}>
								{selected.description}
							</p>
						</div>
						<div style={{ marginBottom: 16 }}>
							<strong>Instructions:</strong>
							<p style={{ marginTop: 8, padding: "12px", background: "#f5f5f5", borderRadius: "4px" }}>
								{selected.instructions}
							</p>
						</div>
						<div style={{ marginBottom: 16 }}>
							<strong>Code:</strong>
							<pre style={{ 
								marginTop: 8, 
								padding: 12, 
								background: "#f5f5f5", 
								borderRadius: 4, 
								overflow: "auto", 
								maxHeight: 300,
								fontSize: "12px",
								lineHeight: "1.4"
							}}>
								{selected.code}
							</pre>
						</div>
						<div>
							<strong>Test Cases:</strong>
							<div style={{ marginTop: 8 }}>
								{selected.testcases && selected.testcases.map((tc, i) => (
									<div key={i} style={{ 
										marginBottom: 12, 
										padding: "12px", 
										background: "#fafafa", 
										borderRadius: 4,
										border: "1px solid #d9d9d9"
									 }}>
										<div style={{ fontWeight: "bold", marginBottom: 8, color: "#1890ff" }}>
											Test Case {i + 1}:
										</div>
										<div style={{ marginBottom: 4 }}>
											<strong>Input:</strong> 
											<code style={{ 
												marginLeft: 8, 
												padding: "2px 6px", 
												background: "#e6f7ff", 
												borderRadius: "2px",
												display: "inline-block"
											}}>
												{tc[0]}
											</code>
										</div>
										<div>
											<strong>Output:</strong> 
											<code style={{ 
												marginLeft: 8, 
												padding: "2px 6px", 
												background: "#f6ffed", 
												borderRadius: "2px",
												display: "inline-block"
											}}>
												{tc[1]}
											</code>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				)}
			</Modal>

			{/* Edit Modal */}
			<Modal
				title="Edit Problem"
				open={editModal}
				onCancel={() => setEditModal(false)}
				onOk={handleEditSave}
				width={800}
				okText="Save Changes"
			>
				<Form form={form} layout="vertical">
					<Form.Item name="name" label="Name" rules={[{ required: true, message: "Please enter problem name" }]}>
						<Input />
					</Form.Item>
					<Form.Item name="level" label="Level" rules={[{ required: true, message: "Please select level" }]}>
						<Select>
							<Option value="EASY">EASY</Option>
							<Option value="MEDIUM">MEDIUM</Option>
							<Option value="HARD">HARD</Option>
						</Select>
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
				</Form>
			</Modal>
		</div>
	);
};

export default ProblemManagement;
