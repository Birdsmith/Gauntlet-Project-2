'use client';

import { App, ConfigProvider, theme } from 'antd';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
} 