'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Shield, CheckCircle, Smartphone, CreditCard, Building, ChevronRight, ArrowLeft, Lock } from 'lucide-react';

interface DepositStep {
  id: number;
  title: string;
  description: string;
}

const depositSteps: DepositStep[] = [
  { id: 1, title: 'Enter Amount', description: 'Choose how much to deposit' },
  { id: 2, title: 'Choose Method', description: 'Select payment method' },
  { id: 3, title: 'Payment Details', description: 'Enter payment information' },
  { id: 4, title: 'Confirm Details', description: 'Review and authorize' },
];

const paymentMethods = [
  {
    id: 'mtn-momo',
    name: 'MTN Mobile Money',
    icon: Smartphone,
    description: 'Pay with MTN MoMo',
    color: 'bg-yellow-500',
    logo: '🇷🇼 MTN',
    longDescription: 'This is the most common method in Rwanda, utilizing a "Push" system for speed.',
    steps: [
      'Enter your MTN phone number on the deposit page',
      'The system sends a "Mobile Money Push" notification directly to your phone',
      'A pop-up appears on your handset asking you to "Approve" the transaction',
      'Enter your secret 5-digit MoMo PIN to authorize it',
      'If the pop-up doesn\'t appear, dial *182# and go to Pending Approvals (Option 7)'
    ],
    technical: 'Uses Rwanda\'s National Digital Payment System for instant transfers'
  },
  {
    id: 'airtel-money',
    name: 'Airtel Money',
    icon: Smartphone,
    description: 'Pay with Airtel Money',
    color: 'bg-red-500',
    logo: '🇷🇼 Airtel',
    longDescription: 'Similar to MTN, Airtel uses the National Digital Payment System for instant transfers.',
    steps: [
      'Provide your Airtel/Tigo phone number',
      'Receive an automated prompt on your screen to authorize the payment',
      'Enter your Airtel Money PIN to confirm the deduction',
      'Both you and the wallet provider receive an instant SMS with a Transaction ID'
    ],
    technical: 'Integrated with Rwanda\'s RNDPS (Rwanda National Digital Payment System)'
  },
  {
    id: 'bank-transfer',
    name: 'Bank Transfer',
    icon: Building,
    description: 'Transfer from bank account',
    color: 'bg-blue-500',
    logo: '🏦 Bank',
    longDescription: 'This method typically uses Rwanda\'s RNDPS or eKash for real-time movement.',
    steps: [
      'Select your bank (e.g., Bank of Kigali, I&M, Cogebanque)',
      'You may be redirected to your bank\'s login page, or shown a QR code',
      'If manual, use the provided wallet account details and Reference Number',
      'Log into your bank app and perform the transfer',
      'The Reference Number helps automatically credit your wallet once confirmed'
    ],
    technical: 'Supports real-time transfers via eKash or direct bank API integration'
  },
  {
    id: 'card',
    name: 'Credit/Debit Card',
    icon: CreditCard,
    description: 'Visa, Mastercard, etc.',
    color: 'bg-purple-500',
    logo: '💳 Card',
    longDescription: 'Used primarily by international travelers or Rwandans with Gold/Platinum accounts.',
    steps: [
      'Enter the 16-digit card number, expiry date, and CVV',
      'Information is sent to a secure gateway (Flutterwave/DPO)',
      'Most Rwandan cards require 3D Secure verification',
      'You receive a One-Time Password (OTP) via SMS from your bank',
      'Enter the OTP to complete the transaction'
    ],
    technical: 'Processed through PCI DSS compliant gateways with 3D Secure authentication'
  }
];

