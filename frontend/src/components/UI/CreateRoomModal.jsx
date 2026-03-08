import { useState, useRef, useEffect } from 'react';
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

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-md overflow-y-auto">
      <div className="min-h-screen px-4 text-center flex items-center justify-center py-12">
        <div
          ref={modalRef}
          className="relative w-full max-w-[540px] bg-white dark:bg-[#0f172a] rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] text-left align-middle transition-all border border-slate-200 dark:border-white/5 animate-fade-in-up"
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

          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="px-8 py-7 space-y-7">
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
                      icon: <FileText size={20} className="text-blue-500" />,
                      description: 'Rich text docs'
                    },
                    {
                      value: 'code',
                      label: 'Code Editor',
                      icon: <Code size={20} className="text-emerald-500" />,
                      description: 'Pair programming'
                    },
                    {
                      value: 'whiteboard',
                      label: 'Whiteboard',
                      icon: <PenTool size={20} className="text-purple-500" />,
                      description: 'Flowcharts & ideas'
                    },
                    {
                      value: 'video',
                      label: 'Video Call',
                      icon: <Video size={20} className="text-rose-500" />,
                      description: 'Face to face sync'
                    }
                  ].map((type) => (
                    <label
                      key={type.value}
                      className={`relative p-4 border rounded-2xl cursor-pointer transition-all duration-200 block overflow-hidden ${formData.type === type.value
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={type.value}
                        checked={formData.type === type.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="flex flex-col space-y-2 relative z-10">
                        <div className={`p-2.5 rounded-xl w-max transition-colors ${formData.type === type.value
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
                        <div className="absolute top-4 right-4 text-indigo-500 animate-fade-in-up">
                          <Check size={18} strokeWidth={3} />
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Privacy Control */}
              <div className="pt-7 border-t border-slate-100 dark:border-white/5 space-y-6">
                <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-transparent rounded-2xl group hover:border-slate-300 dark:hover:border-white/10 transition-colors">
                  <div className="flex items-start">
                    <div className="flex flex-col justify-center h-full pt-0.5">
                      <input
                        id="isPrivate"
                        name="isPrivate"
                        type="checkbox"
                        checked={formData.isPrivate}
                        onChange={(e) => {
                          handleChange(e);
                          if (!e.target.checked) setFormData(prev => ({ ...prev, invites: [] }));
                        }}
                        className="h-5 w-5 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-[#0f172a] cursor-pointer"
                      />
                    </div>
                    <label htmlFor="isPrivate" className="ml-3.5 flex flex-col cursor-pointer select-none">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">Strict Privacy Mode</span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-[280px] leading-relaxed">
                        {formData.isPrivate
                          ? 'Only members explicitly invited below can access this room.'
                          : 'Any matched workspace member can discover and join.'}
                      </span>
                    </label>
                  </div>
                  <div className="flex-shrink-0 self-center">
                    <div className={`px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase rounded-lg border ${formData.isPrivate
                      ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                      : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      }`}>
                      {formData.isPrivate ? 'Private' : 'Public'}
                    </div>
                  </div>
                </div>

                {/* Team & Member Invitation */}
                {formData.isPrivate && (
                  <div className="space-y-5 animate-fade-in-up">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Quick Add Entire Project Team
                      </label>
                      <div className="relative group">
                        <select
                          value={selectedTeam}
                          onChange={(e) => {
                            const newTeamId = e.target.value;
                            setSelectedTeam(newTeamId);
                            if (newTeamId) {
                              const team = availableTeams.find(t => t.id === newTeamId);
                              if (team) {
                                const newInvites = [...new Set([...formData.invites, ...team.members])];
                                setFormData(prev => ({ ...prev, invites: newInvites }));
                              }
                            }
                          }}
                          className="w-full pl-5 pr-12 py-3.5 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-transparent rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium appearance-none shadow-sm hover:border-slate-300 dark:hover:bg-slate-800"
                        >
                          <option value="">Select a team config to sync...</option>
                          {availableTeams.map(team => (
                            <option key={team.id} value={team.id}>{team.name} ({team.members.length} members)</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
                          <Users size={18} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Invite Individuals
                        </label>
                        {formData.invites.length > 0 && (
                          <span className="text-xs font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-lg">
                            {formData.invites.length} pending
                          </span>
                        )}
                      </div>

                      <div className="flex space-x-3">
                        <div className="flex-1 relative">
                          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <UserPlus size={18} className="text-slate-400" />
                          </div>
                          <input
                            type="email"
                            value={emailInput}
                            onChange={(e) => {
                              setEmailInput(e.target.value);
                              if (e.target.value && !validateEmail(e.target.value)) {
                                setIsValidEmail(false);
                              } else {
                                setIsValidEmail(true);
                              }
                            }}
                            onKeyDown={handleKeyDown}
                            className={`block w-full pl-12 pr-5 py-3.5 text-sm rounded-2xl border ${!isValidEmail && emailInput
                              ? 'border-red-300 text-red-900 bg-red-50 dark:bg-red-500/10 placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/50'
                              : 'border-slate-200 dark:border-transparent bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50'
                              } transition-all font-medium shadow-sm`}
                            placeholder="teammate@example.com"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddInvite}
                          disabled={!emailInput || !isValidEmail}
                          className={`inline-flex items-center px-7 py-3.5 text-sm font-bold rounded-2xl transition-all shadow-sm ${!emailInput || !isValidEmail
                            ? 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-600 cursor-not-allowed border border-transparent'
                            : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'
                            }`}
                        >
                          Add
                        </button>
                      </div>

                      {formData.invites.length > 0 && (
                        <div className="pt-2">
                          <div className="flex flex-wrap gap-2">
                            {formData.invites.map((email) => (
                              <div
                                key={email}
                                className="inline-flex flex-row items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 shadow-sm animate-fade-in-up"
                              >
                                <span className="truncate max-w-[180px]">{email}</span>
                                <button
                                  type="button"
                                  onClick={() => removeInvite(email)}
                                  className="ml-2.5 flex-shrink-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full p-0.5 transition-colors"
                                  aria-label={`Remove ${email}`}
                                >
                                  <XCircle size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between rounded-b-3xl space-y-4 sm:space-y-0">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Created rooms are instantly available.
              </p>
              <div className="flex w-full sm:w-auto space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-transparent rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-slate-200 dark:focus:ring-white/10 flex-1 sm:flex-none shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formData.name.trim() || loading}
                  className={`px-8 py-3.5 text-sm font-bold text-white bg-indigo-600 dark:bg-indigo-500 rounded-2xl transition-all flex-1 sm:flex-none ${!formData.name.trim() || loading
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
    </div>
  );
};

export default CreateRoomModal;
