'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function DepositSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto redirect after 5 seconds
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-8 text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Deposit Successful!</h1>
        <p className="text-gray-300 mb-6">
          Your funds have been added to your Hipa wallet. You can now use them for purchases.
        </p>

        <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-400 mb-1">Transaction ID</div>
          <div className="text-white font-mono text-sm">DEP-{Date.now()}</div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/')}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Continue Shopping
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => router.push('/deposit')}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Make Another Deposit
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          You will be redirected to the homepage in 5 seconds...
        </p>
      </div>
    </div>
  );
}