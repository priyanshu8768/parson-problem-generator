import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
    const navigate = useNavigate();
	
	return (
		<div className="home-cont">
			<h2>Parsons Problem Generator</h2>
            <div>
			<button onClick={() => navigate('/generate')}>Generate</button>
			<button onClick={() => navigate('/solve')}>Solve</button>
            </div>
		</div>
	);
};

export default Home;
