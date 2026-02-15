import { Agent } from '@mastra/core/agent';
import { weatherTool } from '../tools/index.js';

export const chatAgent1 = new Agent({
	name: 'Chat Agent',
	instructions: 'You are a helpful AI code assistant.',
	model: 'deepseek/deepseek-chat',
	tools: {
		getWeather: weatherTool,
	},
});
