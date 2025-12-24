import React, { useState, useEffect } from 'react';
import { ApiKeyManager, ApiKeyEntry } from '../services/apiKeyManager';

interface ApiKeyManagerProps {
    onClose: () => void;
    onKeyChanged?: () => void;
}

const ApiKeyManagerComponent: React.FC<ApiKeyManagerProps> = ({ onClose, onKeyChanged }) => {
    const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
    const [activeKeyId, setActiveKeyId] = useState<string | null>(null);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyValue, setNewKeyValue] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editKey, setEditKey] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);

    const loadKeys = () => {
        setKeys(ApiKeyManager.getAll());
        setActiveKeyId(ApiKeyManager.getActiveId());
    };

    useEffect(() => {
        loadKeys();
    }, []);

    const handleAddKey = () => {
        if (!newKeyName.trim() || !newKeyValue.trim()) {
            alert('Please enter both name and API key');
            return;
        }

        ApiKeyManager.add(newKeyName, newKeyValue);
        setNewKeyName('');
        setNewKeyValue('');
        setShowAddForm(false);
        loadKeys();
        onKeyChanged?.();
    };

    const handleDeleteKey = (id: string) => {
        if (confirm('Are you sure you want to delete this API key?')) {
            ApiKeyManager.delete(id);
            loadKeys();
            onKeyChanged?.();
        }
    };

    const handleSetActive = (id: string) => {
        ApiKeyManager.setActive(id);
        loadKeys();
        onKeyChanged?.();
    };

    const handleStartEdit = (key: ApiKeyEntry) => {
        setEditingId(key.id);
        setEditName(key.name);
        setEditKey(key.key);
    };

    const handleSaveEdit = () => {
        if (editingId && editName.trim() && editKey.trim()) {
            ApiKeyManager.update(editingId, editName, editKey);
            setEditingId(null);
            setEditName('');
            setEditKey('');
            loadKeys();
            onKeyChanged?.();
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditName('');
        setEditKey('');
    };

    const maskKey = (key: string) => {
        if (key.length <= 8) return '••••••••';
        return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(8px)'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
                border: '2px solid #00ff88',
                borderRadius: '12px',
                padding: '32px',
                maxWidth: '700px',
                width: '90%',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 0 40px rgba(0, 255, 136, 0.3)',
                fontFamily: 'monospace'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    borderBottom: '1px solid #00ff88',
                    paddingBottom: '16px'
                }}>
                    <h2 style={{
                        margin: 0,
                        color: '#00ff88',
                        fontSize: '24px',
                        textTransform: 'uppercase',
                        letterSpacing: '2px'
                    }}>
                        🔑 API KEY MANAGER
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: '2px solid #ff4444',
                            color: '#ff4444',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#ff4444';
                            e.currentTarget.style.color = '#000';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#ff4444';
                        }}
                    >
                        CLOSE
                    </button>
                </div>

                {/* Add New Key Section */}
                {!showAddForm ? (
                    <button
                        onClick={() => setShowAddForm(true)}
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#000',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            marginBottom: '24px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        + ADD NEW API KEY
                    </button>
                ) : (
                    <div style={{
                        background: '#1a1a2e',
                        border: '2px solid #00ff88',
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '24px'
                    }}>
                        <h3 style={{ color: '#00ff88', marginTop: 0, marginBottom: '16px' }}>Add New API Key</h3>
                        <input
                            type="text"
                            placeholder="Key Name (e.g., 'Personal Account', 'Work Key')"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                marginBottom: '12px',
                                background: '#0a0a0a',
                                border: '1px solid #00ff88',
                                borderRadius: '6px',
                                color: '#00ff88',
                                fontSize: '14px',
                                fontFamily: 'monospace',
                                boxSizing: 'border-box'
                            }}
                        />
                        <input
                            type="password"
                            placeholder="API Key"
                            value={newKeyValue}
                            onChange={(e) => setNewKeyValue(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                marginBottom: '16px',
                                background: '#0a0a0a',
                                border: '1px solid #00ff88',
                                borderRadius: '6px',
                                color: '#00ff88',
                                fontSize: '14px',
                                fontFamily: 'monospace',
                                boxSizing: 'border-box'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={handleAddKey}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: '#00ff88',
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: '#000',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                SAVE
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddForm(false);
                                    setNewKeyName('');
                                    setNewKeyValue('');
                                }}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: 'transparent',
                                    border: '2px solid #666',
                                    borderRadius: '6px',
                                    color: '#666',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                CANCEL
                            </button>
                        </div>
                    </div>
                )}

                {/* API Keys List */}
                <div style={{ marginTop: '24px' }}>
                    <h3 style={{
                        color: '#00ff88',
                        marginBottom: '16px',
                        fontSize: '18px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                        Your API Keys ({keys.length})
                    </h3>

                    {keys.length === 0 ? (
                        <div style={{
                            padding: '32px',
                            textAlign: 'center',
                            color: '#666',
                            border: '2px dashed #333',
                            borderRadius: '8px'
                        }}>
                            No API keys configured. Add one to get started!
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {keys.map((key) => (
                                <div
                                    key={key.id}
                                    style={{
                                        background: activeKeyId === key.id ? '#1a2e1a' : '#1a1a2e',
                                        border: `2px solid ${activeKeyId === key.id ? '#00ff88' : '#333'}`,
                                        borderRadius: '8px',
                                        padding: '16px',
                                        position: 'relative',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    {editingId === key.id ? (
                                        // Edit Mode
                                        <div>
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px',
                                                    marginBottom: '8px',
                                                    background: '#0a0a0a',
                                                    border: '1px solid #00ff88',
                                                    borderRadius: '4px',
                                                    color: '#00ff88',
                                                    fontSize: '14px',
                                                    fontFamily: 'monospace',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                            <input
                                                type="password"
                                                value={editKey}
                                                onChange={(e) => setEditKey(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px',
                                                    marginBottom: '12px',
                                                    background: '#0a0a0a',
                                                    border: '1px solid #00ff88',
                                                    borderRadius: '4px',
                                                    color: '#00ff88',
                                                    fontSize: '14px',
                                                    fontFamily: 'monospace',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={handleSaveEdit} style={buttonStyle('#00ff88', '#000')}>SAVE</button>
                                                <button onClick={handleCancelEdit} style={buttonStyle('#666', '#666')}>CANCEL</button>
                                            </div>
                                        </div>
                                    ) : (
                                        // View Mode
                                        <>
                                            {activeKeyId === key.id && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '8px',
                                                    right: '8px',
                                                    background: '#00ff88',
                                                    color: '#000',
                                                    padding: '4px 12px',
                                                    borderRadius: '4px',
                                                    fontSize: '11px',
                                                    fontWeight: 'bold',
                                                    letterSpacing: '1px'
                                                }}>
                                                    ACTIVE
                                                </div>
                                            )}
                                            <div style={{
                                                color: '#00ff88',
                                                fontSize: '16px',
                                                fontWeight: 'bold',
                                                marginBottom: '8px'
                                            }}>
                                                {key.name}
                                            </div>
                                            <div style={{
                                                color: '#666',
                                                fontSize: '13px',
                                                marginBottom: '12px',
                                                fontFamily: 'monospace'
                                            }}>
                                                {maskKey(key.key)}
                                            </div>
                                            <div style={{
                                                color: '#444',
                                                fontSize: '11px',
                                                marginBottom: '12px'
                                            }}>
                                                Added: {new Date(key.createdAt).toLocaleString()}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {activeKeyId !== key.id && (
                                                    <button
                                                        onClick={() => handleSetActive(key.id)}
                                                        style={buttonStyle('#00ff88', '#000')}
                                                    >
                                                        SET ACTIVE
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleStartEdit(key)}
                                                    style={buttonStyle('#4488ff', '#000')}
                                                >
                                                    EDIT
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteKey(key.id)}
                                                    style={buttonStyle('#ff4444', '#000')}
                                                >
                                                    DELETE
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: '#1a1a2e',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#666',
                    lineHeight: '1.6'
                }}>
                    <strong style={{ color: '#00ff88' }}>💡 TIP:</strong> You can add multiple API keys from different Google accounts.
                    Switch between them to avoid rate limits. Your keys are stored locally in your browser.
                </div>
            </div>
        </div>
    );
};

const buttonStyle = (borderColor: string, textColor: string) => ({
    padding: '8px 16px',
    background: 'transparent',
    border: `2px solid ${borderColor}`,
    borderRadius: '6px',
    color: borderColor,
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
});

export default ApiKeyManagerComponent;
