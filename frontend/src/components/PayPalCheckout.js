import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const PayPalCheckout = ({ coursePackage, userEmail, amount, onSuccess, onError }) => {
    const [loading, setLoading] = useState(false);

    const createOrder = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/paypal/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    course_package: coursePackage,
                    user_email: userEmail,
                    amount: amount
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Failed to create order');
            }

            return data.order_id;
        } catch (error) {
            onError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const onApprove = async (data) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/paypal/capture-order/${data.orderID}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.detail || 'Failed to capture payment');
            }

            onSuccess(result);
        } catch (error) {
            onError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PayPalScriptProvider options={{ 
            "client-id": process.env.REACT_APP_PAYPAL_CLIENT_ID || "demo",
            currency: "EUR"
        }}>
            <div style={{ opacity: loading ? 0.5 : 1 }}>
                <PayPalButtons
                    createOrder={createOrder}
                    onApprove={onApprove}
                    onError={(err) => onError(err.toString())}
                    disabled={loading}
                    style={{
                        layout: 'vertical',
                        color: 'blue',
                        shape: 'rect',
                        label: 'paypal'
                    }}
                />
                {loading && (
                    <div className="payment-loading">
                        <p>Elaborazione pagamento in corso...</p>
                    </div>
                )}
            </div>
        </PayPalScriptProvider>
    );
};

export default PayPalCheckout;