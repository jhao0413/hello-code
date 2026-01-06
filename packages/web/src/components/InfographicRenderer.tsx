import { Infographic } from '@antv/infographic';
import React from 'react';

interface ReactInfographicProps {
	children: React.ReactNode;
}

export const ReactInfographic: React.FC<ReactInfographicProps> = ({
	children,
}) => {
	const containerRef = React.useRef<HTMLDivElement>(null);
	const infographicInstance = React.useRef<Infographic | null>(null);

	React.useEffect(() => {
		if (containerRef.current) {
			infographicInstance.current = new Infographic({
				container: containerRef.current,
			});
		}

		return () => {
			infographicInstance.current?.destroy();
		};
	}, []);

	React.useEffect(() => {
		console.log(children);
		infographicInstance.current?.render(children as string);
	}, [children]);

	return (
		<div
			ref={containerRef}
			style={{ width: 700, minHeight: 400 }}
			className="my-4 border border-gray-200"
		/>
	);
};

export default ReactInfographic;
