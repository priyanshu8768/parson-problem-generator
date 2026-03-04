import React, { useState } from "react";
import "./../../App.css";
import { useAuth } from "../utils/useAuth";
import Success from "../userauth/Success";
import Loader from "../Loader/Loader";

const Solve = ({ id, blocks, onResult }) => {
	const [loading, setLoading] = useState(false);
	const { apiurl, token } = useAuth();
	const [success, setSuccess] = useState(false);
	const [message, setMessage] = useState("");
	const [arrangedBlocks, setArrangedBlocks] = useState(
		Array(blocks.length).fill([])
	);

	const handleDragStart = (e, index) => {
		e.dataTransfer.setData("index", index);
	};

	const handleDragOver = (e) => {
		e.preventDefault();
	};

	const handleDrop = (e, newIndex) => {
		e.preventDefault();
		const oldIndex = e.dataTransfer.getData("index");
		const newBlocks = [...arrangedBlocks];
		const draggedBlock = blocks[oldIndex];
		for (let i = 0; i < newBlocks.length; i++) {
			if (newBlocks[i] === draggedBlock) {
				newBlocks[i] = [];
			}
		}
		newBlocks[newIndex] = draggedBlock;
		setArrangedBlocks(newBlocks);

		const blockContainer = e.target;
		const textarea = blockContainer.querySelector("textarea");
		if (textarea) {
			adjustTextareaHeight(textarea);
		}
	};

	const adjustTextareaHeight = (textarea) => {
		textarea.style.height = "auto";
		textarea.style.height = `${textarea.scrollHeight}px`;
	};

	const handleDelete = (index) => {
		const newBlocks = [...arrangedBlocks];
		newBlocks[index] = [];
		setArrangedBlocks(newBlocks);
	};

	const handleSubmit = async () => {
		setLoading(true);
		try {
			const response = await fetch(`${apiurl}/result/`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ id: id, code: arrangedBlocks }),
			});
			const responseData = await response.json();
			if (response.ok) {
				setArrangedBlocks(Array(blocks.length).fill([]));
				setSuccess(true);
				setMessage(responseData.resultmsg);
				
				// Notify parent of result
				if (onResult) {
					onResult({
						success: responseData.resultmsg === "Test Passed!",
						output: responseData.output || "No output available",
						message: responseData.resultmsg,
						ai_explanation: responseData.ai_explanation  // Pass AI explanation
					});
				}
			} else {
				console.error("Failed to", responseData);
				
				// Notify parent of result
				if (onResult) {
					onResult({
						success: false,
						output: responseData.output || "No output available",
						message: responseData.resultmsg || "Test failed",
						ai_explanation: responseData.ai_explanation  // Pass AI explanation
					});
				}
			}
		} catch (error) {
			console.error("Error fetching test:", error);
			
			// Notify parent of error
			if (onResult) {
				onResult({
					success: false,
					output: "Error occurred during submission",
					message: "Network error occurred",
					ai_explanation: null  // No AI explanation on error
				});
			}
		}
		setLoading(false);
	};

	const handleReset = () => {
		setArrangedBlocks(Array(blocks.length).fill([]));
	};

	const handleInputChange = (index, e) => {
		const newValue = e.target.value;
		const newBlocks = [...arrangedBlocks];
		newBlocks[index] = newValue.split("\n");
		setArrangedBlocks(newBlocks);

		const textarea = e.target;
		textarea.style.height = "auto";
		textarea.style.height = `${textarea.scrollHeight}px`;

		console.log("Textarea content:", newValue);
		console.log("Textarea scrollHeight:", textarea.scrollHeight);
	};


	if(loading){
		return <Loader />
	}
	if (success) {
		return <Success title={message} />;
	}


	return (
		<>
			<div className="code-blocks-container">
				<div className="blocks-panel">
					<h3>Parson Code Blocks</h3>
					<ul>
						{blocks.map((block, index) => (
							<li
								key={index}
								draggable="true"
								onDragStart={(e) => handleDragStart(e, index)}>
								<pre>{block.join("\n")}</pre>
							</li>
						))}
					</ul>
				</div>
				<div className="empty-boxes-panel">
					<h3>Correct Code</h3>
					<ul>
						{arrangedBlocks.map((block, index) => (
							<li
								key={index}
								onDragOver={handleDragOver}
								onDrop={(e) => handleDrop(e, index)}>
								<textarea
									style={{ height: "auto" }}
									value={block.join("\n")}
									onChange={(e) => handleInputChange(index, e)}></textarea>

								<button onClick={() => handleDelete(index)}>🚫</button>
							</li>
						))}
					</ul>
					<div className="button-panel">
						<button onClick={handleSubmit}>Submit</button>
						<button onClick={handleReset}>Reset</button>
					</div>
				</div>
			</div>
		</>
	);
};

export default Solve;
