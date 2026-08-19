'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LATEST_BLOGS } from '../../data/homepageSeed';
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
