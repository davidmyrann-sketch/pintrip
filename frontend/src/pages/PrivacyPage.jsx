import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PrivacyPage() {
  const navigate = useNavigate()
  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-bg page-enter">
      <div className="max-w-2xl mx-auto px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-24">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-text-3 text-sm mb-6">
          <ArrowLeft size={16} />Back
        </button>
        <h1 className="text-text-1 font-black text-2xl mb-1">Privacy Policy</h1>
        <p className="text-text-3 text-xs mb-8">Last updated: April 2026</p>

        {[
          {
            title: '1. Who we are',
            body: 'PinTrip is operated by PinTrip AS (or its operating entity). Contact: privacy@pintrip.app',
          },
          {
            title: '2. Data we collect',
            body: `We collect:
• Account data: email, username, name (required to provide the service)
• Content you post: images, captions, location pins
• Usage data: likes, saves, trips you create
• Technical data: IP address, browser type, device type (essential cookies only)

We do NOT use advertising trackers, sell your data, or share it with third parties except as required by law.`,
          },
          {
            title: '3. Legal basis (GDPR)',
            body: `We process your data on the basis of:
• Contract performance (Art. 6(1)(b)) — to provide the PinTrip service
• Legitimate interest (Art. 6(1)(f)) — security, fraud prevention
• Consent (Art. 6(1)(a)) — marketing emails (only if you opt in)`,
          },
          {
            title: '4. Your rights',
            body: `Under GDPR you have the right to:
• Access your data (Settings → Export my data)
• Delete your account and all data (Settings → Delete account)
• Correct inaccurate data (edit your profile)
• Object to processing
• Data portability

To exercise any right, contact privacy@pintrip.app or use the in-app tools.`,
          },
          {
            title: '5. Cookies',
            body: 'We use only essential cookies (JWT authentication token stored in localStorage). No third-party tracking cookies are used without your explicit consent.',
          },
          {
            title: '6. Data retention',
            body: 'Your data is retained as long as your account is active. When you delete your account, all personal data is permanently removed within 30 days.',
          },
          {
            title: '7. International transfers',
            body: 'Your data is stored on servers within the EU (Railway/Render EU region). No data is transferred outside the EU/EEA without adequate safeguards.',
          },
          {
            title: '8. Changes',
            body: 'We will notify you of material changes by email or in-app notification at least 30 days before they take effect.',
          },
          {
            title: '9. Contact',
            body: 'Data Controller: PinTrip AS\nEmail: privacy@pintrip.app\nYou also have the right to lodge a complaint with the Norwegian Data Protection Authority (Datatilsynet) at datatilsynet.no.',
          },
        ].map(s => (
          <div key={s.title} className="mb-6">
            <h2 className="text-text-1 font-bold text-base mb-2">{s.title}</h2>
            <p className="text-text-2 text-sm leading-relaxed whitespace-pre-line">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
