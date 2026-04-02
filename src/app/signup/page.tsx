'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

type UserRole = 'buyer' | 'seller';

interface SellerFormData {
  storeName: string;
  storeSlug: string;
  storeBio: string;
  storeCategories: string[];
  city: string;
  country: string;
  phone: string;
  payoutType: 'mobile_money' | 'bank';
  payoutProvider: string;
  payoutNumber: string;
  bankName: string;
  accountNumber: string;
}

export default function SignupPage() {
  const router = useRouter();
  const { login, setLoading } = useAuthStore();
  
  const [step, setStep] = useState<'role-select' | 'signup'>('role-select');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  
  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('RW');
  const [phone, setPhone] = useState('');
  
  // Seller-specific fields
  const [sellerData, setSellerData] = useState<SellerFormData>({
    storeName: '',
    storeSlug: '',
    storeBio: '',
    storeCategories: [],
    city: '',
    country: 'RW',
    phone: '',
    payoutType: 'mobile_money',
    payoutProvider: '',
    payoutNumber: '',
    bankName: '',
    accountNumber: '',
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    'Fashion', 'Electronics', 'Home & Garden', 'Beauty', 'Sports',
    'Toys', 'Automotive', 'Books', 'Health', 'Food', 'Art', 'Other'
  ];

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('signup');
    setError('');
  };

  const handleSellerDataChange = (field: keyof SellerFormData, value: string | string[]) => {
    setSellerData(prev => ({ ...prev, [field]: value }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleStoreNameChange = (name: string) => {
    handleSellerDataChange('storeName', name);
    handleSellerDataChange('storeSlug', generateSlug(name));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setLoading(true);

    try {
      const payload: any = {
        email,
        password,
        displayName,
        city,
        country,
        phone,
        role: selectedRole,
      };

      // Add seller-specific data if registering as seller
      if (selectedRole === 'seller') {
        if (!sellerData.storeName || !sellerData.storeSlug) {
          throw new Error('Store name is required for sellers');
        }
        if (!sellerData.phone && !phone) {
          throw new Error('Phone number is required for sellers');
        }
        if (sellerData.payoutType === 'mobile_money' && !sellerData.payoutNumber) {
          throw new Error('Mobile money number is required for payouts');
        }
        if (sellerData.payoutType === 'bank' && (!sellerData.bankName || !sellerData.accountNumber)) {
          throw new Error('Bank details are required for payouts');
        }

        payload.sellerData = {
          store: {
            name: sellerData.storeName,
            slug: sellerData.storeSlug,
            bio: sellerData.storeBio,
            categories: sellerData.storeCategories,
            location: {
              city: sellerData.city || city,
              country: sellerData.country || country,
            },
          },
          phone: sellerData.phone || phone,
          payoutMethods: [{
            type: sellerData.payoutType,
            provider: sellerData.payoutProvider,
            number: sellerData.payoutNumber,
            bankName: sellerData.bankName,
            accountNumber: sellerData.accountNumber,
            isPrimary: true,
          }],
        };
      }

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      login(data.user, data.token);
      
      // Redirect based on role
      if (selectedRole === 'seller') {
        router.push('/seller/dashboard');
      } else {
        router.push('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center">
          <svg width="48" height="48" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="8" fill="#1a1a1a"/>
            <path d="M12 28C12 28 14 18 20 18C26 18 28 28 28 28" stroke="#f5f5dc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 14C10 14 11 10 15 10C17 10 18 12 18 12" stroke="#f5f5dc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="15" cy="26" r="2" fill="#f5f5dc"/>
            <circle cx="25" cy="26" r="2" fill="#f5f5dc"/>
            <path d="M20 18V12" stroke="#f5f5dc" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 'role-select' 
            ? 'Choose your account type'
            : `Sign up as a ${selectedRole}`}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {step === 'role-select' ? (
            <div className="space-y-4">
              {/* Buyer Option */}
              <button
                onClick={() => handleRoleSelect('buyer')}
                className="w-full flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-hipa-primary hover:bg-hipa-primary/5 transition-all"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Sign up as Buyer</h3>
                <p className="mt-2 text-sm text-gray-500 text-center">
                  Browse and purchase products from sellers across Rwanda
                </p>
                <div className="mt-3 flex items-center text-xs text-gray-400">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Can buy products only
                </div>
              </button>

              {/* Seller Option */}
              <button
                onClick={() => handleRoleSelect('seller')}
                className="w-full flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-hipa-primary hover:bg-hipa-primary/5 transition-all"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Sign up as Seller</h3>
                <p className="mt-2 text-sm text-gray-500 text-center">
                  Manage your store, list products, and sell to customers
                </p>
                <div className="mt-3 flex items-center text-xs text-gray-400">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Can buy and sell products
                </div>
              </button>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/login" className="font-medium text-hipa-primary hover:text-hipa-primary/80">
                    Login
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSignup}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Common Fields */}
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                  Display Name *
                </label>
                <div className="mt-1">
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-hipa-primary focus:border-hipa-primary sm:text-sm"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address *
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-hipa-primary focus:border-hipa-primary sm:text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number {selectedRole === 'seller' ? '*' : ''}
                </label>
                <div className="mt-1">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required={selectedRole === 'seller'}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-hipa-primary focus:border-hipa-primary sm:text-sm"
                    placeholder="+250788000000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City *
                  </label>
                  <div className="mt-1">
                    <input
                      id="city"
                      name="city"
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-hipa-primary focus:border-hipa-primary sm:text-sm"
                      placeholder="Kigali"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                    Country *
                  </label>
                  <div className="mt-1">
                    <select
                      id="country"
                      name="country"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-hipa-primary focus:border-hipa-primary sm:text-sm"
                    >
                      <option value="RW">Rwanda</option>
                      <option value="KE">Kenya</option>
                      <option value="UG">Uganda</option>
                      <option value="TZ">Tanzania</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-hipa-primary focus:border-hipa-primary sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password *
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-hipa-primary focus:border-hipa-primary sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Seller-Specific Fields */}
              {selectedRole === 'seller' && (
                <>
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Store Information</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="storeName" className="block text-sm font-medium text-gray-700">
                          Store Name *
                        </label>
                        <div className="mt-1">
                          <input
                            id="storeName"
                            name="storeName"
                            type="text"
                            required
                            value={sellerData.storeName}
                            onChange={(e) => handleStoreNameChange(e.target.value)}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-hipa-primary focus:border-hipa-primary sm:text-sm"
                            placeholder="My Awesome Store"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="storeSlug" className="block text-sm font-medium text-gray-700">
                          Store URL *
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                            myhipa.com/store/
                          </span>
                          <input
                            id="storeSlug"
                            name="storeSlug"
                            type="text"
                            required
                            value={sellerData.storeSlug}
                            onChange={(e) => handleSellerDataChange('storeSlug', e.target.value)}
                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-hipa-primary focus:border-hipa-primary sm:text-sm"
                            placeholder="my-awesome-store"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="storeBio" className="block text-sm font-medium text-gray-700">
                          Store Description
                        </label>
                        <div className="mt-1">
                          <textarea
                            id="storeBio"
                            name="storeBio"
                            rows={3}
                            value={sellerData.storeBio}
                            onChange={(e) => handleSellerDataChange('storeBio', e.target.value)}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-hipa-primary focus:border-hipa-primary sm:text-sm"
                            placeholder="Tell customers about your store..."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Categories *
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {categories.map((cat) => (
                            <label key={cat} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={sellerData.storeCategories.includes(cat)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleSellerDataChange('storeCategories', [...sellerData.storeCategories, cat]);
                                  } else {
                                    handleSellerDataChange('storeCategories', sellerData.storeCategories.filter(c => c !== cat));
                                  }
                                }}
                                className="h-4 w-4 text-hipa-primary focus:ring-hipa-primary border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">{cat}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="sellerCity" className="block text-sm font-medium text-gray-700">
                            Store City *
                          </label>
                          <div className="mt-1">
                            <input
                              id="sellerCity"
                              name="sellerCity"
                              type="text"
                              required
                              value={sellerData.city}
                              onChange={(e) => handleSellerDataChange('city', e.target.value)}
                              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-hipa-primary focus:border-hipa-primary sm:text-sm"
                              placeholder="Kigali"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="sellerCountry" className="block text-sm font-medium text-gray-700">
                            Store Country *
                          </label>
                          <div className="mt-1">
                            <select
                              id="sellerCountry"
                              name="sellerCountry"
                              required
                              value={sellerData.country}
                              onChange={(e) => handleSellerDataChange('country', e.target.value)}
                              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-hipa-primary focus:border-hipa-primary sm:text-sm"
                            >
                              <option value="RW">Rwanda</option>
                              <option value="KE">Kenya</option>
                              <option value="UG">Uganda</option>
                              <option value="TZ">Tanzania</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="sellerPhone" className="block text-sm font-medium text-gray-700">
                          Business Phone *
                        </label>
                        <div className="mt-1">
                          <input
                            id="sellerPhone"
                            name="sellerPhone"
                            type="tel"
                            required
                            value={sellerData.phone}
                            onChange={(e) => handleSellerDataChange('phone', e.target.value)}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-hipa-primary focus:border-hipa-primary sm:text-sm"
                            placeholder="+250788000000"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Payout Information</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payout Method *
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="payoutType"
                              value="mobile_money"
                              checked={sellerData.payoutType === 'mobile_money'}
                              onChange={(e) => handleSellerDataChange('payoutType', e.target.value)}
                              className="h-4 w-4 text-hipa-primary focus:ring-hipa-primary border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Mobile Money</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="payoutType"
                              value="bank"
                              checked={sellerData.payoutType === 'bank'}
                              onChange={(e) => handleSellerDataChange('payoutType', e.target.value)}
                              className="h-4 w-4 text-hipa-primary focus:ring-hipa-primary border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Bank Transfer</span>
                          </label>
                        </div>
                      </div>

                      {sellerData.payoutType === 'mobile_money' ? (
                        <>
                          <div>
                            <label htmlFor="payoutProvider" className="block text-sm font-medium text-gray-700">
                              Mobile Money Provider *
                            </label>
                            <div className="mt-1">
                              <select
                                id="payoutProvider"
                                name="payoutProvider"
                                required
                                value={sellerData.payoutProvider}
                                onChange={(e) => handleSellerDataChange('payoutProvider', e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-hipa-primary focus:border-hipa-primary sm:text-sm"
                              >
                                <option value="">Select provider</option>
                                <option value="MTN">MTN Mobile Money</option>
                                <option value="Airtel">Airtel Money</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label htmlFor="payoutNumber" className="block text-sm font-medium text-gray-700">
                              Mobile Money Number *
                            </label>
                            <div className="mt-1">
                              <input
                                id="payoutNumber"
                                name="payoutNumber"
                                type="tel"
                                required
                                value={sellerData.payoutNumber}
                                onChange={(e) => handleSellerDataChange('payoutNumber', e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-hipa-primary focus:border-hipa-primary sm:text-sm"
                                placeholder="+250788000000"
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
                              Bank Name *
                            </label>
                            <div className="mt-1">
                              <input
                                id="bankName"
                                name="bankName"
                                type="text"
                                required
                                value={sellerData.bankName}
                                onChange={(e) => handleSellerDataChange('bankName', e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-hipa-primary focus:border-hipa-primary sm:text-sm"
                                placeholder="Bank of Kigali"
                              />
                            </div>
                          </div>

                          <div>
                            <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                              Account Number *
                            </label>
                            <div className="mt-1">
                              <input
                                id="accountNumber"
                                name="accountNumber"
                                type="text"
                                required
                                value={sellerData.accountNumber}
                                onChange={(e) => handleSellerDataChange('accountNumber', e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-hipa-primary focus:border-hipa-primary sm:text-sm"
                                placeholder="1234567890"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-hipa-primary hover:bg-hipa-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-hipa-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    `Create ${selectedRole === 'seller' ? 'Seller' : 'Buyer'} Account`
                  )}
                </button>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep('role-select');
                    setSelectedRole(null);
                    setError('');
                  }}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-hipa-primary"
                >
                  Back to role selection
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/login" className="font-medium text-hipa-primary hover:text-hipa-primary/80">
                    Login
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
