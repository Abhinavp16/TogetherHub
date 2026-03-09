import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Code, PenTool, UserPlus, XCircle, Check, Users, Video } from 'lucide-react';
import { roomAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CreateRoomModal = ({ isOpen, onClose, onCreate }) => {
  const modalRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'document',
    isPrivate: false,
    invites: []
  });
  const [selectedTeam, setSelectedTeam] = useState('');

  const availableTeams = [
    {
      id: 't1', name: 'General Workspace',
      members: ['abhinav@togetherhub.test', 'sarah.j@togetherhub.test', 'marcus@togetherhub.test', 'elena.r@togetherhub.test', 'david.s@togetherhub.test']
    },
    {
      id: 't2', name: 'Frontend Reboot',
      members: ['abhinav@togetherhub.test', 'marcus@togetherhub.test', 'elena.r@togetherhub.test']
    },
    {
      id: 't3', name: 'Marketing Assets',
      members: ['sarah.j@togetherhub.test', 'david.s@togetherhub.test']
    }
  ];
  const [emailInput, setEmailInput] = useState('');
  const [isValidEmail, setIsValidEmail] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.name.trim()) {
      setLoading(true);
      try {
        const response = await roomAPI.createRoom(formData);
        toast.success('Room created successfully');
        onCreate(response.data);
        onClose();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to create room');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle click outside to close modal
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAddInvite = () => {
    if (emailInput && validateEmail(emailInput) && !formData.invites.includes(emailInput)) {
      setFormData(prev => ({
        ...prev,
        invites: [...prev.invites, emailInput]
      }));
      setEmailInput('');
      setIsValidEmail(true);
    } else if (emailInput && !validateEmail(emailInput)) {
      setIsValidEmail(false);
    }
  };

  const removeInvite = (emailToRemove) => {
    setFormData(prev => ({
      ...prev,
      invites: prev.invites.filter(email => email !== emailToRemove)
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddInvite();
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div
        ref={modalRef}
        className="relative w-full max-w-[840px] max-h-[95vh] flex flex-col bg-white dark:bg-[#0b0f19] rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] text-left transition-all border border-slate-200 dark:border-white/5 animate-fade-in-up overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Create collaborative space</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Set up your room, tools, and team access.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} className="stroke-[2.5]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto flex-1 custom-scrollbar">
          <div className="flex flex-col md:flex-row flex-1">
            {/* Left Column */}
            <div className="w-full md:w-1/2 px-8 py-7 space-y-7 border-b md:border-b-0 md:border-r border-slate-100 dark:border-white/5">
              {/* Room Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Room Name <span className="text-indigo-500 dark:text-indigo-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-transparent rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-base shadow-sm"
                  placeholder="e.g. Frontend Architecture Review"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Short Description <span className="text-slate-400 font-normal ml-1">(Optional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-transparent rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium resize-none shadow-sm block"
                  placeholder="What is the main objective of this room?"
                />
              </div>
            </div> {/* Close Left Column */}

            {/* Right Column */}
            <div className="w-full md:w-1/2 px-8 py-7 space-y-6">
              {/* Primary Activity */}
              <div className="space-y-3">
                <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Primary Tool
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      value: 'document',
                      label: 'Document',
                      icon: <FileText size={20} className="text-blue-500 relative z-10" />,
                      description: 'Rich text docs',
                      bgGraphic: (
                        <div className="absolute inset-0 right-0 overflow-hidden rounded-2xl opacity-40 transition-opacity group-hover:opacity-100">
                          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl transition-all group-hover:scale-150"></div>
                          <div className="absolute top-2 right-2 w-16 h-12 border-t-2 border-r-2 border-blue-500/20 rounded-tr-xl transform translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform"></div>
                          <FileText size={48} className="absolute -bottom-2 -right-2 text-blue-500/10 transform rotate-12 group-hover:-rotate-12 transition-transform duration-500" />
                        </div>
                      )
                    },
                    {
                      value: 'code',
                      label: 'Code Editor',
                      icon: <Code size={20} className="text-emerald-500 relative z-10" />,
                      description: 'Pair programming',
                      bgGraphic: (
                        <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-40 transition-opacity group-hover:opacity-100">
                          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl transition-all group-hover:scale-150"></div>
                          <div className="absolute bottom-2 right-2 flex space-x-1 opacity-20 relative z-0">
                            <div className="w-1.5 h-6 bg-emerald-500 rounded-full transform group-hover:scale-y-150 transition-transform"></div>
                            <div className="w-1.5 h-4 bg-emerald-500 rounded-full transform group-hover:scale-y-150 transition-transform delay-75"></div>
                            <div className="w-1.5 h-8 bg-emerald-500 rounded-full transform group-hover:scale-y-150 transition-transform delay-150"></div>
                          </div>
                          <Code size={48} className="absolute -bottom-2 -right-2 text-emerald-500/10 transform -rotate-12 group-hover:rotate-12 transition-transform duration-500" />
                        </div>
                      )
                    },
                    {
                      value: 'whiteboard',
                      label: 'Whiteboard',
                      icon: <PenTool size={20} className="text-purple-500 relative z-10" />,
                      description: 'Flowcharts & ideas',
                      bgGraphic: (
                        <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-40 transition-opacity group-hover:opacity-100">
                          <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl transition-all group-hover:scale-150"></div>
                          <svg className="absolute top-0 right-0 w-16 h-16 text-purple-500/20 transform translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="10 10" />
                          </svg>
                          <PenTool size={48} className="absolute -bottom-2 -right-2 text-purple-500/10 transform rotate-45 group-hover:rotate-90 transition-transform duration-500" />
                        </div>
                      )
                    },
                    {
                      value: 'video',
                      label: 'Video Call',
                      icon: <Video size={20} className="text-rose-500 relative z-10" />,
                      description: 'Face to face sync',
                      bgGraphic: (
                        <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-40 transition-opacity group-hover:opacity-100">
                          <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-24 h-24 bg-rose-500/10 rounded-full blur-xl transition-all group-hover:scale-150"></div>
                          <div className="absolute top-2 right-2 flex space-x-1.5 opacity-20">
                            <div className="w-2 h-2 rounded-full bg-rose-500 group-hover:animate-ping"></div>
                            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                          </div>
                          <Video size={48} className="absolute -bottom-2 -right-2 text-rose-500/10 transform -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                        </div>
                      )
                    }
                  ].map((type) => (
                    <label
                      key={type.value}
                      className={`group relative p-4 border rounded-2xl cursor-pointer transition-all duration-200 block overflow-hidden ${formData.type === type.value
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                    >
                      {type.bgGraphic}
                      <input
                        type="radio"
                        name="type"
                        value={type.value}
                        checked={formData.type === type.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="flex flex-col space-y-2 relative z-10">
                        <div className={`p-2.5 rounded-xl w-max transition-colors relative ${formData.type === type.value
                          ? 'bg-white shadow-sm dark:bg-slate-800'
                          : 'bg-slate-100 dark:bg-[#1e293b]'
                          }`}>
                          {type.icon}
                        </div>
                        <div className="space-y-0.5 pt-1">
                          <span className={`block text-sm font-bold ${formData.type === type.value ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-300'}`}>
                            {type.label}
                          </span>
                          <span className={`block text-xs font-medium ${formData.type === type.value ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>
                            {type.description}
                          </span>
                        </div>
                      </div>

                      {/* Active Indicator Ring */}
                      {formData.type === type.value && (
                        <div className="absolute top-4 right-4 text-indigo-500 animate-fade-in-up z-20">
                          <Check size={18} strokeWidth={3} />
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div> {/* Close Primary Activity */}
            </div> {/* Close Right Column */}
          </div> {/* Close Flex row */}

          {/* Footer */}
          <div className="px-8 py-5 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between shrink-0 space-y-4 sm:space-y-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Created rooms are instantly available.
            </p>
            <div className="flex w-full sm:w-auto space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-transparent rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-slate-200 dark:focus:ring-white/10 flex-1 sm:flex-none shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.name.trim() || loading}
                className={`px-8 py-3 text-sm font-bold text-white bg-indigo-600 dark:bg-indigo-500 rounded-2xl transition-all flex-1 sm:flex-none ${!formData.name.trim() || loading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-indigo-700 dark:hover:bg-indigo-400 hover:-translate-y-px shadow-lg shadow-indigo-500/30'
                  }`}
              >
                {loading ? 'Creating space...' : 'Create Room'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CreateRoomModal;
