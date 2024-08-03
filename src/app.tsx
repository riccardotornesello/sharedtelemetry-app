import React from "react";
import { createRoot } from "react-dom/client";
import { InputGraph } from "./components/input-graph";

const root = createRoot(document.body);

root.render(<InputGraph height={100} width={400} stroke={3} valsCount={200} />);
