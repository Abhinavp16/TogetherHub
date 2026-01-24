import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import StatusIndicator from '../UI/StatusIndicator'

const Layout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-gray-900 dark:to-black">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8 scrollbar-modern overflow-y-auto">
          <div className="animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
      <StatusIndicator />
    </div>
  )
}

export default Layout