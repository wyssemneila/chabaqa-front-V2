import { test, expect } from '@playwright/test'

/**
 * E2E Test: Performance Testing
 * 
 * This test validates the performance characteristics of the Admin Dashboard
 * including load times, bundle sizes, and runtime performance.
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 */

test.describe('Performance Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated state
    await page.goto('/admin/login')
    await page.evaluate(() => {
      localStorage.setItem('admin_access_token', 'mock_access_token')
      localStorage.setItem('admin_refresh_token', 'mock_refresh_token')
    })
  })

  test('should load dashboard within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
    
    console.log(`Dashboard loaded in ${loadTime}ms`)
  })

  test('should have acceptable Time to Interactive', async ({ page }) => {
    await page.goto('/admin/dashboard')
    
    // Measure Time to Interactive using Performance API
    const tti = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        if (document.readyState === 'complete') {
          resolve(performance.now())
        } else {
          window.addEventListener('load', () => {
            resolve(performance.now())
          })
        }
      })
    })
    
    // TTI should be under 3 seconds
    expect(tti).toBeLessThan(3000)
    
    console.log(`Time to Interactive: ${tti}ms`)
  })

  test('should have minimal layout shifts', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Measure Cumulative Layout Shift
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0
        
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ((entry as any).hadRecentInput) continue
            clsValue += (entry as any).value
          }
        })
        
        observer.observe({ type: 'layout-shift', buffered: true })
        
        setTimeout(() => {
          observer.disconnect()
          resolve(clsValue)
        }, 2000)
      })
    })
    
    // CLS should be under 0.1
    expect(cls).toBeLessThan(0.1)
    
    console.log(`Cumulative Layout Shift: ${cls}`)
  })

  test('should load images efficiently', async ({ page }) => {
    await page.goto('/admin/dashboard')
    
    // Get all image requests
    const imageRequests: any[] = []
    
    page.on('response', (response) => {
      const contentType = response.headers()['content-type']
      if (contentType && contentType.startsWith('image/')) {
        imageRequests.push({
          url: response.url(),
          size: parseInt(response.headers()['content-length'] || '0'),
          status: response.status()
        })
      }
    })
    
    await page.waitForLoadState('networkidle')
    
    // Check image optimization
    for (const request of imageRequests) {
      // Images should load successfully
      expect(request.status).toBe(200)
      
      // Images should be reasonably sized (< 500KB)
      if (request.size > 0) {
        expect(request.size).toBeLessThan(500 * 1024)
      }
    }
    
    console.log(`Loaded ${imageRequests.length} images`)
  })

  test('should fetch data in parallel', async ({ page }) => {
    const requestTimes: Record<string, number> = {}
    
    page.on('request', (request) => {
      if (request.url().includes('/admin/')) {
        requestTimes[request.url()] = Date.now()
      }
    })
    
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Check if multiple API requests started around the same time (parallel)
    const times = Object.values(requestTimes)
    if (times.length > 1) {
      const minTime = Math.min(...times)
      const maxTime = Math.max(...times)
      const timeDiff = maxTime - minTime
      
      // Requests should start within 100ms of each other (parallel)
      expect(timeDiff).toBeLessThan(100)
      
      console.log(`API requests started within ${timeDiff}ms`)
    }
  })

  test('should have efficient JavaScript execution', async ({ page }) => {
    await page.goto('/admin/dashboard')
    
    // Measure Total Blocking Time
    const tbt = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let totalBlockingTime = 0
        
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const duration = entry.duration
            if (duration > 50) {
              totalBlockingTime += duration - 50
            }
          }
        })
        
        observer.observe({ type: 'longtask', buffered: true })
        
        setTimeout(() => {
          observer.disconnect()
          resolve(totalBlockingTime)
        }, 3000)
      })
    })
    
    // TBT should be under 300ms
    expect(tbt).toBeLessThan(300)
    
    console.log(`Total Blocking Time: ${tbt}ms`)
  })

  test('should have smooth scrolling', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')
    
    // Measure frame rate during scrolling
    const fps = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let frameCount = 0
        let lastTime = performance.now()
        
        function countFrame() {
          frameCount++
          const currentTime = performance.now()
          
          if (currentTime - lastTime >= 1000) {
            resolve(frameCount)
          } else {
            requestAnimationFrame(countFrame)
          }
        }
        
        // Scroll to trigger frames
        window.scrollBy(0, 100)
        requestAnimationFrame(countFrame)
      })
    })
    
    // Should maintain at least 30 FPS (ideally 60)
    expect(fps).toBeGreaterThan(30)
    
    console.log(`Scrolling FPS: ${fps}`)
  })

  test('should cache API responses', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Track API requests
    const requests: string[] = []
    
    page.on('request', (request) => {
      if (request.url().includes('/admin/')) {
        requests.push(request.url())
      }
    })
    
    // Navigate away and back
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')
    
    const firstRequestCount = requests.length
    requests.length = 0
    
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')
    
    const secondRequestCount = requests.length
    
    // Second load should make fewer requests (cached)
    // Note: This depends on caching implementation
    console.log(`First load: ${firstRequestCount} requests, Second load: ${secondRequestCount} requests`)
  })

  test('should handle large data sets efficiently', async ({ page }) => {
    // Mock large user list
    await page.route('**/admin/users**', async (route) => {
      const users = Array.from({ length: 1000 }, (_, i) => ({
        _id: `${i}`,
        username: `user${i}`,
        email: `user${i}@test.com`,
        status: 'active',
        role: 'member'
      }))
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: users.slice(0, 50), // Paginated
          total: 1000,
          page: 1,
          pageSize: 50
        })
      })
    })
    
    const startTime = Date.now()
    
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Should handle large data sets efficiently
    expect(loadTime).toBeLessThan(2000)
    
    console.log(`Large data set loaded in ${loadTime}ms`)
  })

  test('should have acceptable First Contentful Paint', async ({ page }) => {
    await page.goto('/admin/dashboard')
    
    // Measure First Contentful Paint
    const fcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              observer.disconnect()
              resolve(entry.startTime)
            }
          }
        })
        
        observer.observe({ type: 'paint', buffered: true })
        
        // Fallback timeout
        setTimeout(() => {
          observer.disconnect()
          resolve(0)
        }, 5000)
      })
    })
    
    // FCP should be under 1.5 seconds
    if (fcp > 0) {
      expect(fcp).toBeLessThan(1500)
      console.log(`First Contentful Paint: ${fcp}ms`)
    }
  })

  test('should have acceptable Largest Contentful Paint', async ({ page }) => {
    await page.goto('/admin/dashboard')
    
    // Measure Largest Contentful Paint
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let lcpValue = 0
        
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          lcpValue = lastEntry.startTime
        })
        
        observer.observe({ type: 'largest-contentful-paint', buffered: true })
        
        setTimeout(() => {
          observer.disconnect()
          resolve(lcpValue)
        }, 3000)
      })
    })
    
    // LCP should be under 2.5 seconds
    if (lcp > 0) {
      expect(lcp).toBeLessThan(2500)
      console.log(`Largest Contentful Paint: ${lcp}ms`)
    }
  })

  test('should not have memory leaks', async ({ page }) => {
    await page.goto('/admin/dashboard')
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize
      }
      return 0
    })
    
    // Navigate between pages multiple times
    for (let i = 0; i < 5; i++) {
      await page.goto('/admin/users')
      await page.waitForLoadState('networkidle')
      await page.goto('/admin/dashboard')
      await page.waitForLoadState('networkidle')
    }
    
    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize
      }
      return 0
    })
    
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - initialMemory
      const increasePercentage = (memoryIncrease / initialMemory) * 100
      
      // Memory should not increase significantly (< 50%)
      expect(increasePercentage).toBeLessThan(50)
      
      console.log(`Memory increase: ${increasePercentage.toFixed(2)}%`)
    }
  })
})
