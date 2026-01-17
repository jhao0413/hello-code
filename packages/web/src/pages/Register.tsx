import { LockOutlined, UserOutlined, MailOutlined } from '@ant-design/icons';
import { Button, Form, Input, message } from 'antd';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
	const [form] = Form.useForm();
	const navigate = useNavigate();
	const location = useLocation();
	const { register, loading, error, clearError, user } = useAuth();

	const from =
		(location.state as { from?: { pathname: string } })?.from?.pathname || '/';

	useEffect(() => {
		if (user) {
			navigate(from, { replace: true });
		}
	}, [user, navigate, from]);

	useEffect(() => {
		if (error) {
			message.error(error);
			clearError();
		}
	}, [error, clearError]);

	const onFinish = async (values: {
		email: string;
		password: string;
		name: string;
	}) => {
		try {
			await register(values.email, values.password, values.name);
			message.success('注册成功');
			navigate(from, { replace: true });
		} catch {
			// Error is handled by context
		}
	};

	return (
		<div className="min-h-screen w-full flex">
			{/* Left Side - Visual & Branding (Hidden on mobile) */}
			<div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
				<div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 z-0" />
				<div className="absolute top-0 left-0 w-full h-full opacity-30">
					{/* Abstract decorative shapes */}
					<div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
					<div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
					<div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
				</div>

				<div className="relative z-10">
					<div className="flex items-center gap-2 text-2xl font-bold tracking-tight">
						<div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
							<span className="text-white text-lg">H</span>
						</div>
						Hello Code
					</div>
				</div>

				<div className="relative z-10 max-w-lg">
					<h2 className="text-4xl font-bold mb-6 leading-tight">
						加入我们的 <br />
						<span className="text-blue-400">开发者社区</span>
					</h2>
					<p className="text-slate-400 text-lg leading-relaxed">
						"立即注册，体验更智能的编程方式。与数千名开发者一起，探索代码的无限可能。"
					</p>
				</div>

				<div className="relative z-10 text-sm text-slate-500">
					© 2026 Hello Code Inc. All rights reserved.
				</div>
			</div>

			{/* Right Side - Form */}
			<div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8 lg:p-12">
				<motion.div
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.5, ease: 'easeOut' }}
					className="w-full max-w-md"
				>
					<div className="mb-8">
						<h1 className="text-3xl font-bold text-slate-900 mb-2">创建账号</h1>
						<p className="text-slate-500">
							填写以下信息以注册 Hello Code
						</p>
					</div>

					<Form
						form={form}
						name="register"
						onFinish={onFinish}
						layout="vertical"
						size="large"
						className="space-y-4"
					>
						<Form.Item
							name="name"
							label={<span className="text-slate-600 font-medium">名称</span>}
							rules={[{ required: true, message: '请输入名称' }]}
							className="mb-4"
						>
							<Input
								prefix={<UserOutlined className="text-slate-400" />}
								placeholder="您的姓名"
								className="rounded-lg py-2.5 hover:border-blue-400 focus:border-blue-600"
							/>
						</Form.Item>

						<Form.Item
							name="email"
							label={<span className="text-slate-600 font-medium">邮箱</span>}
							rules={[
								{ required: true, message: '请输入邮箱' },
								{ type: 'email', message: '请输入有效的邮箱地址' },
							]}
							className="mb-4"
						>
							<Input
								prefix={<MailOutlined className="text-slate-400" />}
								placeholder="name@example.com"
								className="rounded-lg py-2.5 hover:border-blue-400 focus:border-blue-600"
							/>
						</Form.Item>

						<Form.Item
							name="password"
							label={<span className="text-slate-600 font-medium">密码</span>}
							rules={[
								{ required: true, message: '请输入密码' },
								{ min: 6, message: '密码至少需要6个字符' },
							]}
							className="mb-4"
						>
							<Input.Password
								prefix={<LockOutlined className="text-slate-400" />}
								placeholder="••••••••"
								className="rounded-lg py-2.5 hover:border-blue-400 focus:border-blue-600"
							/>
						</Form.Item>

						<Form.Item
							name="confirmPassword"
							label={
								<span className="text-slate-600 font-medium">确认密码</span>
							}
							dependencies={['password']}
							rules={[
								{ required: true, message: '请确认密码' },
								({ getFieldValue }) => ({
									validator(_, value) {
										if (!value || getFieldValue('password') === value) {
											return Promise.resolve();
										}
										return Promise.reject(new Error('两次输入的密码不一致'));
									},
								}),
							]}
							className="mb-6"
						>
							<Input.Password
								prefix={<LockOutlined className="text-slate-400" />}
								placeholder="••••••••"
								className="rounded-lg py-2.5 hover:border-blue-400 focus:border-blue-600"
							/>
						</Form.Item>

						<Form.Item className="mb-0">
							<Button
								type="primary"
								htmlType="submit"
								loading={loading}
								block
								className="h-12 bg-blue-600 hover:bg-blue-700 border-none shadow-lg shadow-blue-600/20 rounded-lg text-base font-semibold"
							>
								注册
							</Button>
						</Form.Item>
					</Form>

					<div className="mt-8 text-center">
						<p className="text-slate-500">
							已有账号？{' '}
							<Link
								to="/login"
								className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-all"
							>
								立即登录
							</Link>
						</p>
					</div>
				</motion.div>
			</div>
		</div>
	);
}
