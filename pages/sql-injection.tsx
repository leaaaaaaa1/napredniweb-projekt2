// pages/sql-injection.tsx
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/SqlInjection.module.css'; 

export default function SqlInjection() {
  const [isVulnerable, setIsVulnerable] = useState(false);
  const [sqlQuery, setSqlQuery] = useState('');
  const [executionResult, setExecutionResult] = useState('');

  const router = useRouter(); 

  const toggleVulnerability = () => {
    setIsVulnerable(!isVulnerable);
  };

  const navigateHome = () => {
    router.push('/'); 
  };

  const handleSqlQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSqlQuery(e.target.value);
  };

  const executeQuery = async () => {
    setExecutionResult('');
    const tautologyPattern = /^[a-zA-Z0-9_-]+$/;
  
    if (isVulnerable) {
        if (!tautologyPattern.test(sqlQuery)) {
          alert('SQL umetanje je uspješno izvršeno!');
        } else {
          alert('Upit izvršen ali bez umetanja.');
        }
      } else {
        if (!tautologyPattern.test(sqlQuery)) {
          alert('Pokušaj SQL umetanja je spriječen!');
          return;
        } else {
          alert('Upit izvršen.');
        }
      }
  
    try {
        const response = await fetch('/api/execute-sql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sql: sqlQuery,
            isVulnerable,
          }),
        });
    
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Error.');
        }
        setExecutionResult(JSON.stringify(data.result, null, 2));
      } catch (error) {
        if (error instanceof Error) {
          alert(`Error: ${error.message}`);
        } else {
          alert('Nepoznati error.');
        }
      }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>SQL Injection</title>
      </Head>

      <div className={styles.form}>
        <h1 className={styles.heading}>Dohvatite korisnika i njegov id s korisničkim imenom.</h1>
        <div className={styles.field}>
            <button
                onClick={toggleVulnerability}
                className={isVulnerable ? styles.toggleButtonActive : styles.toggleButton}
            >
                {isVulnerable ? 'SQL umetanje upaljeno' : 'SQL umetanje ugašeno'}
            </button>
        </div>

        {isVulnerable && (
          <div>
            <p>SQL umetanje je omogućeno, pazite! (npr. &apos; OR &apos;a&apos;=&apos;a)</p>
          </div>
        )}

        <div className={styles.field}>
            <label className={styles.label}>Korisničko ime (postoje korisnici testniUser1 i testniUser2):</label>
            <input
              type="text"
              value={sqlQuery}
              onChange={handleSqlQueryChange}
              placeholder="Upišite SQL ovdje..."
              className={styles.input}
            />
        </div>    

        <div className={styles.buttonContainer}>
            <button onClick={executeQuery} className={styles.submitBtn}>Izvrši</button>
            <button onClick={navigateHome} className={`${styles.submitBtn} ${styles.buttonToHome}`}>
                Nazad na početnu
            </button>
        </div>
        <div className={styles.resultContainer}>
            <h2>Rezultat izvršavanja:</h2>
            <pre>{executionResult}</pre>
        </div>
      </div>
    </div>
  );
}
