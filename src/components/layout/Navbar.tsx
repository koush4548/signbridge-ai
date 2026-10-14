import React from 'react';

export type ActiveTab =
  | 'dashboard'
  | 'translator'
  | 'transcriber'
  | 'practice'
  | 'guide'
  | 'analytics'
  | 'history'
  | 'settings';

export interface NavbarProps {
  activeTab?: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  return null;
};

export default Navbar;
