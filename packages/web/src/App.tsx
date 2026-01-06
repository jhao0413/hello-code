import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Agents from './pages/Agents';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Layout />}>
					<Route index element={<Dashboard />} />
					<Route path="agents" element={<Agents />} />
					<Route path="chat" element={<Chat />} />
				</Route>
			</Routes>
		</BrowserRouter>
	);
}

export default App;
