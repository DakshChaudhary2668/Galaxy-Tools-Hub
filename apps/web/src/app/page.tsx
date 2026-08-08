import React from 'react';
import { Button } from '@galaxy/ui';

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero-banner">
        <h1>HEAVY-DUTY INDUSTRIAL TOOLS</h1>
        <p>Built for performance, precision, and durability. Powered by Bosch, DeWalt, Stanley, and Milwaukee.</p>
        <Button variant="primary" size="lg">Browse Catalog</Button>
      </section>
    </div>
  );
}
