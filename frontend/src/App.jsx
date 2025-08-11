import React, { useState } from 'react';
import UploadPage from './pages/UploadPage';
import DashboardPage from './pages/DashboardPage';

export default function App(){
  const [result, setResult] = useState(null);

  return (
    <>
      {!result ? (
        <UploadPage onResult={setResult} />
      ) : (
        <DashboardPage result={result} />
      )}
    </>
  );
}
