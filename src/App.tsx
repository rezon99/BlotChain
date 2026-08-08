import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { Dashboard3D } from './components/Dashboard3D';
import { DashboardVR } from './components/DashboardVR';

function App() {
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'vr'>('2d');

  if (viewMode === 'vr') {
    return (
      <DashboardVR
        onViewModeSwitch={setViewMode}
      />
    );
  }

  return viewMode === '2d' ? (
    <Dashboard
      viewMode={viewMode}
      onViewModeSwitch={setViewMode}
    />
  ) : (
    <Dashboard3D
      viewMode={viewMode}
      onViewModeSwitch={setViewMode}
    />
  );
}

export default App;
