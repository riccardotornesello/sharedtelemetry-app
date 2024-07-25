import * as React from "react";
import { createRoot } from "react-dom/client";

const root = createRoot(document.body);

root.render(<App />);

export function App() {
  const height = 100;
  const width = 300;
  const stroke = 3;
  const [vals, setVals] = React.useState(
    Array.from({ length: 100 }).map(() => Math.floor(Math.random() * 100))
  );

  const pointHeight = height / 100;
  const pointWidth = width / (vals.length - 1);

  const points = vals.map(
    (v, index) => `${index * pointWidth},${height + stroke - v * pointHeight}`
  );

  const update = () => {
    const newVal = Math.max(
      Math.min(
        vals[vals.length - 1] + Math.floor(Math.random() * 40) - 20,
        100
      ),
      0
    );
    setVals((vals) => [...vals.slice(1), newVal]);
  };

  // Every second, create a new val which has to be between 0 and 100 but max between 20 less and 20 more than the last value and add it to the array, removing the first element
  React.useEffect(() => {
    const interval = setInterval(() => {
      update();
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <svg
        height={height + 2 * stroke}
        width={width}
        xmlns="http://www.w3.org/2000/svg"
      >
        <polyline
          fill="none"
          stroke="#0074d9"
          strokeWidth={stroke}
          points={points.join(" ")}
        />
      </svg>
    </>
  );
}
