declare module 'speak-tts' {
    interface SpeakTTSInitConfig {
        volume?: number;
        rate?: number;
        pitch?: number;
        voice?: string;
        lang?: string;
    }

    interface SpeakTTSOptions {
        text: string;
        queue?: boolean;
        listeners?: {
            onstart?: () => void;
            onend?: () => void;
            onerror?: (error: Error) => void;
            onpause?: () => void;
            onresume?: () => void;
            onboundary?: (event: any) => void;
        };
    }

    interface SpeakTTSStatic {
        init(config?: SpeakTTSInitConfig): Promise<void>;
        speak(options: SpeakTTSOptions): Promise<void>;
        pause(): void;
        resume(): void;
        cancel(): void;
        setVolume(volume: number): void;
        setRate(rate: number): void;
        setPitch(pitch: number): void;
        setVoice(voice: string): void;
        getVoices(): Promise<SpeechSynthesisVoice[]>;
        getProperty(property: string): any;
        setProperty(property: string, value: any): void;
        hasBrowserSupport(): boolean;
        isPaused(): boolean;
        isSpeaking(): boolean;
    }

    const SpeakTTS: {
        new (): SpeakTTSStatic;
    };

    export default SpeakTTS;
}
