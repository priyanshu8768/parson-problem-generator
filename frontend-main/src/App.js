import { Route, Routes } from "react-router-dom";
import "./App.css";
import { AuthRoute } from "./Components/utils/AuthRoute";
import { AdminRoute } from "./Components/utils/AdminRoute";
import { GuestRoute } from "./Components/utils/GuestRoute";
import Main from "./Components/userauth/main";
import AdminLogin from "./Components/Admin/AdminLogin";
import ChangePasswordForm from "./Components/Password/Change";
import ForgotPassword from "./Components/Password/Forgot";
import ResetPasswordForm from "./Components/Password/Reset";
import MainHome from "./Components/Home/Main";
import AdminHome from "./Components/Admin/AdminHome";
import UserMain from "./Components/User/UserMain";
import Solve from "./Components/User/Solve";


function App() {
	return (
		<>
			<Routes>
				<Route path="/auth" element={<GuestRoute><Main /></GuestRoute>} />
				<Route path="/admin/login" element={<GuestRoute><AdminLogin /></GuestRoute>} />
				<Route path="/forgot-password" element={<ForgotPassword />} />
				<Route path="/reset-password" element={<ResetPasswordForm />} />
				<Route path="/" element={<AuthRoute />}>
					<Route path="/" element={<MainHome />} />
					<Route path="/dashboard" element={<UserMain />} />
					<Route path="/change-password" element={<ChangePasswordForm />} />
					<Route path="/test/:id" element={<Solve />} />
				</Route>
				<Route path="/admin" element={<AdminRoute />}>
					<Route path="/admin/dashboard" element={<AdminHome />} />
				</Route>
			</Routes>
		</>
	);
}

export default App;
