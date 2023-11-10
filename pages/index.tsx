import Link from 'next/link';
import Head from 'next/head';
import styles from '../styles/homePage.module.css';

export default function Home() {
  return (
    <div className={styles.background}>
      <Head>
        <title>Security Testing App</title>
        <meta name="description" content="A web application for security testing" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.homeContainer}>
        <h1 className={styles.homeHeading}>Dobrodošli u aplikaciju testiranja sigurnosti</h1>
        
        <div className={styles.buttonContainer}>
          <Link href="/sql-injection" passHref>
            <span className={styles.homeLink}>SQL umetanje</span>
          </Link>
          <Link href="/broken-authentication" passHref>
            <span className={styles.homeLink}>Loša autentifikacija</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
