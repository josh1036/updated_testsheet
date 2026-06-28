import { Link } from 'react-router-dom';
import { Zap, Shield, FileText, Download, Users, CheckCircle, ChevronRight } from 'lucide-react';

const features = [
  { icon: FileText, title: 'AS/NZS 3000 & 3008 Compliant', desc: 'Forms designed to exactly match the official Schedule of Test Results layout required by Australian and NZ wiring rules.' },
  { icon: Shield, title: 'Secure & Private', desc: 'Your test records are stored securely. Only you can access them — perfect for licensed electricians and contractors.' },
  { icon: Download, title: 'Instant PDF Export', desc: 'Print or save any test sheet as a PDF directly from your browser. No extra software, no subscriptions.' },
  { icon: Zap, title: 'Fast on the Job Site', desc: 'Designed for real field use. Works on your phone or tablet — enter test results while you work.' },
  { icon: Users, title: 'Free for Electricians', desc: '100% free to use. No credit card, no trial period, no limits on records.' },
  { icon: CheckCircle, title: 'Compliance Checklist', desc: 'Built-in compliance checklist while filling forms to ensure every AS/NZS requirement is met.' },
];

const faqs = [
  { q: 'What is a Schedule of Test Results?', a: 'A Schedule of Test Results is a document required under AS/NZS 3000 (Wiring Rules) that records all electrical tests performed on an installation. It must be completed by a licensed electrician before energising new or altered electrical installations.' },
  { q: 'Is this app compliant with AS/NZS 3000:2018?', a: 'Yes. The form fields, test categories, and measurement requirements are based on AS/NZS 3000:2018 and AS/NZS 3008.1.1. Always verify compliance requirements with your state/territory electrical authority.' },
  { q: 'Which states and territories is this valid for?', a: 'The AS/NZS 3000 Wiring Rules apply across all Australian states and territories as well as New Zealand. State-specific regulations may apply.' },
  { q: 'Is my data private?', a: "Yes. Each electrician's test records are private to their own account. No one else can see your records." },
  { q: 'Can I share a test record with my client?', a: 'Yes — each completed test record can generate a read-only shareable link you can send to your client or building inspector.' },
  { q: 'Is it really free?', a: 'Yes, completely free. The app is supported by non-intrusive advertisements.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-100 bg-white/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1E3A5F] flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <span className="font-bold text-[#1E3A5F] text-lg tracking-tight">AS/NZS Test Results</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-slate-600 hover:text-[#1E3A5F] px-4 py-2 rounded-lg text-sm font-medium">Sign In</Link>
            <Link to="/register" className="bg-[#1E3A5F] hover:bg-[#162d4a] text-white px-4 py-2 rounded-lg text-sm font-medium">Get Started Free</Link>
          </div>
        </div>
      </nav>

      <section className="bg-gradient-to-br from-[#1E3A5F] to-[#162d4a] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#F59E0B]/20 border border-[#F59E0B]/40 rounded-full px-4 py-1.5 text-[#F59E0B] text-sm font-medium mb-6">
            <CheckCircle className="w-4 h-4" /> Free for Australian & NZ Electricians
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight">
            AS/NZS 3000 & 3008<br /><span className="text-[#F59E0B]">Schedule of Test Results</span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            The professional, free app to create, store and export compliant electrical test sheets. Built for licensed electricians in Australia and New Zealand.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register">
              <button className="bg-[#F59E0B] hover:bg-[#d97706] text-[#1E3A5F] font-bold px-8 py-3 rounded-lg flex items-center gap-2">
                Create Free Account <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
            <Link to="/login">
              <button className="border border-white/30 text-white hover:bg-white/10 px-8 py-3 rounded-lg">Sign In to Dashboard</button>
            </Link>
          </div>
          <p className="text-slate-400 text-sm mt-4">No credit card required · Unlimited records · Instant PDF export</p>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1E3A5F] text-center mb-3">Everything you need on the job</h2>
          <p className="text-slate-500 text-center mb-12">Designed by electricians, for electricians.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl border border-slate-100 hover:border-[#1E3A5F]/20 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#1E3A5F]" />
                </div>
                <h3 className="font-semibold text-[#1E3A5F] mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#1E3A5F] mb-12">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Create an Account', desc: 'Sign up free in 30 seconds. No credit card needed.' },
              { step: '2', title: 'Fill Your Test Sheet', desc: 'Enter installation details, circuit test results, RCD times and visual inspection data.' },
              { step: '3', title: 'Export & Share', desc: 'Print directly as a PDF or share a read-only link with your client or inspector.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#1E3A5F] text-white font-bold text-xl flex items-center justify-center mb-4">{step}</div>
                <h3 className="font-semibold text-[#1E3A5F] mb-2">{title}</h3>
                <p className="text-slate-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1E3A5F] text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map(({ q, a }) => (
              <div key={q} className="border border-slate-100 rounded-xl p-5">
                <h3 className="font-semibold text-[#1E3A5F] mb-2">{q}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-[#1E3A5F] text-white text-center">
        <h2 className="text-3xl font-bold mb-3">Start managing your test results today</h2>
        <p className="text-slate-300 mb-6">Free forever. Just the tool you need.</p>
        <Link to="/register">
          <button className="bg-[#F59E0B] hover:bg-[#d97706] text-[#1E3A5F] font-bold px-10 py-3 rounded-lg">Create Free Account</button>
        </Link>
      </section>

      <footer className="border-t border-slate-100 py-8 px-4 text-center text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} AS/NZS Test Results Manager · Free tool for Australian & NZ electricians</p>
        <p className="mt-1">Built to AS/NZS 3000:2018 & AS/NZS 3008.1.1</p>
      </footer>
    </div>
  );
}