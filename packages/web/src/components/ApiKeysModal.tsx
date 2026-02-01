import { KeyOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Button,
	Card,
	CardBody,
	Spinner,
	addToast,
} from '@heroui/react';
import { useState, useEffect } from 'react';
import { authService } from '../services/auth';

interface ApiKey {
	id: string;
	name: string;
	keyPrefix: string;
	createdAt: string;
	lastUsedAt?: string;
	expiresAt: string;
}

interface ApiKeysModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function ApiKeysModal({ isOpen, onClose }: ApiKeysModalProps) {
	const [apiKey, setApiKey] = useState<ApiKey | null>(null);
	const [loading, setLoading] = useState(false);
	const [regenerating, setRegenerating] = useState(false);
	const [fullKey, setFullKey] = useState<string | null>(null);
	const [confirmModalOpen, setConfirmModalOpen] = useState(false);

	useEffect(() => {
		if (isOpen) {
			fetchOrCreateKey();
		}
	}, [isOpen]);

	const fetchOrCreateKey = async () => {
		setLoading(true);
		try {
			const token = authService.getAccessToken();

			// 先尝试获取现有的 key
			const res = await fetch('/api/user/keys', {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();

			if (data.keys && data.keys.length > 0) {
				// 已有 key，直接显示
				setApiKey(data.keys[0]);
			} else {
				// 没有 key，自动创建一个
				await createKey();
			}
		} catch (error) {
			console.error('Failed to fetch API keys:', error);
			addToast({
				title: '获取失败',
				description: '无法获取 API Keys',
				color: 'danger',
			});
		} finally {
			setLoading(false);
		}
	};

	const createKey = async () => {
		try {
			const token = authService.getAccessToken();
			const res = await fetch('/api/user/keys', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					name: 'My API Key',
					expiresIn: 365, // 默认一年
				}),
			});
			const data = await res.json();
			if (data.key) {
				setFullKey(data.key);
				// 重新获取 key 信息
				await fetchKeyInfo();
			} else {
				addToast({
					title: '创建失败',
					description: '无法创建 API Key',
					color: 'danger',
				});
			}
		} catch (error) {
			console.error('Failed to create API key:', error);
			addToast({
				title: '创建失败',
				description: '网络错误，请重试',
				color: 'danger',
			});
		}
	};

	const fetchKeyInfo = async () => {
		try {
			const token = authService.getAccessToken();
			const res = await fetch('/api/user/keys', {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (data.keys && data.keys.length > 0) {
				setApiKey(data.keys[0]);
			}
		} catch (error) {
			console.error('Failed to fetch API key info:', error);
		}
	};

	const handleRegenerate = async () => {
		setConfirmModalOpen(false);
		setRegenerating(true);
		try {
			const token = authService.getAccessToken();

			// 删除旧的 key
			if (apiKey?.id) {
				await fetch(`/api/user/keys/${apiKey.id}`, {
					method: 'DELETE',
					headers: { Authorization: `Bearer ${token}` },
				});
			}

			// 创建新的 key
			await createKey();
		} catch (error) {
			console.error('Failed to regenerate API key:', error);
			addToast({
				title: '重新生成失败',
				description: '网络错误，请重试',
				color: 'danger',
			});
		} finally {
			setRegenerating(false);
		}
	};

	const handleCopy = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			addToast({
				title: '复制成功',
				description: 'API Key 已复制到剪贴板',
				color: 'success',
			});
		} catch (error) {
			addToast({
				title: '复制失败',
				description: '请手动复制',
				color: 'danger',
			});
		}
	};

	const handleCloseFullKey = () => {
		setFullKey(null);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString('zh-CN');
	};

	return (
		<>
			<Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">
								<div className="flex items-center gap-2">
									<KeyOutlined className="text-xl" />
									<span>我的 API Key</span>
								</div>
							</ModalHeader>
							<ModalBody>
								{loading ? (
									<div className="flex justify-center items-center py-8">
										<Spinner size="lg" />
									</div>
								) : fullKey ? (
									// 显示完整的新生成的 key
									<Card className="bg-green-50 border-green-200">
										<CardBody>
											<div className="space-y-4">
												<div className="flex items-center justify-center">
													<span className="text-lg font-semibold text-green-700">
														✓ API Key 生成成功
													</span>
												</div>
												<div className="bg-white p-4 rounded-lg border border-green-300">
													<p className="text-xs text-gray-500 mb-2">API Key（仅显示一次）：</p>
													<code className="text-sm font-mono bg-gray-100 p-3 rounded block break-all">
														{fullKey}
													</code>
												</div>
												<Button
													color="primary"
													startContent={<CopyOutlined />}
													onPress={() => handleCopy(fullKey)}
													className="w-full"
												>
													复制到剪贴板
												</Button>
												<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
													<p className="text-sm text-yellow-800">
														⚠️ 此 Key 仅显示一次，请立即复制保存！
													</p>
												</div>
												<Button variant="light" onPress={handleCloseFullKey} className="w-full">
													我已保存
												</Button>
											</div>
										</CardBody>
									</Card>
								) : apiKey ? (
									// 显示已有的 key（部分隐藏）
									<div className="space-y-4">
										<Card>
											<CardBody>
												<div className="space-y-3">
													<div>
														<p className="text-xs text-gray-500 mb-1">Key 前缀：</p>
														<code className="text-sm font-mono bg-gray-100 px-3 py-2 rounded block">
															{apiKey.keyPrefix}...
														</code>
													</div>
													<div className="grid grid-cols-2 gap-3 text-xs">
														<div>
															<p className="text-gray-500 mb-1">创建时间：</p>
															<p className="text-gray-700">{formatDate(apiKey.createdAt)}</p>
														</div>
														<div>
															<p className="text-gray-500 mb-1">过期时间：</p>
															<p className="text-gray-700">{formatDate(apiKey.expiresAt)}</p>
														</div>
														<div className="col-span-2">
															<p className="text-gray-500 mb-1">最后使用：</p>
															<p className="text-gray-700">
																{apiKey.lastUsedAt ? formatDate(apiKey.lastUsedAt) : '未使用'}
															</p>
														</div>
													</div>
												</div>
											</CardBody>
										</Card>

										<Button
											color="warning"
											variant="flat"
											startContent={<ReloadOutlined />}
											onPress={() => setConfirmModalOpen(true)}
											isLoading={regenerating}
											className="w-full"
										>
											重新生成 API Key
										</Button>
									</div>
								) : (
									<div className="text-center py-8 text-gray-500">
										<p>正在生成您的 API Key...</p>
									</div>
								)}
							</ModalBody>
							<ModalFooter>
								<Button variant="light" onPress={onClose}>
									关闭
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>

			<Modal isOpen={confirmModalOpen} onClose={() => setConfirmModalOpen(false)}>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader>确认操作</ModalHeader>
							<ModalBody>
								<p>确定要重新生成 API Key 吗？旧的 Key 将立即失效。</p>
							</ModalBody>
							<ModalFooter>
								<Button variant="light" onPress={onClose}>
									取消
								</Button>
								<Button color="primary" onPress={handleRegenerate}>
									确认重新生成
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	);
}
