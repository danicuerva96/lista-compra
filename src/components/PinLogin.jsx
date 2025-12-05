import React, { useState } from 'react';

const PinLogin = ({ onLogin }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleNumberClick = (num) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === 4) {
                handleSubmit(newPin);
            }
        }
    };

    const handleClear = () => {
        setPin('');
        setError('');
    };

    const handleSubmit = (enteredPin) => {
        // Accept any 4 digit PIN as a "Room ID"
        onLogin(enteredPin);
    };

    return (
        <div className="pin-login-container">
            <h2>Ingresa el PIN Secreto</h2>
            <div className="pin-display">
                {Array(4).fill(0).map((_, i) => (
                    <span key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''}`}></span>
                ))}
            </div>
            {error && <p className="error-message">{error}</p>}
            <div className="keypad">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button key={num} onClick={() => handleNumberClick(num)}>{num}</button>
                ))}
                <button className="clear-btn" onClick={handleClear}>C</button>
                <button onClick={() => handleNumberClick(0)}>0</button>
                <button className="hidden-btn" />
            </div>
        </div>
    );
};

export default PinLogin;
