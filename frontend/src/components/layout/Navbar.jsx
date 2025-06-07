import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Menu, X, Home, BarChart2, Target, Bell, User, LogOut, DollarSign 
} from 'lucide-react';
import { Button } from '../ui/button';
import { ThemeToggle } from '../ui/theme-toggle';
import { logout } from '../../redux/slices/authSlice';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const { todayAlerts } = useSelector((state) => state.alerts);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleLogout = () => {
    dispatch(logout())
      .unwrap()
      .then(() => {
        navigate('/login');
      });
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <Home className="h-5 w-5 mr-2" /> },
    { name: 'Transacciones', path: '/transactions', icon: <DollarSign className="h-5 w-5 mr-2" /> },
    { name: 'Metas', path: '/goals', icon: <Target className="h-5 w-5 mr-2" /> },
    { name: 'Alertas', path: '/alerts', icon: <Bell className="h-5 w-5 mr-2" /> },
    { name: 'Perfil', path: '/profile', icon: <User className="h-5 w-5 mr-2" /> },
  ];

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-primary font-bold text-xl">
                FinanzApp
              </Link>
            </div>
            
            {/* Desktop menu */}
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground"
                >
                  {item.icon}
                  {item.name}
                  {item.name === 'Alertas' && todayAlerts?.hasAlerts && (
                    <span className="ml-1 bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                      {todayAlerts.count}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center">
            <ThemeToggle />
            
            {user && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout} 
                className="ml-2"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            )}
            
            {/* Mobile menu button */}
            <div className="md:hidden ml-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMenu}
                aria-expanded={isOpen}
                aria-label="Menú principal"
              >
                {isOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center px-3 py-2 rounded-md text-base font-medium hover:bg-accent hover:text-accent-foreground"
                onClick={closeMenu}
              >
                {item.icon}
                {item.name}
                {item.name === 'Alertas' && todayAlerts?.hasAlerts && (
                  <span className="ml-1 bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                    {todayAlerts.count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
