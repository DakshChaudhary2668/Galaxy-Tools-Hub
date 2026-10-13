import Link from 'next/link';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { AnnouncementBar } from '@/components/AnnouncementBar/AnnouncementBar';
import { Header } from '@/components/Header/Header';
import { CategoryNav } from '@/components/CategoryNav/CategoryNav';
import { Footer } from '@/components/Footer/Footer';
import styles from '@/app/about/InfoPage.module.scss';

export function PolicyReviewPage({ title, summary, decisions }: { title: string; summary: string; decisions: string[] }) {
  return (
    <div className={styles.pageWrapper}>
      <AnnouncementBar />
      <Header />
      <CategoryNav />
      <main className={styles.container}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/">Home</Link><ChevronRight size={12} /><span aria-current="page">{title}</span>
        </nav>
        <header className={styles.pageHeader}><h1>{title}</h1><p>{summary}</p></header>
        <section className={styles.contentSection}>
          <div className={styles.prose}>
            <h2><AlertCircle size={20} aria-hidden="true" /> Final owner approval required</h2>
            <p>This policy is under final business and legal review. No unapproved commercial promise is published here.</p>
            <p>Please contact <a href="mailto:galaxyinstruments9@gmail.com">galaxyinstruments9@gmail.com</a> or <a href="tel:+919015133267">+91 90151 33267</a> before ordering if you need clarification.</p>
            <h2>Decisions awaiting approval</h2>
            <ul>{decisions.map((decision) => <li key={decision}>{decision}</li>)}</ul>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
