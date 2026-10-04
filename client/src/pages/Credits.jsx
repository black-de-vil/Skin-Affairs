import { useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../context/AppContext';

/* ------------------------------------------------------------------ */
/*  Inline icons                                                       */
/* ------------------------------------------------------------------ */

const DiamondIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M6 3h12l3 5-9 13L3 8l3-5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M3 8h18M9 3l3 5 3-5M12 8l-3 13M12 8l3 13" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Plan data — hardcoded pricing tiers                                */
/* ------------------------------------------------------------------ */

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 10,
    credits: 100,
    tagline: 'Perfect for trying things out',
    features: ['100 AI credits', 'Unlimited skin chats', 'Standard response speed', 'Community access'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 30,
    credits: 500,
    tagline: 'Best value for regular use',
    popular: true,
    features: [
      '500 AI credits',
      'Priority response speed',
      'Save routines & chat history',
      'Publish to community',
      'Email support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 80,
    credits: 1500,
    tagline: 'For power users & professionals',
    features: [
      '1,500 AI credits',
      'Fastest response speed',
      'Advanced skin insights',
      'Priority support',
      'Early access to new features',
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Plan card                                                          */
/* ------------------------------------------------------------------ */

const PlanCard = ({ plan, onBuy, isLoading, isDisabled }) => (
  <div
    className={`relative flex flex-col rounded-2xl p-6 border transition-all ${
      plan.popular
        ? 'border-purple-400 dark:border-purple-500 bg-white dark:bg-slate-900 shadow-xl scale-[1.02]'
        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md'
    }`}
  >
    {plan.popular && (
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide text-white bg-gradient-to-r from-[#A456F7] to-[#3D81F6] shadow-sm">
        MOST POPULAR
      </span>
    )}

    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
    <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{plan.tagline}</p>

    <div className="mt-4 flex items-baseline gap-1">
      <span className="text-3xl font-extrabold text-gray-900 dark:text-white">${plan.price}</span>
      <span className="text-sm text-gray-400 dark:text-slate-500">one-time</span>
    </div>
    <p className="text-sm font-medium text-emerald-500 mt-1">{plan.credits.toLocaleString()} credits</p>

    <ul className="mt-5 space-y-2.5 flex-1">
      {plan.features.map((f) => (
        <li key={f} className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300">
          <CheckIcon className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
          {f}
        </li>
      ))}
    </ul>

    <button
      onClick={() => onBuy(plan)}
      disabled={isDisabled}
      className={`mt-6 w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
        plan.popular
          ? 'text-white bg-gradient-to-r from-[#A456F7] to-[#3D81F6] hover:brightness-110'
          : 'text-gray-800 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
      }`}
    >
      {isLoading ? 'Processing…' : `Buy ${plan.name}`}
    </button>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Credits page                                                       */
/* ------------------------------------------------------------------ */

const Credits = () => {
  const { user } = useAppContext();
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [error, setError] = useState(null);

  const handleBuy = async (plan) => {
    if (!user) {
      setError('Please log in to purchase credits.');
      return;
    }
    setError(null);
    setLoadingPlanId(plan.id);
    try {
      // Adjust this endpoint + response shape to match your payment backend
      // (e.g. it might return a Stripe/Razorpay checkout URL to redirect to)
      const { data } = await axios.post('/api/credit/purchase', { planId: plan.id });
      if (data?.success && data?.url) {
        window.location.href = data.url;
      } else {
        setError(data?.message || 'Something went wrong starting checkout.');
      }
    } catch (err) {
      // No backend connected yet, or the request failed — fail gracefully
      setError(
        err?.response?.data?.message ||
          "Couldn't start checkout — check that your backend/API is connected."
      );
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <div className="flex-1 min-w-0 h-full overflow-y-auto overscroll-contain chat-scroll bg-slate-50 dark:bg-slate-950 px-4 sm:px-6 py-8 pt-16 md:pt-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Power up your credits
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
            Choose a plan to keep chatting with Skin Affairs. Credits never expire.
          </p>
        </div>

        {/* Current balance */}
        <div className="mb-8 mx-auto max-w-sm flex items-center justify-center gap-3 rounded-xl px-5 py-3 bg-gradient-to-r from-[#A456F7] to-[#3D81F6] text-white shadow-md">
          <DiamondIcon className="w-6 h-6 flex-shrink-0" />
          <div className="text-center">
            <p className="text-xs uppercase tracking-wide opacity-80">Current balance</p>
            <p className="text-xl font-bold leading-tight">{user?.credits ?? 0} credits</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 max-w-md mx-auto px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm text-center">
            {error}
          </div>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onBuy={handleBuy}
              isLoading={loadingPlanId === plan.id}
              isDisabled={loadingPlanId !== null}
            />
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-slate-500 mt-8">
          Secure checkout. Credits are added to your account instantly after payment.
        </p>
      </div>
    </div>
  );
};

export default Credits;