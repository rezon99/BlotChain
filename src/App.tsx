import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { Dashboard3D } from './components/Dashboard3D';
import { DashboardMode } from './types';

function App() {
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [mode, setMode] = useState<DashboardMode>('crypto');

  return viewMode === '2d' ? (
    <Dashboard
      mode={mode}
      onModeSwitch={setMode}
      viewMode={viewMode}
      onViewModeSwitch={setViewMode}
    />
  ) : (
    <Dashboard3D
      mode={mode}
      onModeSwitch={setMode}
      viewMode={viewMode}
      onViewModeSwitch={setViewMode}
    />
  );
}

export default App;
