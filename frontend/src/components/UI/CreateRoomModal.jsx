import { useState, useRef, useEffect } from 'react';
import { X, FileText, Code, PenTool, UserPlus, XCircle, Check, Users } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Room</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Start collaborating with your team</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-1">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Room Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
              placeholder="e.g. Project Brainstorming"
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
              placeholder="What's this room about?"
            />
          </div>

          <div className="space-y-2">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Room Type
            </span>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  value: 'document',
                  label: 'Document',
                  icon: <FileText size={18} className="text-blue-500" />,
                  description: 'Collaborate on rich text documents'
                },
                {
                  value: 'code',
                  label: 'Code',
                  icon: <Code size={18} className="text-green-500" />,
                  description: 'Write and review code together'
                },
                {
                  value: 'whiteboard',
                  label: 'Whiteboard',
                  icon: <PenTool size={18} className="text-purple-500" />,
                  description: 'Draw and brainstorm ideas'
                }
              ].map((type) => (
                <label
                  key={type.value}
                  className={`relative p-4 border rounded-lg cursor-pointer transition-all ${formData.type === type.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
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
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className={`p-2 rounded-lg ${formData.type === type.value
                      ? 'bg-blue-100 dark:bg-blue-900/40'
                      : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                      {type.icon}
                    </div>
                    <span className="text-sm font-medium">{type.label}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{type.description}</span>
                  </div>
                  {formData.type === type.value && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center">
                <div className="flex items-center h-5">
                  <input
                    id="isPrivate"
                    name="isPrivate"
                    type="checkbox"
                    checked={formData.isPrivate}
                    onChange={(e) => {
                      handleChange(e);
                      if (!e.target.checked) {
                        setFormData(prev => ({ ...prev, invites: [] }));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <label htmlFor="isPrivate" className="ml-3 flex flex-col">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Make this room private</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formData.isPrivate
                      ? 'Only invited members can join'
                      : 'Anyone with the link can join'}
                  </span>
                </label>
              </div>
              <div className={`px-2 py-1 text-xs rounded-full ${formData.isPrivate
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                }`}>
                {formData.isPrivate ? 'Private' : 'Public'}
              </div>
            </div>

            {formData.isPrivate && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Invite People
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formData.invites.length} {formData.invites.length === 1 ? 'person' : 'people'} invited
                  </span>
                </div>

                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserPlus size={16} className="text-gray-400" />
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
                      className={`block w-full pl-10 pr-3 py-2 text-sm rounded-lg border ${!isValidEmail && emailInput
                        ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white'
                        }`}
                      placeholder="Enter email addresses"
                    />
                    {!isValidEmail && emailInput && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        Please enter a valid email address
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddInvite}
                    disabled={!emailInput || !isValidEmail}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white ${!emailInput || !isValidEmail
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                      }`}
                  >
                    Add
                  </button>
                </div>

                {formData.invites.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Invited People
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.invites.map((email) => (
                        <div
                          key={email}
                          className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                        >
                          <span className="mr-1.5">👤</span>
                          {email}
                          <button
                            type="button"
                            onClick={() => removeInvite(email)}
                            className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 dark:hover:bg-blue-800/50"
                            aria-label={`Remove ${email}`}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-white dark:bg-gray-800 pt-4 pb-2 -mx-6 px-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.name.trim() || loading}
                className={`px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${!formData.name.trim() || loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>
            </div>
            {formData.invites.length > 0 && (
              <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
                Invitations will be sent via email when you create the room
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal;
