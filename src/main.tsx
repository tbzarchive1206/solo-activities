import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import archiveData from "../app/data/archive.generated.json";
import { SoloCompaniesArchive, type RawArchive } from "./SoloCompaniesArchive";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><SoloCompaniesArchive data={archiveData as RawArchive} /></StrictMode>,
);
