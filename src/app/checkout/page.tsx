'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useCartStore } from '@/store/cartStore';

type Address = {
  id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  sector: string;
  isDefault: boolean;
  lat?: number;
  lng?: number;
};


const RWANDA_DISTRICTS = [
  // Kigali City
  'Gasabo', 'Kicukiro', 'Nyarugenge',
  // Northern Province
  'Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo',
  // Southern Province
  'Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 'Nyaruguru', 'Ruhango',
  // Eastern Province
  'Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana',
  // Western Province
  'Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro'
];

const PAYMENT_METHODS = [
  { id: 'wallet', name: 'Hipa Wallet', icon: '💰', description: 'Pay with your active wallet balance (deposited funds)' },
];

function AddressForm(props: { address: Address; onSelect: () => void; selected: boolean }) {
  return (
    <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${props.selected ? 'border-teal-600 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
      <input type="radio" name="address" checked={props.selected} onChange={props.onSelect} className="mt-1 text-teal-600" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900">{props.address.label}</span>
          {props.address.isDefault && <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">Default</span>}
        </div>
        <p className="text-gray-600">{props.address.name}</p>
        <p className="text-gray-600">{props.address.phone}</p>
        <p className="text-gray-500 text-sm mt-1">{props.address.address}</p>
      </div>
    </label>
  );
}

function PaymentMethodCard(props: { method: typeof PAYMENT_METHODS[0]; onSelect: () => void; selected: boolean }) {
  return (
    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${props.selected ? 'border-teal-600 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
      <input type="radio" name="payment" checked={props.selected} onChange={props.onSelect} className="text-teal-600" />
      <span className="text-2xl">{props.method.icon}</span>
      <div className="flex-1">
        <div className="font-semibold text-gray-900">{props.method.name}</div>
        <div className="text-sm text-gray-500">{props.method.description}</div>
      </div>
    </label>
  );
}

function AddAddressForm(props: { onSave: (address: Address) => void; onCancel: () => void }) {
  const [mode, setMode] = useState<'manual' | 'location'>('manual');
  const [formData, setFormData] = useState({ label: '', name: '', phone: '', address: '', sector: '' });
  const [loading, setLoading] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          // Try to detect district from various address fields
          let detectedDistrict = '';
          const addressFields = [
            data.address?.county,
            data.address?.city_district,
            data.address?.suburb,
            data.address?.city,
            data.address?.town,
            data.address?.village,
            data.display_name
          ].filter(Boolean);

          for (const field of addressFields) {
            for (const district of RWANDA_DISTRICTS) {
              if (field!.toLowerCase().includes(district.toLowerCase())) {
                detectedDistrict = district;
                break;
              }
            }
            if (detectedDistrict) break;
          }

          setFormData(prev => ({
            ...prev,
            address: '', // Let user fill the address description
            sector: detectedDistrict
          }));
        } catch (error) {
          console.error('Error reverse geocoding:', error);
          setFormData(prev => ({
            ...prev,
            address: '',
            sector: ''
          }));
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your location. Please check permissions and try again.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // High accuracy options
    );
  };

  const handleSave = () => {
    if (!formData.label || !formData.name || !formData.phone || !formData.address || !formData.sector) {
      alert('Please fill all fields.');
      return;
    }
    const newAddr = {
      id: Date.now().toString(),
      ...formData,
      isDefault: false,
      lat: coordinates?.lat || null,
      lng: coordinates?.lng || null
    };
    props.onSave(newAddr);
  };

  return (
    <div className="bg-gray-50 rounded-xl p-6 mt-4">
      <div className="flex gap-2 mb-4">
        <button onClick={() => setMode('manual')} className={`px-4 py-2 rounded-lg ${mode === 'manual' ? 'bg-teal-600 text-white' : 'bg-gray-200'}`}>Manual Entry</button>
        <button onClick={() => setMode('location')} className={`px-4 py-2 rounded-lg ${mode === 'location' ? 'bg-teal-600 text-white' : 'bg-gray-200'}`}>Use Current Location</button>
      </div>
      {mode === 'location' && (
        <div className="mb-4">
          <button onClick={handleGetLocation} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Getting Location...' : 'Get My Location'}
          </button>
          {coordinates && (
            <p className="text-sm text-gray-600 mt-2">Pinned at {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}</p>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" placeholder="Label (e.g. Home, Office)" value={formData.label} onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))} className="p-3 border rounded-lg" />
        <input type="text" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="p-3 border rounded-lg" />
        <input type="tel" placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} className="p-3 border rounded-lg" />
        <select value={formData.sector} onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))} className="p-3 border rounded-lg">
          <option value="">Select District</option>
          {RWANDA_DISTRICTS.map(district => <option key={district} value={district}>{district}</option>)}
        </select>
      </div>
      <textarea placeholder="Describe your location (e.g., near the market, close to hospital, specific landmark)" value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} className="w-full p-3 border rounded-lg mt-4" rows={3} />
      <div className="flex gap-3 mt-4">
        <button onClick={handleSave} className="px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700">Save Address</button>
        <button onClick={props.onCancel} className="px-6 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50">Cancel</button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const [step, setStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('wallet');
  const [orderPlaced, setOrderPlaced] = useState(false);
  // For demo purposes - in real app this would come from user profile/location data
  const [userSector, setUserSector] = useState('Gasabo'); // Default to Gasabo sector

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('hipa_addresses');
    if (stored) {
      try {
        const addresses = JSON.parse(stored) as Address[];
        setSavedAddresses(addresses);
        if (addresses.length > 0 && !selectedAddress) {
          setSelectedAddress(addresses[0].id);
        }
      } catch (e) {
        console.error('Error loading addresses', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hipa_addresses', JSON.stringify(savedAddresses));
  }, [savedAddresses]);

  const handleSaveAddress = (newAddr: Address) => {
    setSavedAddresses(prev => {
      const updated = [...prev, newAddr];
      // If no default, set this as default
      if (!updated.some(addr => addr.isDefault)) {
        newAddr.isDefault = true;
      }
      return updated;
    });
    setSelectedAddress(newAddr.id);
    setShowAddForm(false);
  };

  const { items: cartItems } = useCartStore();

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Dynamic shipping calculation based on location
  // Free shipping over 100,000 RWF
  // 1,000 RWF for same sector delivery
  // 2,000 RWF for different region delivery
  const getShippingCost = () => {
    if (subtotal > 100000) return 0;

    if (!selectedAddress || selectedAddress === '') return 2000; // No address selected

    // Get selected address district
    const selectedAddr = savedAddresses.find(addr => addr.id === selectedAddress);
    if (!selectedAddr) return 2000; // Default to higher cost if no address selected

    // For demo: assume most sellers are in Gasabo district
    // In real app, this would compare user delivery address district vs each seller's location
    const isSameDistrict = selectedAddr.sector === 'Gasabo';
    return isSameDistrict ? 1000 : 2000;
  };

  const shipping = getShippingCost();
  const escrowFee = (subtotal + shipping) * 0.02;
  const total = subtotal + shipping + escrowFee;

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4 py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
            <p className="text-gray-600 mb-6">Thank you for your order. Your payment is being held securely in escrow.</p>
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
              <div className="text-sm text-gray-500 mb-1">Order Number</div>
              <div className="text-xl font-bold text-gray-900">#HPA-2024-001234</div>
            </div>
            <div className="bg-teal-50 rounded-xl p-4 mb-6 text-left">
              <h3 className="font-semibold text-teal-900 mb-2">What's Next?</h3>
              <ul className="text-sm text-teal-700 space-y-1">
                <li>✓ Seller has been notified to ship your order</li>
                <li>✓ You will receive updates via SMS/Email</li>
                <li>✓ Track your order in your account</li>
                <li>✓ Confirm delivery to release funds to seller</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Link href="/orders" className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700">Track Order</Link>
              <Link href="/" className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50">Continue Shopping</Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Steps */}
              <div className="flex items-center gap-4 mb-8">
                {['Shipping', 'Payment', 'Review'].map((label, i) => (
                  <div key={label} className={`flex items-center gap-2 ${i + 1 <= step ? 'text-teal-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i + 1 <= step ? 'bg-teal-600 text-white' : 'bg-gray-200'}`}>{i + 1}</div>
                    <span className="font-medium">{label}</span>
                    {i < 2 && <span className="text-gray-300">→</span>}
                  </div>
                ))}
              </div>

              {/* Shipping Address */}
              {step >= 1 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
                  <div className="space-y-3">
                    {savedAddresses.map((addr) => (
                      <AddressForm key={addr.id} address={addr} selected={selectedAddress === addr.id} onSelect={() => setSelectedAddress(addr.id)} />
                    ))}
                  </div>
                  <button onClick={() => setShowAddForm(true)} className="mt-4 text-teal-600 hover:text-teal-700 font-medium">+ Add New Address</button>
                  {showAddForm && <AddAddressForm onSave={handleSaveAddress} onCancel={() => setShowAddForm(false)} />}
                </div>
              )}

              {/* Payment Method */}
              {step >= 2 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
                  <div className="space-y-3">
                    {PAYMENT_METHODS.map((method) => (
                      <PaymentMethodCard key={method.id} method={method} selected={selectedPayment === method.id} onSelect={() => setSelectedPayment(method.id)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Escrow Info */}
              {step >= 2 && (
                <div className="bg-teal-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-teal-900">Secure Escrow Protection</h4>
                      <p className="text-sm text-teal-700 mt-1">Your payment is held securely until you confirm delivery. Funds are released to seller after 3 days.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3">
                {step > 1 && <button onClick={() => setStep(step - 1)} className="px-6 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50">Back</button>}
                {step < 3 ? (
                  <button onClick={() => setStep(step + 1)} className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700">Continue</button>
                ) : (
                  <button onClick={() => setOrderPlaced(true)} className="flex-1 py-3 bg-amber-500 text-gray-900 rounded-xl font-bold hover:bg-amber-600">Place Order - {total.toLocaleString()} RWF</button>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-3 mb-4">
                  {cartItems.map((item) => (
                    <div key={item.productId} className="flex gap-3">
                      <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image src={item.image} alt={item.title} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.title}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-sm font-medium">{(item.price * item.quantity).toLocaleString()} RWF</div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-3 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium">{subtotal.toLocaleString()} RWF</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span className="font-medium">{shipping === 0 ? 'Free' : shipping.toLocaleString() + ' RWF'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Escrow Fee (2%)</span><span className="font-medium">{escrowFee.toLocaleString()} RWF</span></div>
                  <div className="flex justify-between pt-2 border-t border-gray-200"><span className="font-semibold">Total</span><span className="font-bold text-lg">{total.toLocaleString()} RWF</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
