export interface PwaInstallPromptEvent extends Event {
  prompt(): Promise<unknown>;
}
