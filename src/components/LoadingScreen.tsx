import React from 'react';

const LoadingScreen: React.FC = () => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#000',
            zIndex: 9999,
        }}>
            <div style={{
                width: '50px',
                height: '50px',
                border: '3px solid #333',
                borderTop: '3px solid #fff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
            }} />
        </div>
    );
};

export default LoadingScreen;