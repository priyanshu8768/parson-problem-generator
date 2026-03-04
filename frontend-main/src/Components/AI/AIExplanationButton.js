import React, { useState } from 'react';
import { Button, Space } from 'antd';
import { BulbOutlined } from '@ant-design/icons';
import AIExplanationModal from './AIExplanationModal';

const AIExplanationButton = ({ explanation, disabled = false }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const showModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  return (
    <Space>
      <Button
        type="primary"
        icon={<BulbOutlined />}
        onClick={showModal}
        disabled={disabled || !explanation}
        style={{
          background: '#52c41a',
          borderColor: '#52c41a',
          borderRadius: '6px'
        }}
      >
        AI Explanation
      </Button>
      
      <AIExplanationModal
        visible={modalVisible}
        onClose={closeModal}
        explanation={explanation}
      />
    </Space>
  );
};

export default AIExplanationButton;
