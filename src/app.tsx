import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import useWebSocket from "react-use-websocket";

const root = createRoot(document.body);

root.render(<App />);

export function App() {
  const height = 100;
  const width = 300;
  const stroke = 3;
  const valsCount = 200;

  const [vals, setVals] = useState(
    new Array(valsCount).fill({ throttle: 0, brake: 0, steer: 0 })
  );

  useWebSocket("ws://localhost:8080/ws", {
    onMessage: (msg) => {
      const data = JSON.parse(msg.data);

      if (data.event == "telemetry") {
        setVals((vals) => [
          ...vals.slice(1),
          {
            throttle: data.data.throttle * 100,
            brake: data.data.brake * 100,
            steer: data.data.steer * 100,
          },
        ]);
      }
    },
    shouldReconnect: (closeEvent) => {
      return closeEvent.code !== 1000 && closeEvent.code !== 1001;
    },
  });

  const pointHeight = height / 100;
  const pointWidth = width / (vals.length - 1);

  const throttlePoints = vals.map(
    (v, index) =>
      `${index * pointWidth},${height + stroke - v.throttle * pointHeight}`
  );
  const brakePoints = vals.map(
    (v, index) =>
      `${index * pointWidth},${height + stroke - v.brake * pointHeight}`
  );
  const steerPoints = vals.map(
    (v, index) =>
      `${index * pointWidth},${(height + stroke - v.steer * pointHeight) / 2}`
  );

  return (
    <>
      <svg
        height={height + 2 * stroke}
        width={width}
        xmlns="http://www.w3.org/2000/svg"
      >
        <polyline
          fill="none"
          stroke="#2ecc40"
          strokeWidth={stroke}
          points={throttlePoints.join(" ")}
        />
        <polyline
          fill="none"
          stroke="#ff4136"
          strokeWidth={stroke}
          points={brakePoints.join(" ")}
        />
        <polyline
          fill="none"
          stroke="#0074d9"
          strokeWidth={stroke}
          points={steerPoints.join(" ")}
        />
      </svg>
    </>
  );
}
