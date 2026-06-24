
import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 space-y-8">
      <h1 className="text-4xl font-black text-white">Privacy Policy</h1>
      <div className="prose prose-invert prose-indigo max-w-none text-slate-400 space-y-6">
        <p>Last updated: October 2023</p>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">1. Information We Collect</h2>
          <p>
            When you use Unika Gaming Shop, we collect information that allows us to fulfill your orders and provide a better experience. This includes Player ID, Zone ID, and your email address for order receipts.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">2. How We Use Your Information</h2>
          <p>
            Your information is used solely for processing transactions and delivering in-game currency. We do not sell or share your personal data with third parties for marketing purposes.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">3. Security</h2>
          <p>
            We implement industry-standard security measures to protect your data during transmission and storage. All payments are processed through secure, PCI-compliant payment gateways.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">4. Refund Policy</h2>
          <p>
            Due to the nature of digital goods and immediate delivery, all sales are final once the in-game currency has been successfully credited to your account.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
