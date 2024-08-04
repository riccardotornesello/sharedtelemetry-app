import React, { useState } from "react";
import useWebSocket from "react-use-websocket";

function generatePoints(
  vals: number[],
  height: number,
  width: number,
  stroke: number,
  scaling = 1,
  centering = 1
) {
  const pointHeight = height / 100;
  const pointWidth = width / (vals.length - 1);

  return vals
    .map(
      (v, index) =>
        `${index * pointWidth},${
          (height + stroke - v * pointHeight * scaling) / centering
        }`
    )
    .join(" ");
}

enum input {
  throttle = "throttle",
  brake = "brake",
  steer = "steer",
}

type InputLine = {
  color: string;
  dataKey: string;
  centering: number;
  scaling: number;
};

const lines: Record<keyof typeof input, InputLine> = {
  throttle: {
    color: "#2ecc40",
    dataKey: "throttle",
    centering: 1,
    scaling: 1,
  },
  brake: {
    color: "#ff4136",
    dataKey: "brake",
    centering: 1,
    scaling: 1,
  },
  steer: {
    color: "#0074d9",
    dataKey: "steer",
    centering: 2,
    scaling: 2,
  },
};

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

  const [vals, setVals] = useState(
    Object.fromEntries(
      Object.keys(lines).map((key) => [key, new Array(valsCount).fill(0)])
    )
  );

  useWebSocket("ws://localhost:8080/ws", {
    onMessage: (msg) => {
      const data = JSON.parse(msg.data);

      if (data.event == "telemetry") {
        setVals((vals) =>
          Object.fromEntries(
            Object.entries(lines).map(([key, { dataKey }]) => [
              key,
              [...vals[key].slice(1), data.data[dataKey] * 100],
            ])
          )
        );
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
        {Object.entries(lines).map(([key, { color, scaling, centering }]) => (
          <polyline
            key={key}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            points={generatePoints(
              vals[key],
              drawableHeight,
              width,
              stroke,
              scaling,
              centering
            )}
          />
        ))}
      </svg>
    </>
  );
}