export default function DepositPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [expandedMethod, setExpandedMethod] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>({});
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/deposit');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const handleAmountSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setCurrentStep(2);
  };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setCurrentStep(3);
  };

  // Format Rwandan phone number
  const formatRwandanPhone = (input: string) => {
    // Remove all non-numeric characters except +
    let cleaned = input.replace(/[^\d+]/g, '');

    // If starts with +, check if it's +250
    if (cleaned.startsWith('+')) {
      if (cleaned.startsWith('+250')) {
        return cleaned;
      } else {
        // Replace any other country code with +250
        cleaned = cleaned.substring(1);
      }
    }

    // Remove leading zero if present
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // Add +250 prefix
    return '+250' + cleaned;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatRwandanPhone(value);
    setPaymentDetails({...paymentDetails, phoneNumber: formatted});
  };

  const handlePaymentDetailsSubmit = () => {
    // Basic validation based on method
    if (selectedMethod === 'mtn-momo' || selectedMethod === 'airtel-money') {
      if (!paymentDetails.phoneNumber || paymentDetails.phoneNumber.length < 12) {
        alert('Please enter a valid Rwandan phone number');
        return;
      }
      // Ensure it's a valid Rwandan number
      if (!paymentDetails.phoneNumber.startsWith('+250')) {
        alert('Phone number must be a valid Rwandan number (+250)');
        return;
      }
    } else if (selectedMethod === 'bank-transfer') {
      if (!paymentDetails.bankName || !paymentDetails.accountNumber) {
        alert('Please fill in all bank details');
        return;
      }
    } else if (selectedMethod === 'card') {
      if (!paymentDetails.cardNumber || !paymentDetails.expiry || !paymentDetails.cvv) {
        alert('Please fill in all card details');
        return;
      }
    }
    setCurrentStep(4);
  };

  const handleDeposit = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount.replace(/,/g, '')),
          paymentMethod: selectedMethod,
          paymentDetails: paymentDetails,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Flutterwave payment page
        window.location.href = data.paymentLink;
      } else {
        const error = await response.json();
        alert(`Deposit failed: ${error.error}`);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Deposit error:', error);
      alert('Failed to initiate deposit. Please try again.');
      setIsProcessing(false);
    }
  };

  const formatAmount = (value: string) => {
    const numValue = parseFloat(value.replace(/,/g, ''));
    if (isNaN(numValue)) return '';
    return numValue.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Deposit Funds</h1>
            <p className="text-gray-400">Add money to your Hipa wallet securely</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {depositSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                currentStep >= step.id
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-600 text-gray-600'
              }`}>
                {currentStep > step.id ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              <div className="ml-3 mr-6">
                <div className={`text-sm font-medium ${
                  currentStep >= step.id ? 'text-white' : 'text-gray-600'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              {index < depositSteps.length - 1 && (
                <ChevronRight className={`w-5 h-5 mx-2 ${
                  currentStep > step.id ? 'text-green-500' : 'text-gray-600'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-8">
          {/* Step 1: Enter Amount */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white mb-2">How much would you like to deposit?</h2>
                <p className="text-gray-400">Minimum deposit: 1,000 RWF</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount (RWF)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(formatAmount(e.target.value))}
                      placeholder="Enter amount"
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <div className="absolute right-3 top-3 text-gray-400">RWF</div>
                  </div>
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  {[5000, 10000, 25000, 50000, 100000, 250000].map((quickAmount) => (
                    <button
                      key={quickAmount}
                      onClick={() => setAmount(quickAmount.toLocaleString())}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                    >
                      {quickAmount.toLocaleString()} RWF
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAmountSubmit}
                disabled={!amount || parseFloat(amount.replace(/,/g, '')) < 1000}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Choose Payment Method */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white mb-2">Choose Payment Method</h2>
                <p className="text-gray-400">Deposit {amount} RWF to your wallet</p>
                <p className="text-xs text-gray-500 mt-2">
                  Click on a method to see detailed payment instructions
                </p>
              </div>

              <div className="space-y-4">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isExpanded = expandedMethod === method.id;

                  return (
                    <div key={method.id} className="bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedMethod(isExpanded ? null : method.id)}
                        className="w-full p-4 hover:bg-gray-900 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 ${method.color} rounded-lg flex items-center justify-center text-white font-bold text-lg`}>
                            {method.logo}
                          </div>
                          <div className="flex-1 text-left">
                            <h3 className="font-medium text-white group-hover:text-green-400 transition-colors">
                              {method.name}
                            </h3>
                            <p className="text-sm text-gray-400">{method.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMethodSelect(method.id);
                              }}
                              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              Select
                            </button>
                            <ChevronRight className={`w-5 h-5 text-gray-600 transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`} />
                          </div>
                        </div>
                      </button>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-gray-700">
                          <div className="pt-4 space-y-4">
                            <div>
                              <h4 className="text-green-400 font-medium mb-2">How it works:</h4>
                              <p className="text-gray-300 text-sm mb-3">{method.longDescription}</p>
                              <p className="text-blue-400 text-xs">{method.technical}</p>
                            </div>

                            <div>
                              <h4 className="text-green-400 font-medium mb-2">Step-by-step process:</h4>
                              <ol className="space-y-2">
                                {method.steps.map((step, index) => (
                                  <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                                    <span className="flex-shrink-0 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                                      {index + 1}
                                    </span>
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>

                            {/* Rwandan-specific notes */}
                            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <Shield className="w-4 h-4 text-blue-400 mt-0.5" />
                                <div>
                                  <h5 className="text-blue-400 font-medium text-sm mb-1">Rwanda Banking Standards</h5>
                                  <p className="text-blue-300 text-xs">
                                    {method.id === 'mtn-momo' && 'MTN MoMo is the most widely used mobile money service in Rwanda with over 8 million users.'}
                                    {method.id === 'airtel-money' && 'Airtel Money serves over 4 million Rwandans through the National Digital Payment System.'}
                                    {method.id === 'bank-transfer' && 'Bank transfers are processed through RNDPS ensuring instant settlement.'}
                                    {method.id === 'card' && 'Card payments require 3D Secure authentication as mandated by Rwandan banking regulations.'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentStep(1)}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Back
              </button>
            </div>
          )}

          {/* Step 3: Payment Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white mb-2">Enter Payment Details</h2>
                <p className="text-gray-400">
                  Provide information for {paymentMethods.find(m => m.id === selectedMethod)?.name}
                </p>
              </div>

              <div className="bg-gray-900/50 rounded-lg p-6 space-y-4">
                {/* Mobile Money Details */}
                {(selectedMethod === 'mtn-momo' || selectedMethod === 'airtel-money') && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Phone Number (with country code)
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-3 text-gray-400 font-medium">
                          🇷🇼 +250
                        </div>
                        <input
                          type="tel"
                          placeholder={selectedMethod === 'mtn-momo' ? '788 000 000' : '728 000 000'}
                          value={paymentDetails.phoneNumber?.replace('+250', '') || ''}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          className="w-full pl-20 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          maxLength={9}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Enter your {selectedMethod === 'mtn-momo' ? 'MTN' : 'Airtel'} phone number (without country code)
                      </p>
                      {paymentDetails.phoneNumber && (
                        <p className="text-xs text-green-400 mt-1">
                          Formatted: {paymentDetails.phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Bank Transfer Details */}
                {selectedMethod === 'bank-transfer' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Bank Name
                      </label>
                      <select
                        value={paymentDetails.bankName || ''}
                        onChange={(e) => setPaymentDetails({...paymentDetails, bankName: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select your bank</option>
                        <option value="bank-of-kigali">Bank of Kigali</option>
                        <option value="i&m-bank">I&M Bank</option>
                        <option value="cogebanque">Cogebanque</option>
                        <option value="access-bank">Access Bank</option>
                        <option value="equity-bank">Equity Bank</option>
                        <option value="gt-bank">GT Bank</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Account Number
                      </label>
                      <input
                        type="text"
                        placeholder="Enter account number"
                        value={paymentDetails.accountNumber || ''}
                        onChange={(e) => setPaymentDetails({...paymentDetails, accountNumber: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        placeholder="Full name on account"
                        value={paymentDetails.accountName || ''}
                        onChange={(e) => setPaymentDetails({...paymentDetails, accountName: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {/* Card Details */}
                {selectedMethod === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={paymentDetails.cardNumber || ''}
                        onChange={(e) => setPaymentDetails({...paymentDetails, cardNumber: e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim()})}
                        maxLength={19}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={paymentDetails.expiry || ''}
                          onChange={(e) => setPaymentDetails({...paymentDetails, expiry: e.target.value})}
                          maxLength={5}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          placeholder="123"
                          value={paymentDetails.cvv || ''}
                          onChange={(e) => setPaymentDetails({...paymentDetails, cvv: e.target.value})}
                          maxLength={4}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        placeholder="Full name on card"
                        value={paymentDetails.cardName || ''}
                        onChange={(e) => setPaymentDetails({...paymentDetails, cardName: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handlePaymentDetailsSubmit}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirm Details */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white mb-2">Confirm Deposit</h2>
                <p className="text-gray-400">Review your deposit details</p>
              </div>

              {/* Deposit Summary */}
              <div className="bg-gray-900/50 rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Amount to Deposit</span>
                  <span className="text-white font-medium">{amount} RWF</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Payment Method</span>
                  <span className="text-white font-medium">
                    {paymentMethods.find(m => m.id === selectedMethod)?.name}
                  </span>
                </div>

                {/* Payment Details Summary */}
                {(selectedMethod === 'mtn-momo' || selectedMethod === 'airtel-money') && paymentDetails.phoneNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Phone Number</span>
                    <span className="text-white font-medium">{paymentDetails.phoneNumber}</span>
                  </div>
                )}

                {selectedMethod === 'bank-transfer' && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Bank</span>
                      <span className="text-white font-medium">{paymentDetails.bankName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Account</span>
                      <span className="text-white font-medium">****{paymentDetails.accountNumber?.slice(-4)}</span>
                    </div>
                  </>
                )}

                {selectedMethod === 'card' && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Card</span>
                    <span className="text-white font-medium">****{paymentDetails.cardNumber?.slice(-4)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Processing Fee</span>
                  <span className="text-green-400 font-medium">Free</span>
                </div>
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">Total</span>
                    <span className="text-white font-bold text-lg">{amount} RWF</span>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-blue-400 font-medium mb-1">Secure Transaction</h4>
                    <p className="text-blue-300 text-sm">
                      Your deposit is protected by bank-level security and regulated by the National Bank of Rwanda.
                      All transactions are insured up to 500,000 RWF.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleDeposit}
                  disabled={isProcessing}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Confirm Deposit
                    </>
                  )}
                </button>

                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={isProcessing}
                  className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>BNR Regulated</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>256-bit SSL</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Deposit Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
}