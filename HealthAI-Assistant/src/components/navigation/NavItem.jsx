import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useNavigationContext } from '../../context/NavigationContext';
export function NavItem({ id, name, icon: Icon, dropdown, isMobile = false }) {
    const { activeTab, setActiveTab } = useNavigationContext();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const handleClick = () => {
        if (dropdown) {
            setIsOpen(prev => !prev); // Toggle dropdown on click for mobile
        }
        else {
            setActiveTab(id);
            setIsOpen(false); // Close dropdown if it's not a dropdown item
        }
    };
    const handleOutsideClick = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsOpen(false); // Close dropdown if clicked outside
        }
    };
    useEffect(() => {
        if (isOpen) {
            document.addEventListener('mousedown', handleOutsideClick);
        }
        else {
            document.removeEventListener('mousedown', handleOutsideClick);
        }
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isOpen]);
    useEffect(() => {
        if (!isMobile) {
            const handleMouseEnter = () => setIsOpen(true);
            const handleMouseLeave = () => setIsOpen(false);
            const dropdownElement = dropdownRef.current;
            if (dropdownElement) {
                dropdownElement.addEventListener('mouseenter', handleMouseEnter);
                dropdownElement.addEventListener('mouseleave', handleMouseLeave);
            }
            return () => {
                if (dropdownElement) {
                    dropdownElement.removeEventListener('mouseenter', handleMouseEnter);
                    dropdownElement.removeEventListener('mouseleave', handleMouseLeave);
                }
            };
        }
    }, [dropdownRef, isMobile]);
    return (<div className="relative" ref={dropdownRef}>
      <button onClick={handleClick} className={`${activeTab === id || (dropdown?.some(item => item.id === activeTab))
            ? 'text-primary bg-primary/10 border border-primary/20'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'} flex items-center justify-between px-4 py-2 text-sm font-medium rounded-md transition-all duration-200`}>
        <div className="flex items-center">
          <Icon className={`mr-1.5 h-5 w-5 ${activeTab === id ? 'text-primary' : 'text-muted-foreground'}`}/>
          {name}
        </div>
        {dropdown && (<ChevronDown className={`ml-1 w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}/>)}
      </button>

      {dropdown && isOpen && (<div className="absolute z-50 left-0 mt-1 w-56 rounded-md shadow-lg bg-popover border border-border/60">
          <div className="py-1" role="menu">
            {dropdown.map((item) => (<button key={item.id} onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false); // Close dropdown after selection
                }} className={`${activeTab === item.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'} group flex items-center w-full px-4 py-2 text-sm transition-colors duration-150`}>
                <item.icon className={`mr-3 h-5 w-5 ${activeTab === item.id ? 'text-primary' : 'text-muted-foreground'}`}/>
                {item.name}
              </button>))}
          </div>
        </div>)}
    </div>);
}
