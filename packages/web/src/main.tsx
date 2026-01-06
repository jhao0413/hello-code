import { HeroUIProvider } from '@heroui/react';
import { ConfigProvider } from 'antd';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
	throw new Error('Failed to find the root element');
}

createRoot(rootElement).render(
	<StrictMode>
		<HeroUIProvider>
			<ConfigProvider
				theme={{
					token: {
						colorPrimary: '#006FEE',
					},
				}}
			>
				<App />
			</ConfigProvider>
		</HeroUIProvider>
	</StrictMode>,
);
