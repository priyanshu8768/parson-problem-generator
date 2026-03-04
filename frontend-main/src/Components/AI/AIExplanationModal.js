import React, { useState, useEffect } from 'react';
import { Modal, Button, Card, Typography, Space, Spin } from 'antd';
import { BulbOutlined } from '@ant-design/icons';

const AIExplanationModal = ({ visible, onClose, explanation }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && explanation) {
      setLoading(false);
    }
  }, [visible, explanation]);

  if (!explanation) {
    return null;
  }

  return (
    <Modal
      title={
        <Space>
          <BulbOutlined />
          <span>AI Learning Assistant</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>
      ]}
      width={900}
      style={{ top: 20 }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" tip="Analyzing your solution..." />
          <Typography.Text>Generating personalized explanation...</Typography.Text>
        </div>
      ) : (
        <div style={{ maxHeight: 600, overflowY: 'auto' }}>
          {/* Claude AI Chat-like Explanation */}
          <Card title="🤖 Claude AI Analysis" style={{ marginBottom: 16 }}>
            {/* Main Summary */}
            <Typography.Paragraph style={{ 
              fontSize: '16px', 
              lineHeight: '1.6', 
              marginBottom: 20,
              padding: '16px',
              backgroundColor: '#f0f2f5',
              borderRadius: '8px',
              borderLeft: '4px solid #1890ff'
            }}>
              <Typography.Text strong style={{ color: '#1890ff', fontSize: '18px' }}>
                💬 Let's analyze your code together:
              </Typography.Text>
              <br />
              <Typography.Text style={{ fontSize: '15px', marginTop: '8px' }}>
                {explanation.summary}
              </Typography.Text>
            </Typography.Paragraph>
            
            {/* Detected Errors */}
            {explanation.detected_errors && explanation.detected_errors.length > 0 ? (
              <div style={{ marginBottom: 20 }}>
                <Typography.Text strong style={{ 
                  color: '#cf1322', 
                  fontSize: '17px', 
                  marginBottom: 12,
                  display: 'block'
                }}>
                  🔍 Detected Errors:
                </Typography.Text>
                {explanation.detected_errors.map((error, index) => (
                  <div key={index} style={{ 
                    marginLeft: 16, 
                    marginTop: 12, 
                    marginBottom: 16,
                    padding: '12px',
                    backgroundColor: '#fff1f0',
                    borderRadius: '8px',
                    border: '1px solid #ffa39e'
                  }}>
                    <Typography.Text strong style={{ 
                      fontSize: '13px', 
                      color: '#cf1322',
                      display: 'block',
                      marginBottom: '4px'
                    }}>
                      Line: {error.line_reference} | Type: {error.issue_type}
                    </Typography.Text>
                    <Typography.Text style={{ 
                      fontSize: '14px', 
                      lineHeight: '1.5',
                      display: 'block',
                      marginBottom: '8px'
                    }}>
                      {error.explanation}
                    </Typography.Text>
                  </div>
                ))}
              </div>
            ) : null}
            
            {/* Dry Run */}
            {explanation.dry_run && explanation.dry_run.length > 0 ? (
              <div style={{ marginBottom: 20 }}>
                <Typography.Text strong style={{ 
                  color: '#1890ff', 
                  fontSize: '17px', 
                  marginBottom: 12,
                  display: 'block'
                }}>
                  ⚙️ Code Execution Dry Run:
                </Typography.Text>
                {explanation.dry_run.map((step, index) => (
                  <div key={index} style={{ 
                    marginLeft: 16, 
                    marginTop: 8, 
                    marginBottom: 8,
                    padding: '10px',
                    backgroundColor: '#f0f5ff',
                    borderRadius: '6px',
                    border: '1px solid #d6e4ff'
                  }}>
                    <Typography.Text style={{ 
                      fontSize: '13px', 
                      lineHeight: '1.4',
                      display: 'block',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {step}
                    </Typography.Text>
                  </div>
                ))}
              </div>
            ) : null}
            
            {/* Conceptual Explanation */}
            {explanation.conceptual_explanation && explanation.conceptual_explanation.length > 0 ? (
              <div style={{ marginBottom: 20 }}>
                <Typography.Text strong style={{ 
                  color: '#722ed1', 
                  fontSize: '17px', 
                  marginBottom: 12,
                  display: 'block'
                }}>
                  🧠 Conceptual Explanation:
                </Typography.Text>
                {explanation.conceptual_explanation.map((concept, index) => (
                  <div key={index} style={{ 
                    marginLeft: 16, 
                    marginTop: 8, 
                    marginBottom: 8,
                    padding: '10px',
                    backgroundColor: '#f9f0ff',
                    borderRadius: '6px',
                    border: '1px solid #efdbff'
                  }}>
                    <Typography.Text style={{ 
                      fontSize: '14px', 
                      lineHeight: '1.5',
                      display: 'block',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {concept}
                    </Typography.Text>
                  </div>
                ))}
              </div>
            ) : null}
            
            {/* Mini Example */}
            {explanation.mini_example ? (
              <div style={{ marginBottom: 20 }}>
                <Typography.Text strong style={{ 
                  color: '#52c41a', 
                  fontSize: '17px', 
                  marginBottom: 12,
                  display: 'block'
                }}>
                  💡 Mini Example:
                </Typography.Text>
                <div style={{ 
                  marginLeft: 16, 
                  padding: '16px',
                  backgroundColor: '#f6ffed',
                  borderRadius: '8px',
                  border: '1px solid #b7eb8f'
                }}>
                  <Typography.Text code style={{ 
                    fontSize: '13px', 
                    color: '#d63384',
                    display: 'block',
                    lineHeight: '1.4',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {explanation.mini_example}
                  </Typography.Text>
                </div>
              </div>
            ) : null}
            
            {/* Encouragement */}
            <div style={{ 
              marginTop: 24, 
              padding: '16px', 
              backgroundColor: '#f6ffed', 
              borderRadius: '8px',
              border: '1px solid #b7eb8f',
              textAlign: 'center'
            }}>
              <Typography.Text style={{ 
                fontSize: '15px', 
                color: '#52c41a', 
                fontWeight: 'bold',
                display: 'block'
              }}>
                🌟 {explanation.encouragement_message}
              </Typography.Text>
            </div>
          </Card>
        </div>
      )}
    </Modal>
  );
};

export default AIExplanationModal;
