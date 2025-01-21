import { Button, Input, message, Card, Space } from 'antd';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const TextForm = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) {
      message.error('Please enter some text');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('entries').insert([{ content: text }]);

      if (error) throw error;

      message.success('Text saved successfully!');
      setText(''); // Clear the input
    } catch (error) {
      console.error('Error:', error);
      message.error('Failed to save text');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Input.TextArea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Enter your text here..."
          rows={4}
        />
        <Button type="primary" onClick={handleSubmit} loading={loading} block>
          Confirm
        </Button>
      </Space>
    </Card>
  );
};

export default TextForm; 