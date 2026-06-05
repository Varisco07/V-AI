export class VoiceSynthesis {
  private synth: SpeechSynthesis | null = null
  private voice: SpeechSynthesisVoice | null = null

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis
      this.loadVoice()
    }
  }

  private loadVoice() {
    if (!this.synth) return

    const voices = this.synth.getVoices()
    // Prefer British English voice for JARVIS effect
    this.voice = voices.find(voice => 
      voice.lang === 'en-GB' || voice.lang === 'en-US'
    ) || voices[0]

    if (voices.length === 0) {
      this.synth.onvoiceschanged = () => {
        const newVoices = this.synth!.getVoices()
        this.voice = newVoices.find(voice => 
          voice.lang === 'en-GB' || voice.lang === 'en-US'
        ) || newVoices[0]
      }
    }
  }

  speak(text: string, rate: number = 0.9, pitch: number = 0.9) {
    if (!this.synth) {
      console.warn('Speech synthesis not supported')
      return
    }

    // Cancel any ongoing speech
    this.synth.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    if (this.voice) {
      utterance.voice = this.voice
    }
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = 1

    this.synth.speak(utterance)
  }

  stop() {
    if (this.synth) {
      this.synth.cancel()
    }
  }
}

// JARVIS-specific responses
export const jarvisResponses = {
  greeting: "Good evening, Sir. All systems are operational.",
  status: "Neural core is active. Security protocols enabled. All systems nominal.",
  deploy: "Initiating deployment sequence. Stand by, Sir.",
  analyze: "Running comprehensive analysis. This will take a moment.",
  error: "I'm sorry, Sir. I didn't quite catch that. Could you repeat?",
  success: "Task completed successfully, Sir.",
  thinking: "Processing your request, Sir. One moment.",
}