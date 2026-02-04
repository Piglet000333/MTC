import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

export default function PaymentGateway() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Login, 2: OTP, 3: Confirm, 4: Success
  const [mobile, setMobile] = useState('');
  
  const amount = searchParams.get('amount') || '500.00';
  const merchant = "MTC Training Center";

  const handleNext = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(s => s + 1);
    }, 1500);
  };

  const handleSuccess = () => {
    setLoading(true);
    setTimeout(() => {
      // Return to app with success status
      const refNo = 'GC' + Math.floor(10000000000 + Math.random() * 90000000000);
      navigate(`/student?payment_status=success&ref=${refNo}`);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#005CEE] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden min-h-[600px] flex flex-col relative">
        
        {/* Header */}
        <div className="bg-[#005CEE] p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">G</div>
             <span className="font-bold tracking-wide">GCash</span>
          </div>
          <div className="text-sm bg-white/10 px-3 py-1 rounded-full">
            Merchant: {merchant}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 flex flex-col">
          <div className="text-center mb-8">
             <p className="text-gray-500 text-sm mb-1">Total Amount</p>
             <h1 className="text-4xl font-bold text-[#005CEE]">₱{parseFloat(amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</h1>
          </div>

          {step === 1 && (
            <div className="flex-1 flex flex-col gap-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Mobile Number</label>
                <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">+63</span>
                   <input 
                     type="text" 
                     className="w-full pl-14 pr-4 py-3 border-b-2 border-gray-200 focus:border-[#005CEE] outline-none text-xl font-medium transition-colors"
                     placeholder="9XX XXX XXXX"
                     value={mobile}
                     onChange={e => setMobile(e.target.value.replace(/\D/g,'').slice(0,10))}
                   />
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                By tapping Next, you agree to the Terms and Conditions.
              </p>
              <button 
                onClick={handleNext}
                disabled={mobile.length < 10 || loading}
                className="mt-auto bg-[#005CEE] text-white py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>Next <ArrowRight className="w-5 h-5" /></>}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex-1 flex flex-col gap-6">
              <div className="text-center">
                <h3 className="font-bold text-xl text-gray-900">Authentication</h3>
                <p className="text-gray-500 mt-2">We sent a 6-digit authentication code to</p>
                <p className="font-bold text-gray-900">+63 {mobile}</p>
              </div>
              
              <div className="flex justify-center gap-3 my-4">
                 {[1,2,3,4,5,6].map(i => (
                   <div key={i} className="w-10 h-12 border-b-2 border-gray-300 flex items-center justify-center text-xl font-bold text-gray-700">
                     {loading ? '•' : Math.floor(Math.random()*10)}
                   </div>
                 ))}
              </div>

              <button 
                onClick={handleNext}
                disabled={loading}
                className="mt-auto bg-[#005CEE] text-white py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Submit Code'}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="flex-1 flex flex-col gap-6">
               <div className="text-center">
                  <ShieldCheck className="w-16 h-16 text-[#005CEE] mx-auto mb-4" />
                  <h3 className="font-bold text-xl text-gray-900">Payment Confirmation</h3>
                  <p className="text-gray-500 mt-2">You are about to pay</p>
                  <p className="font-bold text-2xl text-gray-900 mt-1">₱{parseFloat(amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                  <p className="text-sm text-gray-500 mt-6">To: <span className="font-bold text-gray-900">{merchant}</span></p>
               </div>

               <button 
                onClick={handleSuccess}
                disabled={loading}
                className="mt-auto bg-[#005CEE] text-white py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Pay Now'}
              </button>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 p-4 text-center">
           <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
             <ShieldCheck className="w-3 h-3" />
             Secured by GCash
           </p>
        </div>
      </div>
    </div>
  );
}