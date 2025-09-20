import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Package,
  Calendar,
  AlertTriangle,
  FileText,
  Mail,
  CreditCard,
  LogOut,
  Bell,
  BarChart3,
  Settings,
  Shield,
  Wallet,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { Separator } from '@/components/ui/separator'

interface AdminSidebarProps {
  onItemClick?: () => void
}

const AdminSidebar = ({ onItemClick }: AdminSidebarProps) => {
  const { logout, hasPermission } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  // Core Management Section
  const coreMenuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/admin',
      end: true,
      permission: null,
    },
    {
      title: 'Analytiques',
      icon: BarChart3,
      href: '/admin/analytics',
      permission: 'view_analytics',
    },
  ]

  // User & Content Management
  const userContentItems = [
    {
      title: 'Utilisateurs',
      icon: Users,
      href: '/admin/users',
      permission: 'manage_users',
    },
    {
      title: 'Annonces',
      icon: Package,
      href: '/admin/listings',
      permission: 'manage_tools',
    },
    {
      title: 'Blog & Actualités',
      icon: FileText,
      href: '/admin/blog',
      permission: 'manage_content',
    },
    {
      title: 'Reviews',
      icon: Star,
      href: '/admin/reviews',
      permission: 'manage_reviews',
    },
  ]

  // Operations Management
  const operationsItems = [
    {
      title: 'Réservations',
      icon: Calendar,
      href: '/admin/bookings',
      permission: 'manage_bookings',
    },
    {
      title: 'Litiges',
      icon: AlertTriangle,
      href: '/admin/disputes',
      permission: 'manage_disputes',
    },
    {
      title: 'Transactions',
      icon: Wallet,
      href: '/admin/transactions',
      permission: 'manage_transactions',
    },
    {
      title: 'Retraits',
      icon: CreditCard,
      href: '/admin/withdrawals',
      permission: 'manage_transactions',
    },
  ]

  // Communication & Support
  const communicationItems = [
    // {
    //   title: "Notifications",
    //   icon: Bell,
    //   href: "/admin/notifications",
    //   permission: "manage_notifications"
    // },
    {
      title: 'Support & Contacts',
      icon: Mail,
      href: '/admin/contacts',
      permission: 'manage_support',
    },
  ]

  // System Management
  const systemItems = [
    {
      title: 'Paramètres',
      icon: Settings,
      href: '/admin/settings',
      permission: 'manage_settings',
    },
    {
      title: 'Sécurité',
      icon: Shield,
      href: '/admin/security',
      permission: 'manage_security',
    },
  ]

  const renderMenuSection = (items: any[], title: string) => {
    const visibleItems = items.filter(
      (item) => !item.permission || hasPermission(item.permission)
    )

    if (visibleItems.length === 0) return null

    return (
      <div className='space-y-2'>
        <h3 className='px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
          {title}
        </h3>
        {visibleItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.end}
            onClick={onItemClick}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover-scale',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-gray-700 hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <item.icon className='h-4 w-4' />
            {item.title}
          </NavLink>
        ))}
      </div>
    )
  }

  return (
    <div className='flex flex-col h-full'>
      {/* Logo */}
      <div className='p-6 border-b border-admin-border'>
        <h2 className='text-2xl font-bold text-primary animate-fade-in'>
          Administration Bricola LTD
        </h2>
      </div>

      {/* Navigation */}
      <nav
        className='flex-1 p-4 space-y-6 animate-fade-in overflow-y-auto'
        style={{ animationDelay: '0.1s' }}
      >
        {/* Core Management */}
        {renderMenuSection(coreMenuItems, "Vue d'ensemble")}

        <Separator className='my-4' />

        {/* User & Content Management */}
        {renderMenuSection(userContentItems, 'Gestion des contenus')}

        <Separator className='my-4' />

        {/* Operations Management */}
        {renderMenuSection(operationsItems, 'Gestion des opérations')}

        <Separator className='my-4' />

        {/* Communication & Support */}
        {renderMenuSection(communicationItems, 'Communication')}

        <Separator className='my-4' />

        {/* System Management */}
        {renderMenuSection(systemItems, 'Système')}
      </nav>

      {/* Logout button */}
      <div className='p-4 border-t border-admin-border'>
        <Button
          variant='outline'
          className='w-full hover-scale'
          size='sm'
          onClick={handleLogout}
        >
          <LogOut className='h-4 w-4 mr-2' />
          Déconnexion
        </Button>
      </div>
    </div>
  )
}

export { AdminSidebar }
