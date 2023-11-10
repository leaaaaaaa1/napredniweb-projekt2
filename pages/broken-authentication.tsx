import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/BrokenAuthentication.module.css';

export default function BrokenAuthentication() {
  const [isVulnerable, setIsVulnerable] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authResult, setAuthResult] = useState('');
  const [sessionInfo, setSessionInfo] = useState(''); 
  const router = useRouter();

  const navigateHome = () => {
    router.push('/'); 
  };

  const toggleVulnerability = () => {
    setIsVulnerable(!isVulnerable);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const authenticateUser = async () => {
    setAuthResult('');
    setSessionInfo('');
    const userData = { username, password, isVulnerable };

    try {
      const response = await fetch('/api/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setAuthResult(data.message);
      if (isVulnerable && data.sessionId) {
        setSessionInfo(`Session ID: ${data.sessionId}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        setAuthResult(`Error: ${error.message}`);
      } else {
        setAuthResult('An unknown error occurred');
      }
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Broken Authentication</title>
      </Head>

      <div className={styles.form}>
        <button onClick={toggleVulnerability} className={isVulnerable ? styles.toggleButtonActive : styles.toggleButton}>
          {isVulnerable ? 'Omogući sigurnu prijavu' : 'Omogući nesigurnu prijavu'}
        </button>
        <h1 className={styles.heading}>Prijavi se</h1>
        <div className={styles.field}>
          <label className={styles.label}>Korisničko ime:</label>
          <input
            type="text"
            value={username}
            onChange={handleUsernameChange}
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Lozinka:</label>
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            className={styles.input}
          />
        </div>

        <div className={styles.buttonContainer}>
            <button onClick={authenticateUser} className={styles.submitBtn}>Prijavi se</button>
            <button onClick={navigateHome} className={`${styles.submitBtn} ${styles.buttonToHome}`}>
                Nazad na početnu
            </button>
        </div>
        
        <div className={styles.resultContainer}>
          {sessionInfo && (
            <div>
              <h2>Informacije o sesiji:</h2>
              <pre>{sessionInfo}</pre>
            </div>
          )}
          <h2>{authResult !== "" ? 'Ishod autentikacije:' : ''}</h2>
          <pre>{authResult}</pre>
        </div>
      </div>
    </div>
  );
}
