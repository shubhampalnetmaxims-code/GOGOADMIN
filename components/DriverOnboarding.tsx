
import React, { useState } from 'react';
// Added ShieldCheck to the imports from lucide-react
import { ChevronLeft, Car, Smartphone, X, Mail, User, Info, AlertTriangle, Upload, CheckCircle2, ShieldCheck } from 'lucide-react';

type Step = 'mobile' | 'otp' | 'profile' | 'category' | 'checklist' | 'license' | 'national_id' | 'profile_pic' | 'vehicle_info' | 'rc_insurance';

export const DriverOnboarding: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState<Step>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [name, setName] = useState('Nolan');
  const [selectedCategory, setSelectedCategory] = useState('Car');

  const renderContent = () => {
    switch (step) {
      case 'mobile':
        return (
          <div className="flex flex-col h-full bg-white p-8">
            <div className="flex flex-col items-center mb-12 mt-10">
              <div className="text-4xl font-black text-blue-600 flex items-center">
                <span>G</span>
                <span className="text-yellow-500 relative top-1 mx-0.5"><Car size={32} fill="currentColor" strokeWidth={0}/></span>
                <span>go</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mt-2">Driver App</h2>
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-6">Your Mobile Number</h3>
            
            <div className="flex border border-gray-200 rounded-2xl overflow-hidden mb-6 h-16 items-center">
              <div className="px-5 text-gray-500 border-r border-gray-100 font-medium">+250</div>
              <input 
                type="tel" 
                placeholder="Enter Mobile Number" 
                className="flex-1 px-4 h-full outline-none text-gray-900 font-medium"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
              />
            </div>
            
            <button 
              onClick={() => setStep('otp')}
              className="w-full bg-[#1a56ff] text-white py-5 rounded-2xl font-bold text-lg shadow-lg mb-8"
            >
              Send OTP
            </button>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px bg-gray-200 flex-1"></div>
              <span className="text-gray-400 font-medium text-sm">or</span>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>
            
            <button className="w-full bg-[#f4d054] text-gray-900 py-5 rounded-2xl font-bold text-lg shadow-sm">
              Continue with Email ID
            </button>
          </div>
        );

      case 'otp':
        return (
          <div className="flex flex-col h-full bg-white">
            <div className="p-6">
              <button onClick={() => setStep('mobile')}><ChevronLeft size={28} /></button>
            </div>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify account with OTP</h2>
              <p className="text-gray-500 font-medium mb-12">We've sent a 4-digit code to +250-452****</p>
              
              <div className="flex gap-4 mb-12">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`flex-1 h-16 border-2 rounded-2xl flex items-center justify-center font-bold text-2xl ${i === 1 ? 'border-blue-600' : 'border-gray-200'}`}>
                    {i === 1 ? '' : ''}
                  </div>
                ))}
              </div>
              
              <div className="mt-auto grid grid-cols-3 gap-1 bg-gray-100 -mx-8 -mb-8 p-2 pb-10">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((key, i) => (
                   <button 
                    key={i} 
                    onClick={() => key !== '' && setStep('profile')}
                    className="h-16 bg-white rounded-lg flex flex-col items-center justify-center font-bold text-2xl shadow-sm active:bg-gray-200"
                   >
                     {key === 'del' ? <X size={20} /> : key}
                   </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="flex flex-col h-full bg-[#f8faff]">
            <div className="bg-[#1a56ff] pt-12 pb-8 px-8 rounded-b-[40px] text-white">
              <h2 className="text-2xl font-bold">Tell us about yourself</h2>
            </div>
            <div className="p-8 space-y-4">
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <input placeholder="Full Name" className="w-full outline-none text-gray-700 font-medium" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <input placeholder="Email ID" className="w-full outline-none text-gray-700 font-medium" />
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex justify-between items-center text-gray-500">
                <span>Gender</span>
                <ChevronLeft size={20} className="-rotate-90" />
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <input placeholder="Mobile Number" className="w-full outline-none text-gray-700 font-medium" value={mobileNumber} readOnly />
              </div>
              
              <div className="pt-10">
                <button 
                  onClick={() => setStep('category')}
                  className="w-full bg-gray-300 text-white py-5 rounded-2xl font-bold text-xl shadow-sm"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        );

      case 'category':
        return (
          <div className="flex flex-col h-full bg-[#f8faff] p-8 overflow-y-auto no-scrollbar">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-10">
              <span className="text-xs text-gray-400 block mb-1">City*</span>
              <span className="font-bold text-gray-900">Kigali</span>
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-6">Now, Choose how you want to earn with GoGo</h3>
            
            <div className="space-y-4 mb-8">
              <CategoryOption 
                title="Car" 
                badge="Rides" 
                desc="You have a car you wish to drive or employ others to drive"
                active={selectedCategory === 'Car'}
                onClick={() => setSelectedCategory('Car')}
                icon="🚗"
              />
              <CategoryOption 
                title="Motorbike" 
                badge="Rides" 
                desc="You have a motorcycle or scooter for fast personal rides."
                active={selectedCategory === 'Motorbike'}
                onClick={() => setSelectedCategory('Motorbike')}
                icon="🏍️"
              />
              <CategoryOption 
                title="Chauffeur" 
                badge="Driver" 
                desc="You prefer to work as a chauffeur using vehicles provided by clients."
                active={selectedCategory === 'Chauffeur'}
                onClick={() => setSelectedCategory('Chauffeur')}
                icon="👮"
              />
              <CategoryOption 
                title="GoGo Vehicle" 
                badge="Rental" 
                badgeColor="bg-yellow-100 text-yellow-600"
                desc="You prefer to rent a vehicle provided by the company for driving."
                active={selectedCategory === 'GoGo Vehicle'}
                onClick={() => setSelectedCategory('GoGo Vehicle')}
                icon="🚙"
              />
            </div>
            
            <button 
              onClick={() => setStep('checklist')}
              className="w-full bg-[#1a56ff] text-white py-5 rounded-2xl font-bold text-xl shadow-lg mt-auto"
            >
              Next
            </button>
          </div>
        );

      case 'checklist':
        return (
          <div className="flex flex-col h-full bg-white overflow-y-auto no-scrollbar">
            <div className="bg-[#1a56ff] pt-6 pb-12 px-8 rounded-b-[40px] text-white relative">
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-medium">Kigali • {selectedCategory} {selectedCategory === 'Car' ? '🚗' : '🏍️'}</span>
                <Edit2Icon />
              </div>
              <h2 className="text-2xl font-bold mb-1">Welcome, {name}</h2>
              <p className="opacity-90">Complete your profile to start earning</p>
            </div>
            
            <div className="px-8 py-6 divide-y divide-gray-100">
              <ChecklistItem label="Driving Licence" status="review" onClick={() => setStep('license')} />
              <ChecklistItem label="National ID" status="review" onClick={() => setStep('national_id')} />
              <ChecklistItem label="Profile Picture" status="verified" onClick={() => setStep('profile_pic')} />
              <ChecklistItem label="Vehicle Information" status="review" onClick={() => setStep('vehicle_info')} />
            </div>
          </div>
        );

      case 'license':
        return (
          <div className="flex flex-col h-full bg-white p-8">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setStep('checklist')}><ChevronLeft size={28} /></button>
              <h2 className="text-xl font-bold text-gray-900">Driving License</h2>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-8 flex gap-3">
              <AlertTriangle className="text-red-500 shrink-0" size={24} />
              <div>
                <p className="text-red-500 font-bold text-sm">Error!</p>
                <p className="text-red-800 text-xs">Your License Number is not matching with the document you uploaded</p>
              </div>
            </div>
            
            <div className="bg-blue-50 h-48 rounded-2xl mb-8 flex items-center justify-center">
              <div className="w-32 h-20 bg-white rounded-lg shadow-sm p-2">
                <div className="w-8 h-8 bg-pink-300 rounded-md mb-2"></div>
                <div className="h-1 bg-gray-100 w-full mb-1"></div>
                <div className="h-1 bg-gray-100 w-2/3 mb-1"></div>
                <div className="h-1 bg-gray-100 w-1/2"></div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs text-gray-400 block mb-1">License Number</label>
                <div className="border-b-2 border-gray-100 pb-2 text-lg font-bold">RL-2023-0056789</div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Expiry Date</label>
                <div className="border-b-2 border-gray-100 pb-2 text-lg font-bold">10/05/2029</div>
              </div>
            </div>
            
            <div className="mt-auto space-y-4">
              <div className="flex justify-between items-center text-sm font-bold text-gray-800 border-t pt-4">
                <span>Driving Licence Image Front</span>
                <button className="bg-gray-100 px-4 py-2 rounded-lg">Upload</button>
              </div>
              <button 
                onClick={() => setStep('checklist')}
                className="w-full bg-[#1a56ff] text-white py-5 rounded-2xl font-bold text-lg"
              >
                Save & Next
              </button>
            </div>
          </div>
        );

      case 'vehicle_info':
        return (
          <div className="flex flex-col h-full bg-white p-8 overflow-y-auto no-scrollbar">
            <div className="flex items-center gap-4 mb-10">
              <button onClick={() => setStep('checklist')}><ChevronLeft size={28} /></button>
              <h2 className="text-xl font-bold text-gray-900">Vehicle Information</h2>
            </div>
            
            <h3 className="text-xl font-bold mb-6">Vehicle</h3>
            
            <div className="space-y-8">
              <DropdownField label="Make" value="Toyota" />
              <DropdownField label="Model" value="Hilux" />
              <DropdownField label="Variant" value="HTK +" />
              <DropdownField label="Color" value="White" />
              <div>
                <label className="text-xs text-gray-400 block mb-1">Chassis Number</label>
                <div className="border-b-2 border-gray-100 pb-2 font-bold text-lg">ABC123XY7456</div>
              </div>
            </div>
            
            <div className="mt-12 space-y-8">
              <h3 className="text-xl font-bold">Registration Certificate</h3>
              <div className="flex justify-between items-center text-lg font-medium text-gray-800">
                <span>RC Image</span>
                <button className="bg-gray-100 px-4 py-2 rounded-lg font-bold text-sm">Upload</button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Registration Number</label>
                  <div className="border-b-2 border-gray-100 pb-2 font-bold text-lg uppercase">KL51CP6393</div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Expiry Date</label>
                  <div className="border-b-2 border-gray-100 pb-2 font-bold text-lg">2036-08-03</div>
                </div>
              </div>
            </div>
            
            <div className="mt-12 pb-8">
              <button 
                onClick={() => setStep('checklist')}
                className="w-full bg-[#1a56ff] text-white py-5 rounded-2xl font-bold text-lg"
              >
                Save & Next
              </button>
            </div>
          </div>
        );

      default:
        return <div className="p-8">Step in progress...</div>;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-hidden">
      {/* Phone Frame */}
      <div className="relative w-full max-w-[375px] h-full max-h-[812px] bg-white rounded-[60px] shadow-[0_0_80px_rgba(0,0,0,0.5)] border-[12px] border-gray-900 overflow-hidden flex flex-col animate-in zoom-in duration-300">
        {/* Status Bar Mock */}
        <div className="h-8 bg-transparent flex items-center justify-between px-10 absolute top-0 w-full z-20 pointer-events-none">
          <span className="text-xs font-bold text-gray-800">9:41</span>
          <div className="flex gap-1.5">
            <div className="w-4 h-2 bg-gray-800 rounded-sm"></div>
            <div className="w-3 h-2 bg-gray-800 rounded-sm"></div>
            <div className="w-5 h-2 bg-gray-800 rounded-sm"></div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
          {renderContent()}
        </div>

        {/* Home Indicator */}
        <div className="h-6 bg-white flex justify-center items-end pb-2">
          <div className="w-32 h-1 bg-gray-200 rounded-full"></div>
        </div>
      </div>
      
      {/* Close Overlay Button */}
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 text-white hover:bg-white/10 p-3 rounded-full transition-colors"
      >
        <X size={32} />
      </button>
    </div>
  );
};

