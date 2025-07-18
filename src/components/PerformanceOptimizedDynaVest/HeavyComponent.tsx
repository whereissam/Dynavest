import React from 'react';

const HeavyComponent = () => {
  return (
    <div data-testid="lazy-loaded-component">
      <h3>Heavy Component Loaded</h3>
      <p>This component was lazy loaded to improve initial bundle size.</p>
    </div>
  );
};

export default HeavyComponent;