'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
export interface BlogItem {
  id: string;
  title: string;
  excerpt: string;
  tag: string;
  image: string;
  href: string;
}

const LATEST_BLOGS: BlogItem[] = [
  { id: 'blog-01', title: 'How to Choose the Right Digital Multimeter', excerpt: 'A buyer\'s guide covering counts, accuracy class, safety category, and feature checklist for industrial multimeters.', tag: 'Buying Guide', image: '/images/cat-multimeter.jpg', href: '#' },
  { id: 'blog-02', title: 'Multimeter vs Clamp Meter: Which One Should You Use?', excerpt: 'Understand when to reach for a clamp meter over a standard DMM and the trade-offs in accuracy and convenience.', tag: 'Comparison', image: '/images/cat-clampmeter.jpg', href: '#' },
  { id: 'blog-03', title: 'Understanding Oscilloscopes for Beginners', excerpt: 'Bandwidth, sample rate, channels — decoded for engineers setting up their first bench.', tag: 'Tutorial', image: '/images/cat-oscilloscope.jpg', href: '#' },
  { id: 'blog-04', title: '5 Essential Testing Tools for Electrical Engineers', excerpt: 'The minimum kit every field engineer should carry, from insulation testers to IR thermometers.', tag: 'Industry', image: '/images/cat-insulation.jpg', href: '#' },
];
import styles from './LatestBlogs.module.scss';

export const LatestBlogs: React.FC = () => {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <h2 className={styles.title}>LATEST BLOGS</h2>
          <Link href="#" className={styles.viewAllLink}>
            <span>VIEW ALL</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className={styles.grid}>
          {LATEST_BLOGS.map((blog) => (
            <Link key={blog.id} href={blog.href} className={styles.card}>
              <div className={styles.imageWrap}>
                <Image
                  src={blog.image}
                  alt={blog.title}
                  width={400}
                  height={200}
                  className={styles.cardImage}
                />
              </div>
              <div className={styles.cardContent}>
                <span className={styles.tag}>{blog.tag}</span>
                <h3 className={styles.blogTitle}>{blog.title}</h3>
                <p className={styles.excerpt}>{blog.excerpt}</p>
                <span className={styles.readMore}>
                  Read More <ArrowRight size={12} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