const CategoryOption = ({ title, badge, desc, active, onClick, icon, badgeColor = "bg-blue-100 text-blue-600" }: any) => (
  <button 
    onClick={onClick}
    className={`w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center gap-4 ${active ? 'bg-white border-black shadow-lg' : 'bg-white border-gray-100'}`}
  >
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <h4 className="font-bold text-lg text-gray-900">{title}</h4>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${badgeColor}`}>{badge}</span>
      </div>
      <p className="text-xs text-gray-500 font-medium leading-relaxed">{desc}</p>
    </div>
    <div className="text-3xl grayscale-[0.5]">{icon}</div>
  </button>
);

const ChecklistItem = ({ label, status, onClick }: any) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between py-6 text-left group"
  >
    <div>
      <h4 className="font-bold text-gray-900 text-lg mb-0.5">{label}</h4>
      <div className="flex items-center gap-1.5">
        {status === 'review' ? (
          <>
            <span className="text-gray-400 text-sm font-medium">Under Review</span>
            <div className="w-4 h-4 rounded-full border-2 border-gray-200 border-t-gray-400 animate-spin" />
          </>
        ) : status === 'verified' ? (
          <>
            <span className="text-green-500 text-sm font-medium">Verified</span>
            <CheckCircle2 size={16} className="text-green-500" />
          </>
        ) : (
          <>
            <span className="text-red-500 text-sm font-medium">Invalid</span>
            <ShieldCheck size={16} className="text-red-500" />
          </>
        )}
      </div>
    </div>
    <ChevronLeft size={24} className="rotate-180 text-gray-400 group-hover:translate-x-1 transition-transform" />
  </button>
);

const DropdownField = ({ label, value }: any) => (
  <div className="relative border-b-2 border-gray-100 pb-2">
    <label className="text-xs text-gray-400 block mb-1">{label}</label>
    <div className="flex justify-between items-center">
      <span className="font-bold text-lg text-gray-900">{value}</span>
      <ChevronLeft size={20} className="-rotate-90 text-gray-400" />
    </div>
  </div>
);

const Edit2Icon = () => (
  <div className="p-2 border border-white/30 rounded-lg">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
  </div>
);
