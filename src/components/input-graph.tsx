import React, { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";

enum input {
  throttle = "throttle",
  brake = "brake",
  steer = "steer",
  clutch = "clutch",
}

type InputLine = {
  color: string;
  dataKey: string;
  centering: number;
  scaling: number;
  enabled: boolean;
};

const lines: Record<keyof typeof input, InputLine> = {
  throttle: {
    color: "#2ecc40",
    dataKey: "throttle",
    centering: 1,
    scaling: 1,
    enabled: true,
  },
  brake: {
    color: "#ff4136",
    dataKey: "brake",
    centering: 1,
    scaling: 1,
    enabled: true,
  },
  steer: {
    color: "#0074d9",
    dataKey: "steer",
    centering: 2,
    scaling: 2,
    enabled: true,
  },
  clutch: {
    color: "#ff851b",
    dataKey: "clutch",
    centering: 1,
    scaling: 1,
    enabled: false,
  },
};

export type InputGraphProps = {
  height: number;
  width: number;
  stroke: number;
  speed: "slow" | "medium" | "fast";
};

function generatePoints(
  vals: any[],
  key: string,
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
          (height + stroke - (v[key] || 0) * pointHeight * scaling) / centering
        }`
    )
    .join(" ");
}

export function InputGraph({
  height,
  width,
  stroke,
  speed,
}: Readonly<InputGraphProps>) {
  const drawableHeight = height - 2 * stroke;
  const valsCount =
    speed === "slow" ? 2 * width : speed === "medium" ? width : width / 2;

  const [vals, setVals] = useState([]);

  const { readyState, sendJsonMessage } = useWebSocket(
    "ws://localhost:8080/ws",
    {
      onMessage: (msg) => {
        const data = JSON.parse(msg.data);

        if (data.event == "inputTelemetry") {
          setVals((vals) => {
            return [...vals, data.data].slice(-valsCount);
          });
        }
      },
      shouldReconnect: (closeEvent) => {
        return closeEvent.code !== 1000 && closeEvent.code !== 1001;
      },
    }
  );

  useEffect(() => {
    if (readyState === 1) {
      sendJsonMessage({ subscribe: "inputTelemetry" });
    }
  }, [readyState]);

  return (
    <svg
      height={height}
      width={width}
      xmlns="http://www.w3.org/2000/svg"
      style={{ backgroundColor: "#00000066" }}
    >
      {Object.entries(lines)
        .filter(([, { enabled }]) => enabled)
        .map(([key, { color, scaling, centering }]) => (
          <polyline
            key={key}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            points={generatePoints(
              vals,
              key,
              drawableHeight,
              width,
              stroke,
              scaling,
              centering
            )}
          />
        ))}
    </svg>
  );
}
