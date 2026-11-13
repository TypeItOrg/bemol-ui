import { createLucideIcon } from "lucide-react";

// Custom instruments drawn on lucide's 24px grid so they share its stroke and sizing.
export const ViolinIcon = createLucideIcon("violin", [
  [
    "path",
    {
      d: "M12 10c-2.2 0-3.5 1-3.5 2.6 0 1 .8 1.6.8 2.4s-1.3 1.4-1.3 3c0 2.2 1.8 3.5 4 3.5s4-1.3 4-3.5c0-1.6-1.3-2.2-1.3-3s.8-1.4.8-2.4C15.5 11 14.2 10 12 10Z",
      key: "violin-0",
    },
  ],
  ["circle", { cx: "12", cy: "2.5", r: "1", key: "violin-1" }],
  ["path", { d: "M12 3.5V16", key: "violin-2" }],
  ["path", { d: "M10.5 16h3", key: "violin-3" }],
  ["path", { d: "M10.5 5.5h3", key: "violin-4" }],
]);

export const CelloIcon = createLucideIcon("cello", [
  [
    "path",
    {
      d: "M12 7.5c-2.6 0-4 1.2-4 3 0 1.2 1 1.9 1 2.8s-1.6 1.7-1.6 3.6c0 2.6 2.1 4.1 4.6 4.1s4.6-1.5 4.6-4.1c0-1.9-1.6-2.7-1.6-3.6s1-1.6 1-2.8c0-1.8-1.4-3-4-3Z",
      key: "cello-0",
    },
  ],
  ["circle", { cx: "12", cy: "2", r: "1", key: "cello-1" }],
  ["path", { d: "M12 3V17", key: "cello-2" }],
  ["path", { d: "M10.5 17h3", key: "cello-3" }],
  ["path", { d: "M12 21v2", key: "cello-4" }],
]);

export const HarpIcon = createLucideIcon("harp", [
  ["path", { d: "M6 21V3", key: "harp-0" }],
  ["path", { d: "M6 3c4 0 6 3 10 2.5 1.5-.2 2.5-.8 3-1.5", key: "harp-1" }],
  ["path", { d: "M19 4 9 21", key: "harp-2" }],
  ["path", { d: "M5 21h5", key: "harp-3" }],
  ["path", { d: "M9.5 4.3V20", key: "harp-4" }],
  ["path", { d: "M12.5 5.2v10.4", key: "harp-5" }],
  ["path", { d: "M15.5 5.3v5", key: "harp-6" }],
]);

export const TrumpetIcon = createLucideIcon("trumpet", [
  ["path", { d: "M2 12v2", key: "trumpet-0" }],
  ["path", { d: "M2 13h12", key: "trumpet-1" }],
  ["path", { d: "M14 11.5 21 9v8l-7-2.5", key: "trumpet-2" }],
  ["path", { d: "M5 13v3a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-2.5", key: "trumpet-3" }],
  ["path", { d: "M7.5 9v4", key: "trumpet-4" }],
  ["path", { d: "M10 9v4", key: "trumpet-5" }],
  ["path", { d: "M12.5 9v4", key: "trumpet-6" }],
]);

export const SaxophoneIcon = createLucideIcon("saxophone", [
  ["path", { d: "M4 5 7 3.5l2 1.5", key: "saxophone-0" }],
  ["path", { d: "M9 5v10a4.5 4.5 0 0 0 9 0v-4", key: "saxophone-1" }],
  ["path", { d: "M15.5 11h5", key: "saxophone-2" }],
  ["path", { d: "M12 8h.01", key: "saxophone-3" }],
  ["path", { d: "M12 11h.01", key: "saxophone-4" }],
  ["path", { d: "M12 14h.01", key: "saxophone-5" }],
]);

export const FluteIcon = createLucideIcon("flute", [
  ["path", { d: "M3 21 21 3", key: "flute-0" }],
  ["path", { d: "M8 14.5 9.5 16", key: "flute-1" }],
  ["path", { d: "M11 11.5 12.5 13", key: "flute-2" }],
  ["path", { d: "M14 8.5 15.5 10", key: "flute-3" }],
  ["path", { d: "M17.5 5 19 6.5", key: "flute-4" }],
]);

export const ClarinetIcon = createLucideIcon("clarinet", [
  ["path", { d: "M11 2.5h2", key: "clarinet-0" }],
  ["path", { d: "M11 4h2v12.5c0 1.6 2.5 2.6 2.5 5h-7c0-2.4 2.5-3.4 2.5-5Z", key: "clarinet-1" }],
  ["path", { d: "M9 8h2", key: "clarinet-2" }],
  ["path", { d: "M9 11h2", key: "clarinet-3" }],
  ["path", { d: "M13 13.5h2", key: "clarinet-4" }],
]);

export const BandoneonIcon = createLucideIcon("bandoneon", [
  ["rect", { x: "2", y: "6", width: "4", height: "12", rx: "1", key: "bandoneon-0" }],
  ["rect", { x: "18", y: "6", width: "4", height: "12", rx: "1", key: "bandoneon-1" }],
  ["path", { d: "M6 8l2 1.5L10 8l2 1.5L14 8l2 1.5L18 8", key: "bandoneon-2" }],
  ["path", { d: "M6 16l2-1.5 2 1.5 2-1.5 2 1.5 2-1.5 2 1.5", key: "bandoneon-3" }],
  ["path", { d: "M8 9.5v5", key: "bandoneon-4" }],
  ["path", { d: "M12 9.5v5", key: "bandoneon-5" }],
  ["path", { d: "M16 9.5v5", key: "bandoneon-6" }],
]);
