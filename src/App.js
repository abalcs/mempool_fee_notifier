import React, { useEffect, useState } from 'react';
import emailjs from 'emailjs-com';
// import './style.css';

function App() {
  const [status, setStatus] = useState('Waiting for updates...');
  const [lastNotificationTime, setLastNotificationTime] = useState(0);
  const notificationPauseTime = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

  useEffect(() => {
    emailjs.init(process.env.REACT_APP_EMAILJS_USER_ID);

    const fetchFees = async () => {
      try {
        const response = await fetch('https://mempool.space/api/v1/fees/recommended');
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching fees:', error);
        return null;
      }
    };

    const sendEmail = async (message) => {
      const templateParams = {
        to_name: process.env.REACT_APP_EMAILJS_TO_NAME,
        message: message,
      };

      try {
        await emailjs.send(
          process.env.REACT_APP_EMAILJS_SERVICE_ID,
          process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
          templateParams
        );
        console.log('Email sent');
      } catch (error) {
        console.error('Error sending email:', error);
      }
    };

    const checkAndNotify = async () => {
      const currentTime = Date.now();
      if (currentTime - lastNotificationTime < notificationPauseTime) {
        console.log('Notification paused');
        return;
      }

      const fees = await fetchFees();
      if (fees && fees.fastestFee < 10) {
        await sendEmail('Alert: sats/vb are under 10');
        setLastNotificationTime(currentTime);
        setStatus('Notification sent for under 10 sats/vb');
      } else {
        setStatus(`Current fastest fee: ${fees ? fees.fastestFee : 'N/A'} sats/vb`);
      }
    };

    checkAndNotify();
    const interval = setInterval(checkAndNotify, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [lastNotificationTime, notificationPauseTime]);

  return (
    <div className="App container">
      <header className="App-header">
        <h1>Mempool Fee Notifier</h1>
        <p>{status}</p>
      </header>
    </div>
  );
}

export default App;
