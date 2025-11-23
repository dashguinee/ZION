/**
 * DASH⚡ PWA Installation Logic
 * Handles "Add to Home Screen" functionality
 */

class PWAInstaller {
  constructor() {
    this.deferredPrompt = null
    this.installBtn = document.getElementById('installBtn')

    this.init()
  }

  init() {
    // Register service worker
    this.registerServiceWorker()

    // Setup install prompt
    this.setupInstallPrompt()

    // Detect if already installed
    this.detectInstallation()

    // Track installation analytics
    this.trackAnalytics()
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js')
        console.log('✅ Service Worker registered:', registration)

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          console.log('🔄 Service Worker update found')

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              this.showUpdateNotification()
            }
          })
        })
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error)
      }
    }
  }

  setupInstallPrompt() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('💾 Install prompt ready')

      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()

      // Save the event for later
      this.deferredPrompt = e

      // Show install button
      this.showInstallButton()
    })

    // Handle install button click
    if (this.installBtn) {
      this.installBtn.addEventListener('click', () => {
        this.triggerInstall()
      })
    }

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('✅ DASH installed successfully!')
      this.deferredPrompt = null

      // Hide install button
      this.hideInstallButton()

      // Show success message
      this.showSuccessMessage()

      // Track installation
      this.trackEvent('pwa_installed')
    })
  }

  showInstallButton() {
    if (this.installBtn) {
      this.installBtn.style.display = 'inline-flex'
    }
  }

  hideInstallButton() {
    if (this.installBtn) {
      this.installBtn.style.display = 'none'
    }
  }

  async triggerInstall() {
    if (!this.deferredPrompt) {
      // If no prompt available, show manual instructions
      this.showManualInstructions()
      return
    }

    // Show the install prompt
    this.deferredPrompt.prompt()

    // Wait for the user's response
    const { outcome } = await this.deferredPrompt.userChoice
    console.log(`User response to install prompt: ${outcome}`)

    if (outcome === 'accepted') {
      console.log('✅ User accepted install')
      this.trackEvent('pwa_install_accepted')
    } else {
      console.log('❌ User dismissed install')
      this.trackEvent('pwa_install_dismissed')
    }

    // Clear the prompt
    this.deferredPrompt = null
  }

  detectInstallation() {
    // Check if running as installed PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         window.navigator.standalone ||
                         document.referrer.includes('android-app://')

    if (isStandalone) {
      console.log('✅ Running as installed PWA')
      this.hideInstallButton()
      this.trackEvent('pwa_running_standalone')
    }

    // iOS detection
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
    const isInStandaloneMode = ('standalone' in navigator) && (navigator.standalone)

    if (isIOS && !isInStandaloneMode) {
      // Show iOS-specific install instructions
      console.log('📱 iOS detected - showing manual instructions')
    }
  }

  showManualInstructions() {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)

    let instructions = ''

    if (isIOS) {
      instructions = `
        <div style="background: var(--bg-card); padding: 2rem; border-radius: var(--radius-lg); max-width: 500px; margin: 2rem auto; text-align: center;">
          <h3 style="margin-bottom: 1rem;">📱 Install DASH on iOS</h3>
          <ol style="text-align: left; color: var(--text-secondary); line-height: 2;">
            <li>Tap the Share button <span style="font-size: 1.5rem;">⬆️</span></li>
            <li>Scroll down and tap "Add to Home Screen"</li>
            <li>Tap "Add" in the top right corner</li>
            <li>DASH will appear on your home screen!</li>
          </ol>
        </div>
      `
    } else if (isAndroid) {
      instructions = `
        <div style="background: var(--bg-card); padding: 2rem; border-radius: var(--radius-lg); max-width: 500px; margin: 2rem auto; text-align: center;">
          <h3 style="margin-bottom: 1rem;">📱 Install DASH on Android</h3>
          <ol style="text-align: left; color: var(--text-secondary); line-height: 2;">
            <li>Tap the menu button (⋮) in your browser</li>
            <li>Tap "Add to Home screen" or "Install app"</li>
            <li>Tap "Add" or "Install"</li>
            <li>DASH will appear on your home screen!</li>
          </ol>
        </div>
      `
    } else {
      instructions = `
        <div style="background: var(--bg-card); padding: 2rem; border-radius: var(--radius-lg); max-width: 500px; margin: 2rem auto; text-align: center;">
          <h3 style="margin-bottom: 1rem;">💻 Install DASH on Desktop</h3>
          <p style="color: var(--text-secondary); line-height: 2;">
            Look for the install icon in your browser's address bar,<br>
            or check your browser's menu for "Install DASH" option.
          </p>
        </div>
      `
    }

    // Show in modal
    const modalHTML = `
      <div class="modal-overlay">
        <div class="modal">
          <button class="modal-close" onclick="this.parentElement.parentElement.remove()">×</button>
          <div class="modal-body">
            ${instructions}
            <button class="btn btn-primary w-full mt-lg" onclick="this.parentElement.parentElement.parentElement.remove()">
              Got it!
            </button>
          </div>
        </div>
      </div>
    `

    document.getElementById('modalContainer').innerHTML = modalHTML
  }

  showSuccessMessage() {
    const successHTML = `
      <div style="
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--gradient-primary);
        color: white;
        padding: 1.5rem 2rem;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-card);
        z-index: var(--z-toast);
        animation: slideUp 0.5s ease;
      ">
        ✅ DASH installed successfully! Check your home screen.
      </div>
    `

    const toast = document.createElement('div')
    toast.innerHTML = successHTML
    document.body.appendChild(toast)

    // Remove after 5 seconds
    setTimeout(() => {
      toast.remove()
    }, 5000)
  }

  showUpdateNotification() {
    const updateHTML = `
      <div style="
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--bg-card);
        color: white;
        padding: 1.5rem 2rem;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-card);
        z-index: var(--z-toast);
        display: flex;
        gap: 1rem;
        align-items: center;
      ">
        <span>🔄 New version available!</span>
        <button class="btn btn-primary" onclick="window.location.reload()">
          Update Now
        </button>
      </div>
    `

    const toast = document.createElement('div')
    toast.innerHTML = updateHTML
    document.body.appendChild(toast)
  }

  trackAnalytics() {
    // Track if user has visited before
    const hasVisited = localStorage.getItem('dash_has_visited')

    if (!hasVisited) {
      console.log('👋 First time visitor')
      localStorage.setItem('dash_has_visited', 'true')
      this.trackEvent('first_visit')
    } else {
      console.log('🔄 Returning visitor')
      this.trackEvent('return_visit')
    }

    // Track page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_hidden')
      } else {
        this.trackEvent('page_visible')
      }
    })
  }

  trackEvent(eventName, data = {}) {
    // Save to localStorage for now
    const events = JSON.parse(localStorage.getItem('dash_events') || '[]')
    events.push({
      event: eventName,
      timestamp: new Date().toISOString(),
      data: data
    })
    localStorage.setItem('dash_events', JSON.stringify(events))

    console.log(`📊 Event tracked: ${eventName}`, data)

    // TODO: Send to analytics server
  }
}

// Initialize PWA installer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const pwaInstaller = new PWAInstaller()
  window.pwaInstaller = pwaInstaller
})
