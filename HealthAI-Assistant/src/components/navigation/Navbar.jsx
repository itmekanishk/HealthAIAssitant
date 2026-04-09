import { useState } from 'react';
import { Menu } from 'lucide-react';
import { NavLogo } from './NavLogo';
import { MobileMenu } from './MobileMenu';
import { navigationItems } from '../../config/navigation';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { useNavigationContext } from '../../context/NavigationContext';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, } from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
export function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { activeTab, setActiveTab } = useNavigationContext();
    return (<>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/60 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <NavLogo />

            <nav className="hidden lg:flex lg:items-center lg:space-x-2">
              {navigationItems.map((item) => (<NavigationMenu key={item.id}>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      {item.dropdown ? (<>
                          <NavigationMenuTrigger className={cn("bg-transparent", (activeTab === item.id || item.dropdown?.some(subItem => subItem.id === activeTab))
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300")}>
                            <item.icon className="mr-1.5 h-5 w-5"/>
                            {item.name}
                          </NavigationMenuTrigger>
                          <NavigationMenuContent className="!left-0">
                            <ul className="grid w-[240px] gap-1 p-2 bg-popover border border-border/60 rounded-md shadow-lg">
                              {item.dropdown.map((subItem) => (<li key={subItem.id}>
                                  <NavigationMenuLink asChild>
                                    <button onClick={() => setActiveTab(subItem.id)} className={cn("flex w-full items-center rounded-md p-3 text-sm transition-colors hover:bg-muted", activeTab === subItem.id
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground")}>
                                      <subItem.icon className="mr-2 h-5 w-5"/>
                                      <span className="font-medium">{subItem.name}</span>
                                    </button>
                                  </NavigationMenuLink>
                                </li>))}
                            </ul>
                          </NavigationMenuContent>
                        </>) : (<NavigationMenuLink asChild>
                        <button onClick={() => setActiveTab(item.id)} className={cn(navigationMenuTriggerStyle(), "bg-transparent", activeTab === item.id
                    ? "text-primary bg-primary/10 border border-primary/20"
                    : "text-muted-foreground hover:bg-muted")}>
                            <item.icon className="mr-1.5 h-5 w-5"/>
                            {item.name}
                          </button>
                        </NavigationMenuLink>)}
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>))}
              <AnimatedThemeToggler className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200"/>
            </nav>

            <div className="flex lg:hidden items-center space-x-2">
              <AnimatedThemeToggler className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200"/>
              <button onClick={() => setIsMobileMenuOpen(true)} className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring">
                <span className="sr-only">Open main menu</span>
                <Menu className="block h-6 w-6" aria-hidden="true"/>
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}/>
    </>);
}
