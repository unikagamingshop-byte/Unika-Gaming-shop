
import React from 'react';
import { Mail, Send, MessageCircle, Phone } from 'lucide-react';

const Support: React.FC = () => {
  const supportDetails = [
    {
      title: 'Email Support',
      value: 'unikagamingshop@gmail.com',
      icon: <Mail className="w-8 h-8" />,
      link: 'mailto:unikagamingshop@gmail.com',
      color: 'bg-blue-500/10 text-blue-400',
    },
    {
      title: 'Telegram Support',
      value: 'ID: 8801410537867',
      icon: <Send className="w-8 h-8" />,
      link: 'https://t.me/8801410537867',
      color: 'bg-indigo-500/10 text-indigo-400',
    },
    {
      title: 'WhatsApp Support',
      value: '01410537867',
      icon: <MessageCircle className="w-8 h-8" />,
      link: 'https://wa.me/8801410537867',
      color: 'bg-emerald-500/10 text-emerald-400',
    },
    {
      title: 'Call Support',
      value: '01410537867',
      icon: <Phone className="w-8 h-8" />,
      link: 'tel:01410537867',
      color: 'bg-cyan-500/10 text-cyan-400',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-20 space-y-16">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black text-white tracking-tight">Need Help?</h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Our dedicated team is ready to assist you with your orders and any questions you might have.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {supportDetails.map((item, idx) => (
          <a
            key={idx}
            href={item.link}
            target={item.link.startsWith('http') ? '_blank' : undefined}
            rel={item.link.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="group bg-slate-900 border border-slate-800 p-8 rounded-3xl hover:border-indigo-500/50 transition-all duration-300 shadow-xl flex flex-col items-center text-center space-y-6"
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${item.color}`}>
              {item.icon}
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">{item.title}</h3>
              <p className="text-slate-400 font-mono text-sm">{item.value}</p>
            </div>
            <div className="pt-4">
              <span className="text-indigo-400 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                Connect Now
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </div>
          </a>
        ))}
      </div>

      <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
        <div className="space-y-4 relative z-10 text-center md:text-left">
          <h2 className="text-3xl font-black text-white">Operating Hours</h2>
          <p className="text-indigo-200 text-lg">
            Our support agents are available every day to serve you.
          </p>
        </div>
        <div className="bg-slate-900 px-10 py-6 rounded-2xl border border-indigo-500/30 shadow-2xl relative z-10 text-center">
          <p className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-1">Live Now</p>
          <p className="text-3xl font-black text-white tracking-tighter">10 AM - 10 PM</p>
          <p className="text-slate-500 text-sm mt-1">Standard Time (GMT+6)</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-2xl font-black text-white text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            { q: 'How long does delivery take?', a: 'Most orders are processed within 5 to 30 minutes.' },
            { q: 'What if my payment failed?', a: 'Contact us via Telegram or Email with your Transaction ID and we will resolve it immediately.' },
            { q: 'Are these safe for my account?', a: 'Yes, we use official channels for all game top-ups. Your account safety is our priority.' }
          ].map((faq, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-2">
              <h4 className="font-bold text-white">{faq.q}</h4>
              <p className="text-slate-400 text-sm">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Support;
