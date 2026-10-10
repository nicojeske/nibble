class Toast {
  message = $state<string | null>(null)
  private timer: ReturnType<typeof setTimeout> | undefined

  show(message: string, ms = 2000) {
    this.message = message
    clearTimeout(this.timer)
    this.timer = setTimeout(() => (this.message = null), ms)
  }
}

export const toast = new Toast()
