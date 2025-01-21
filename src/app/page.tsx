'use client';

import TextForm from '@/components/TextForm';
import { Typography, Layout } from 'antd';

const { Title } = Typography;
const { Content } = Layout;

export default function Home() {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Content style={{ padding: '48px 24px' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
          Test Data Entry
        </Title>
        <TextForm />
      </Content>
    </Layout>
  );
} 