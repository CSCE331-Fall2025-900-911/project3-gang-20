import React from 'react';

const App = () => {
  return (
    <div className="text-center bg-white p-8 md:p-12 rounded-xl shadow-2xl max-w-md w-full border-t-4 border-indigo-500 transform hover:scale-[1.02] transition duration-300">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-indigo-500 mb-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Build Success Target</h1>
      <p className="text-xl text-indigo-600 font-medium mb-6">Frontend Component Loaded</p>
      <p className="text-gray-600">
        This content confirms the React component tree is correctly imported and rendered. Next step is deploying the generated **dist/index.html** on Vercel.
      </p>
    </div>
  );
};

export default App;