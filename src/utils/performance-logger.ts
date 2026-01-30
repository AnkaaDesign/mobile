/**
 * Performance Logger for Navigation & Data Fetching Debugging
 *
 * This utility helps identify performance bottlenecks in:
 * - Navigation transitions
 * - Data fetching
 * - Component mounting
 * - Screen rendering
 *
 * To use: Import and call the methods at key points in your code.
 * View logs in Metro bundler console or React Native Debugger.
 */

type PerformanceEntry = {
  label: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, any>
}

class PerformanceLogger {
  private entries: Map<string, PerformanceEntry> = new Map()
  private enabled: boolean = __DEV__ // Only log in development
  private navigationTimings: Array<{
    from: string
    to: string
    clickTime: number
    mountTime?: number
    dataReadyTime?: number
    renderTime?: number
  }> = []

  setEnabled(value: boolean) {
    this.enabled = value
  }

  /**
   * Start timing an operation
   */
  start(label: string, metadata?: Record<string, any>) {
    if (!this.enabled) return

    const startTime = performance.now()
    this.entries.set(label, { label, startTime, metadata })

    console.log(`⏱️ [PERF START] ${label}`, metadata ? JSON.stringify(metadata) : '')
  }

  /**
   * End timing an operation and log the duration
   */
  end(label: string, additionalMetadata?: Record<string, any>) {
    if (!this.enabled) return

    const entry = this.entries.get(label)
    if (!entry) {
      console.warn(`⚠️ [PERF] No start entry found for: ${label}`)
      return
    }

    const endTime = performance.now()
    const duration = endTime - entry.startTime

    entry.endTime = endTime
    entry.duration = duration
    if (additionalMetadata) {
      entry.metadata = { ...entry.metadata, ...additionalMetadata }
    }

    const durationColor = duration > 1000 ? '🔴' : duration > 500 ? '🟠' : duration > 100 ? '🟡' : '🟢'
    console.log(`${durationColor} [PERF END] ${label}: ${duration.toFixed(2)}ms`, entry.metadata ? JSON.stringify(entry.metadata) : '')

    this.entries.delete(label)
    return duration
  }

  /**
   * Log a navigation click event
   */
  navigationClick(from: string, to: string, itemId?: string) {
    if (!this.enabled) return

    const clickTime = performance.now()
    this.navigationTimings.push({
      from,
      to,
      clickTime,
    })

    console.log(`🔵 [NAV CLICK] ${from} → ${to}`, itemId ? `(id: ${itemId})` : '')
    this.start(`nav:${to}`, { from, itemId })
  }

  /**
   * Log when a screen component mounts
   */
  screenMount(screenName: string) {
    if (!this.enabled) return

    const mountTime = performance.now()
    const timing = this.navigationTimings[this.navigationTimings.length - 1]

    if (timing && timing.to === screenName) {
      timing.mountTime = mountTime
      const timeSinceClick = mountTime - timing.clickTime
      console.log(`🔵 [SCREEN MOUNT] ${screenName}: ${timeSinceClick.toFixed(2)}ms since click`)
    } else {
      console.log(`🔵 [SCREEN MOUNT] ${screenName}`)
    }
  }

  /**
   * Log when data is ready on a screen
   */
  dataReady(screenName: string, dataSource?: string) {
    if (!this.enabled) return

    const dataReadyTime = performance.now()
    const timing = this.navigationTimings[this.navigationTimings.length - 1]

    if (timing && timing.to === screenName) {
      timing.dataReadyTime = dataReadyTime
      const timeSinceClick = dataReadyTime - timing.clickTime
      const timeSinceMount = timing.mountTime ? dataReadyTime - timing.mountTime : 0
      console.log(`🔵 [DATA READY] ${screenName}: ${timeSinceClick.toFixed(2)}ms since click, ${timeSinceMount.toFixed(2)}ms since mount`, dataSource ? `(${dataSource})` : '')
    } else {
      console.log(`🔵 [DATA READY] ${screenName}`, dataSource ? `(${dataSource})` : '')
    }

    this.end(`nav:${screenName}`)
  }

  /**
   * Log when screen is fully rendered
   */
  screenRendered(screenName: string) {
    if (!this.enabled) return

    const renderTime = performance.now()
    const timing = this.navigationTimings[this.navigationTimings.length - 1]

    if (timing && timing.to === screenName) {
      timing.renderTime = renderTime
      const timeSinceClick = renderTime - timing.clickTime
      const timeSinceMount = timing.mountTime ? renderTime - timing.mountTime : 0
      const timeSinceData = timing.dataReadyTime ? renderTime - timing.dataReadyTime : 0

      console.log(`✅ [SCREEN RENDERED] ${screenName}:`)
      console.log(`   Total: ${timeSinceClick.toFixed(2)}ms`)
      console.log(`   Mount→Render: ${timeSinceMount.toFixed(2)}ms`)
      console.log(`   Data→Render: ${timeSinceData.toFixed(2)}ms`)
    }
  }

  /**
   * Log a simple timing marker
   */
  mark(label: string) {
    if (!this.enabled) return
    console.log(`📍 [PERF MARK] ${label}: ${performance.now().toFixed(2)}ms`)
  }

  /**
   * Log query/fetch timing
   */
  query(queryKey: string, status: 'start' | 'success' | 'error', duration?: number) {
    if (!this.enabled) return

    if (status === 'start') {
      this.start(`query:${queryKey}`)
      console.log(`🔍 [QUERY START] ${queryKey}`)
    } else if (status === 'success') {
      const d = this.end(`query:${queryKey}`)
      console.log(`✅ [QUERY SUCCESS] ${queryKey}: ${(d || duration || 0).toFixed(2)}ms`)
    } else {
      this.end(`query:${queryKey}`)
      console.log(`❌ [QUERY ERROR] ${queryKey}`)
    }
  }

  /**
   * Get summary of recent navigation timings
   */
  getSummary() {
    if (!this.enabled) return

    console.log('\n📊 [PERF SUMMARY] Recent Navigation Timings:')
    const recent = this.navigationTimings.slice(-5)
    recent.forEach((t, i) => {
      if (t.renderTime) {
        const total = t.renderTime - t.clickTime
        console.log(`  ${i + 1}. ${t.from} → ${t.to}: ${total.toFixed(0)}ms total`)
      }
    })
    console.log('')
  }

  /**
   * Clear all entries
   */
  clear() {
    this.entries.clear()
    this.navigationTimings = []
  }
}

export const perfLog = new PerformanceLogger()

// Re-export for convenience
export const {
  start,
  end,
  navigationClick,
  screenMount,
  dataReady,
  screenRendered,
  mark,
  query,
  getSummary,
} = {
  start: perfLog.start.bind(perfLog),
  end: perfLog.end.bind(perfLog),
  navigationClick: perfLog.navigationClick.bind(perfLog),
  screenMount: perfLog.screenMount.bind(perfLog),
  dataReady: perfLog.dataReady.bind(perfLog),
  screenRendered: perfLog.screenRendered.bind(perfLog),
  mark: perfLog.mark.bind(perfLog),
  query: perfLog.query.bind(perfLog),
  getSummary: perfLog.getSummary.bind(perfLog),
}
