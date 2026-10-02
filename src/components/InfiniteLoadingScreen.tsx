import React, { useState, useEffect } from 'react';

export const InfiniteLoadingScreen: React.FC = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const cycle = ['', '.', '..', '...'];
    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % cycle.length;
      setDots(cycle[index]);
    }, 450);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#121316] flex items-center justify-center select-none">
      <span className="text-xl sm:text-2xl font-medium tracking-tight text-neutral-200">
        Loading{dots}
      </span>
    </div>
  );
};
