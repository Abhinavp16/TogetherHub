import { useState } from 'react';
import { Plus, Search, MoreVertical, Mail, Shield, ShieldCheck, User as UserIcon, LayoutGrid, ArrowRight } from 'lucide-react';

const Team = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');

    // Mock data for all members
    const allMembers = [
        {
            id: 1,
            name: 'Abhinav Kumar',
            email: 'abhinav@togetherhub.test',
            role: 'Owner',
            status: 'online',
            avatar: 'https://ui-avatars.com/api/?name=Abhinav+Kumar&background=0D8ABC&color=fff',
            lastActive: 'Just now',
        },
        {
            id: 2,
            name: 'Sarah Jenkins',
            email: 'sarah.j@togetherhub.test',
            role: 'Admin',
            status: 'offline',
            avatar: 'https://ui-avatars.com/api/?name=Sarah+Jenkins&background=4CAF50&color=fff',
            lastActive: '2h ago',
        },
        {
            id: 3,
            name: 'Marcus Chen',
            email: 'marcus@togetherhub.test',
            role: 'Editor',
            status: 'online',
            avatar: 'https://ui-avatars.com/api/?name=Marcus+Chen&background=F44336&color=fff',
            lastActive: '10m ago',
        },
        {
            id: 4,
            name: 'Elena Rodriguez',
            email: 'elena.r@togetherhub.test',
            role: 'Viewer',
            status: 'offline',
            avatar: 'https://ui-avatars.com/api/?name=Elena+Rodriguez&background=9C27B0&color=fff',
            lastActive: '1d ago',
        },
        {
            id: 5,
            name: 'David Smith',
            email: 'david.s@togetherhub.test',
            role: 'Editor',
            status: 'online',
            avatar: 'https://ui-avatars.com/api/?name=David+Smith&background=FF9800&color=fff',
            lastActive: '5m ago',
        }
    ];

    const [teams, setTeams] = useState([
        { id: 't1', name: 'General Workspace', description: 'Company wide team', members: allMembers },
        { id: 't2', name: 'Frontend Reboot', description: 'Working on UI v2', members: [allMembers[0], allMembers[2], allMembers[3]] },
        { id: 't3', name: 'Marketing Assets', description: 'Campaign materials', members: [allMembers[1], allMembers[4]] }
    ]);
    const [activeTeamId, setActiveTeamId] = useState(teams[0].id);

    const activeTeam = teams.find(t => t.id === activeTeamId) || teams[0];

    const filteredMembers = activeTeam.members.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateTeam = () => {
        if (newTeamName.trim() === '') return;
        const newTeam = {
            id: 't' + Date.now(),
            name: newTeamName,
            description: 'Newly created team',
            members: [allMembers[0]] // Add Owner by default
        };
        setTeams([...teams, newTeam]);
        setActiveTeamId(newTeam.id);
        setNewTeamName('');
        setIsCreateTeamModalOpen(false);
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'Owner':
                return <ShieldCheck size={16} className="text-yellow-500" />;
            case 'Admin':
                return <Shield size={16} className="text-blue-500" />;
            default:
                return <UserIcon size={16} className="text-slate-500 dark:text-slate-400" />;
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-fade-in-up">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">My Teams</h1>
                    <p className="text-slate-600 dark:text-slate-400 text-lg">Manage your project teams, members, and permissions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsCreateTeamModalOpen(true)}
                        className="bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 hover:border-indigo-500 dark:hover:border-[#0ea5e9] text-slate-800 dark:text-white px-5 py-3 rounded-xl font-bold transition-all shadow-sm hover:shadow-md flex items-center"
                    >
                        <Plus size={20} className="mr-2 text-indigo-500 dark:text-[#0ea5e9]" />
                        New Team
                    </button>
                    <button
                        onClick={() => setIsAddMemberModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 dark:bg-[#0ea5e9] dark:hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center shadow-indigo-500/30 dark:shadow-blue-500/20"
                    >
                        <Plus size={20} className="mr-2" />
                        Add Member
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Teams Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center justify-between px-1 mb-4">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <LayoutGrid className="text-indigo-500 dark:text-[#0ea5e9]" size={18} />
                            Project Teams
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {teams.map(team => (
                            <button
                                key={team.id}
                                onClick={() => setActiveTeamId(team.id)}
                                className={`w-full text-left p-4 rounded-2xl transition-all duration-300 border ${activeTeamId === team.id
                                        ? 'bg-indigo-600 dark:bg-[#1e2434] border-indigo-600 dark:border-white/10 shadow-lg shadow-indigo-500/20 dark:shadow-none translate-x-2'
                                        : 'bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-white/20 hover:scale-[1.02]'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className={`font-bold ${activeTeamId === team.id ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>{team.name}</h3>
                                    {activeTeamId === team.id && <ArrowRight size={16} className="text-white dark:text-[#0ea5e9]" />}
                                </div>
                                <p className={`text-sm ${activeTeamId === team.id ? 'text-indigo-100 dark:text-slate-400' : 'text-slate-500 dark:text-slate-500'}`}>
                                    {team.members.length} members
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3 bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/5 rounded-[2rem] shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05)] dark:shadow-2xl overflow-hidden transition-colors duration-300 flex flex-col">

                    {/* Toolbar */}
                    <div className="p-6 border-b border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-transparent">
                        <div className="relative w-full sm:w-80">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search size={18} className="text-slate-400 dark:text-slate-500" />
                            </div>
                            <input
                                type="text"
                                placeholder={`Search in ${activeTeam.name}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-blue-500/50 focus:border-transparent transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex items-center space-x-2 w-full sm:w-auto">
                            <div className="flex -space-x-2 mr-4">
                                {activeTeam.members.slice(0, 3).map(m => (
                                    <img key={m.id} src={m.avatar} className="w-8 h-8 rounded-full border-2 border-white dark:border-[#1e2330]" alt={m.name} />
                                ))}
                                {activeTeam.members.length > 3 && (
                                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-[#1e2330] bg-slate-100 dark:bg-[#0b0f19] text-slate-600 dark:text-slate-400 flex items-center justify-center text-xs font-bold">
                                        +{activeTeam.members.length - 3}
                                    </div>
                                )}
                            </div>
                            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-lg border border-slate-200 dark:border-white/5">
                                {activeTeam.members.length} Members
                            </span>
                        </div>
                    </div>

                    {/* Team List / Grid */}
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-[#1a1f2c] border-b border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider font-semibold">
                                    <th className="py-4 px-6 font-semibold">Member</th>
                                    <th className="py-4 px-6 font-semibold">Contact</th>
                                    <th className="py-4 px-6 font-semibold">Role</th>
                                    <th className="py-4 px-6 font-semibold">Status</th>
                                    <th className="py-4 px-6 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                                {filteredMembers.map((member) => (
                                    <tr key={member.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="relative">
                                                    <img
                                                        src={member.avatar}
                                                        alt={member.name}
                                                        className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-[#1e2330] shadow-sm"
                                                    />
                                                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-[#1e2330] ${member.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`}></div>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white text-[15px]">{member.name}</p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">Last active: {member.lastActive}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center text-slate-600 dark:text-slate-300 text-sm">
                                                <Mail size={16} className="mr-2 text-slate-400 dark:text-slate-500" />
                                                {member.email}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/5">
                                                    {getRoleIcon(member.role)}
                                                </div>
                                                <span className={`font-semibold text-sm ${member.role === 'Owner' ? 'text-yellow-600 dark:text-yellow-400' :
                                                    member.role === 'Admin' ? 'text-blue-600 dark:text-blue-400' :
                                                        'text-slate-700 dark:text-slate-300'
                                                    }`}>
                                                    {member.role}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${member.status === 'online'
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                                }`}>
                                                {member.status === 'online' ? 'Online' : 'Offline'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-blue-400 hover:bg-indigo-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors focus:outline-none">
                                                <MoreVertical size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {filteredMembers.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="py-12 text-center">
                                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 mb-4">
                                                <Search size={24} className="text-slate-400 dark:text-slate-500" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No members found</h3>
                                            <p className="text-slate-500 dark:text-slate-400">Try adjusting your search query.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create Team Modal */}
            {isCreateTeamModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in-up">
                    <div className="bg-white dark:bg-[#1a1f2c] w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden transform transition-all">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 cursor-default">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><LayoutGrid className="text-indigo-500 dark:text-[#0ea5e9]" size={20} /> Create New Team</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Team Name</label>
                                <input
                                    type="text"
                                    value={newTeamName}
                                    onChange={(e) => setNewTeamName(e.target.value)}
                                    placeholder="e.g. Marketing Campaign"
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-blue-500/50"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#181e29] flex justify-end space-x-3">
                            <button
                                onClick={() => setIsCreateTeamModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateTeam}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-[#0ea5e9] dark:hover:bg-blue-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/30 dark:shadow-blue-500/20"
                            >
                                Create Team
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Simple Modal Overlay */}
            {isAddMemberModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in-up">
                    <div className="bg-white dark:bg-[#1a1f2c] w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden transform transition-all">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add Member to {activeTeam.name}</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                                <input type="email" placeholder="colleague@company.com" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-blue-500/50" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                                <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-blue-500/50">
                                    <option>Viewer</option>
                                    <option>Editor</option>
                                    <option>Admin</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#181e29] flex justify-end space-x-3">
                            <button
                                onClick={() => setIsAddMemberModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setIsAddMemberModalOpen(false)}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-[#0ea5e9] dark:hover:bg-blue-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/30 dark:shadow-blue-500/20"
                            >
                                Send Invite
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Team;
