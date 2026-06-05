export class VoiceRecognition {
  private recognition: any
  private isListening: boolean = false

  constructor() {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition()
      this.recognition.continuous = true
      this.recognition.interimResults = true
      this.recognition.lang = 'en-US'
    }
  }

  start(onResult: (transcript: string, isFinal: boolean) => void) {
    if (!this.recognition) {
      console.warn('Speech recognition not supported')
      return
    }

    this.recognition.onresult = (event: any) => {
      const last = event.results.length - 1
      const transcript = event.results[last][0].transcript
      const isFinal = event.results[last].isFinal

      onResult(transcript, isFinal)
    }

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
    }

    this.recognition.start()
    this.isListening = true
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }

  isActive() {
    return this.isListening
  }
}

export const processVoiceCommand = (transcript: string): string => {
  const command = transcript.toLowerCase().trim()

  if (command.includes('jarvis')) {
    if (command.includes('status') || command.includes('how are you')) {
      return 'All systems operational, Sir.'
    }
    if (command.includes('deploy') || command.includes('launch')) {
      return 'Initiating deployment sequence, Sir.'
    }
    if (command.includes('analyze') || command.includes('scan')) {
      return 'Running full system analysis, Sir.'
    }
    if (command.includes('help')) {
      return 'I am here to assist you, Sir. What do you need?'
    }
  }

  return `Processing: "${transcript}"`
}