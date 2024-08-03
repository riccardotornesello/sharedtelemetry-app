import React, { useState } from "react";
import useWebSocket from "react-use-websocket";

function generatePoints(
  vals: number[],
  height: number,
  width: number,
  stroke: number
) {
  const pointHeight = height / 100;
  const pointWidth = width / (vals.length - 1);

  return vals
    .map(
      (v, index) => `${index * pointWidth},${height + stroke - v * pointHeight}`
    )
    .join(" ");
}

export type InputGraphProps = {
  height: number;
  width: number;
  stroke: number;
  valsCount: number;
};

export function InputGraph({
  height,
  width,
  stroke,
  valsCount,
}: InputGraphProps) {
  const drawableHeight = height - 2 * stroke;

  const [vals, setVals] = useState({
    throttle: new Array(valsCount).fill(0),
    brake: new Array(valsCount).fill(100),
    steer: new Array(valsCount).fill(50),
  });

  useWebSocket("ws://localhost:8080/ws", {
    onMessage: (msg) => {
      const data = JSON.parse(msg.data);

      if (data.event == "telemetry") {
        setVals((vals) => ({
          throttle: [...vals.throttle.slice(1), data.data.throttle * 100],
          brake: [...vals.brake.slice(1), data.data.brake * 100],
          steer: [...vals.steer.slice(1), data.data.steer * 100],
        }));
      }
    },
    shouldReconnect: (closeEvent) => {
      return closeEvent.code !== 1000 && closeEvent.code !== 1001;
    },
  });

  return (
    <>
      <svg
        height={height}
        width={width}
        xmlns="http://www.w3.org/2000/svg"
        style={{ backgroundColor: "#00000066" }}
      >
        <polyline
          fill="none"
          stroke="#2ecc40"
          strokeWidth={stroke}
          points={generatePoints(vals.throttle, drawableHeight, width, stroke)}
        />
        <polyline
          fill="none"
          stroke="#ff4136"
          strokeWidth={stroke}
          points={generatePoints(vals.brake, drawableHeight, width, stroke)}
        />
        <polyline
          fill="none"
          stroke="#0074d9"
          strokeWidth={stroke}
          points={generatePoints(vals.steer, drawableHeight, width, stroke)}
        />
      </svg>
    </>
  );
}
