import React, { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";

enum input {
  throttle = "throttle",
  brake = "brake",
  steering = "steering",
  clutch = "clutch",
}

type InputLine = {
  color: string;
  dataKey: string;
  maxKey?: string;
  scaling: number;
  enabled: boolean;
  negative?: boolean;
};

const lines: Record<keyof typeof input, InputLine> = {
  throttle: {
    color: "#2ecc40",
    dataKey: "throttle",
    scaling: 100,
    enabled: true,
  },
  brake: {
    color: "#ff4136",
    dataKey: "brake",
    scaling: 100,
    enabled: true,
  },
  steering: {
    color: "#0074d9",
    dataKey: "steering",
    maxKey: "steeringMax",
    scaling: 100,
    enabled: true,
    negative: true,
  },
  clutch: {
    color: "#ff851b",
    dataKey: "clutch",
    scaling: 100,
    enabled: false,
  },
};

export type InputGraphProps = {
  height: number;
  width: number;
  stroke: number;
  speed: "slow" | "medium" | "fast";
};

export type GeneratePointsProps = {
  vals: any[];
  key: string;
  height: number;
  width: number;
  stroke: number;
  maxKey?: string;
  scaling?: number;
  negative?: boolean;
};

function generatePoints({
  vals,
  key,
  height,
  width,
  stroke,
  maxKey,
  scaling = 1,
  negative = false,
}: GeneratePointsProps) {
  const pointHeight = height / 100;
  const pointWidth = width / (vals.length - 1);
  const centering = negative ? 2 : 1;

  if (vals.length < 2) {
    return "0,0";
  }

  return vals
    .map((v, index) => {
      let max = maxKey ? v[maxKey] || 1 : 1;
      if (max === 0) {
        max = 1;
      }

      let value = v[key] || 0;
      value = value / max;

      return `${index * pointWidth},${
        (height + stroke - value * pointHeight * scaling) / centering
      }`;
    })
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

  const [vals, setVals] = useState(
    Array.from({ length: valsCount }, () => ({}))
  );

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
      sendJsonMessage({ subscribe: ["inputTelemetry"] });
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
        .map(([key, { color, scaling, negative, dataKey, maxKey }]) => (
          <polyline
            key={key}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            points={generatePoints({
              vals,
              key: dataKey,
              height: drawableHeight,
              width,
              stroke,
              scaling,
              negative,
              maxKey,
            })}
          />
        ))}
    </svg>
  );
}
