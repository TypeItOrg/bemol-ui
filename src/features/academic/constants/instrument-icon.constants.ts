import { DrumIcon, GuitarIcon, KeyboardMusicIcon, MicVocalIcon, Music2Icon, PianoIcon, type LucideIcon } from "lucide-react";

import {
  BandoneonIcon,
  CelloIcon,
  ClarinetIcon,
  FluteIcon,
  HarpIcon,
  SaxophoneIcon,
  TrumpetIcon,
  ViolinIcon,
} from "@features/academic/components/instrument-custom-icons";
import type { InstrumentIcon } from "@features/academic/types/instrument-icon.types";

export const INSTRUMENT_ICONS: Record<InstrumentIcon, { label: string; icon: LucideIcon }> = {
  MUSIC: { label: "Música", icon: Music2Icon },
  PIANO: { label: "Piano", icon: PianoIcon },
  KEYBOARD: { label: "Teclado", icon: KeyboardMusicIcon },
  GUITAR: { label: "Guitarra", icon: GuitarIcon },
  VIOLIN: { label: "Violín", icon: ViolinIcon },
  CELLO: { label: "Violonchelo", icon: CelloIcon },
  HARP: { label: "Arpa", icon: HarpIcon },
  FLUTE: { label: "Flauta", icon: FluteIcon },
  CLARINET: { label: "Clarinete", icon: ClarinetIcon },
  SAXOPHONE: { label: "Saxofón", icon: SaxophoneIcon },
  TRUMPET: { label: "Trompeta", icon: TrumpetIcon },
  BANDONEON: { label: "Bandoneón", icon: BandoneonIcon },
  PERCUSSION: { label: "Percusión", icon: DrumIcon },
  VOICE: { label: "Voz", icon: MicVocalIcon },
};

export const DEFAULT_INSTRUMENT_ICON: InstrumentIcon = "MUSIC";
