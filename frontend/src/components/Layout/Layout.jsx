import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import StatusIndicator from '../UI/StatusIndicator'

const Layout = () => {
  return (
    <div className="h-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-[#0b0f19] transition-colors duration-300">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-8 scrollbar-modern overflow-y-auto relative h-full">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
      <StatusIndicator />
    </div>
  )
}

export default Layout
