#!/usr/bin/env node

/**
 * Lighthouse Audit Runner
 * 
 * This script runs Lighthouse audits on the admin dashboard pages
 * and generates performance reports.
 */

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const pages = [
  { name: 'Login', url: 'http://localhost:8080/admin/login' },
  { name: 'Dashboard', url: 'http://localhost:8080/admin/dashboard' },
  { name: 'Users', url: 'http://localhost:8080/admin/users' },
  { name: 'Communities', url: 'http://localhost:8080/admin/communities' },
  { name: 'Content Moderation', url: 'http://localhost:8080/admin/content-moderation' },
  { name: 'Financial', url: 'http://localhost:8080/admin/financial' }
]

const outputDir = path.join(__dirname, '..', 'lighthouse-reports')

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

console.log('🔍 Running Lighthouse audits...\n')

async function runLighthouse(page) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(outputDir, `${page.name.toLowerCase().replace(/\s+/g, '-')}.html`)
    const jsonPath = path.join(outputDir, `${page.name.toLowerCase().replace(/\s+/g, '-')}.json`)
    
    console.log(`📊 Auditing: ${page.name}`)
    console.log(`   URL: ${page.url}`)
    
    const lighthouse = spawn('npx', [
      'lighthouse',
      page.url,
      '--output=html',
      '--output=json',
      `--output-path=${outputPath.replace('.html', '')}`,
      '--preset=desktop',
      '--quiet',
      '--chrome-flags="--headless"'
    ])
    
    let output = ''
    
    lighthouse.stdout.on('data', (data) => {
      output += data.toString()
    })
    
    lighthouse.stderr.on('data', (data) => {
      // Lighthouse outputs progress to stderr
      process.stderr.write('.')
    })
    
    lighthouse.on('close', (code) => {
      console.log('\n')
      
      if (code === 0) {
        // Read and parse JSON report
        try {
          const report = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
          const scores = report.categories
          
          console.log(`   ✅ ${page.name} audit complete`)
          console.log(`      Performance: ${Math.round(scores.performance.score * 100)}`)
          console.log(`      Accessibility: ${Math.round(scores.accessibility.score * 100)}`)
          console.log(`      Best Practices: ${Math.round(scores['best-practices'].score * 100)}`)
          console.log(`      SEO: ${Math.round(scores.seo.score * 100)}`)
          console.log(`      Report: ${outputPath}`)
          console.log()
          
          resolve({
            name: page.name,
            url: page.url,
            scores: {
              performance: Math.round(scores.performance.score * 100),
              accessibility: Math.round(scores.accessibility.score * 100),
              bestPractices: Math.round(scores['best-practices'].score * 100),
              seo: Math.round(scores.seo.score * 100)
            },
            reportPath: outputPath
          })
        } catch (error) {
          console.error(`   ❌ Failed to parse report for ${page.name}`)
          reject(error)
        }
      } else {
        console.error(`   ❌ Lighthouse failed for ${page.name}`)
        reject(new Error(`Lighthouse exited with code ${code}`))
      }
    })
  })
}

async function main() {
  const results = []
  
  for (const page of pages) {
    try {
      const result = await runLighthouse(page)
      results.push(result)
    } catch (error) {
      console.error(`Failed to audit ${page.name}:`, error.message)
    }
  }
  
  console.log('\n📋 Summary:\n')
  console.log('┌─────────────────────────┬──────────────┬───────────────┬────────────────┬─────┐')
  console.log('│ Page                    │ Performance  │ Accessibility │ Best Practices │ SEO │')
  console.log('├─────────────────────────┼──────────────┼───────────────┼────────────────┼─────┤')
  
  for (const result of results) {
    const name = result.name.padEnd(23)
    const perf = String(result.scores.performance).padStart(3)
    const a11y = String(result.scores.accessibility).padStart(3)
    const bp = String(result.scores.bestPractices).padStart(3)
    const seo = String(result.scores.seo).padStart(3)
    
    console.log(`│ ${name} │     ${perf}      │      ${a11y}      │       ${bp}       │ ${seo} │`)
  }
  
  console.log('└─────────────────────────┴──────────────┴───────────────┴────────────────┴─────┘')
  
  // Calculate averages
  const avgPerf = Math.round(results.reduce((sum, r) => sum + r.scores.performance, 0) / results.length)
  const avgA11y = Math.round(results.reduce((sum, r) => sum + r.scores.accessibility, 0) / results.length)
  const avgBP = Math.round(results.reduce((sum, r) => sum + r.scores.bestPractices, 0) / results.length)
  const avgSEO = Math.round(results.reduce((sum, r) => sum + r.scores.seo, 0) / results.length)
  
  console.log(`\n📊 Average Scores:`)
  console.log(`   Performance: ${avgPerf}`)
  console.log(`   Accessibility: ${avgA11y}`)
  console.log(`   Best Practices: ${avgBP}`)
  console.log(`   SEO: ${avgSEO}`)
  
  // Check if scores meet targets
  const targets = {
    performance: 85,
    accessibility: 90,
    bestPractices: 90,
    seo: 80
  }
  
  console.log(`\n🎯 Target Scores:`)
  console.log(`   Performance: ${avgPerf >= targets.performance ? '✅' : '❌'} ${avgPerf}/${targets.performance}`)
  console.log(`   Accessibility: ${avgA11y >= targets.accessibility ? '✅' : '❌'} ${avgA11y}/${targets.accessibility}`)
  console.log(`   Best Practices: ${avgBP >= targets.bestPractices ? '✅' : '❌'} ${avgBP}/${targets.bestPractices}`)
  console.log(`   SEO: ${avgSEO >= targets.seo ? '✅' : '❌'} ${avgSEO}/${targets.seo}`)
  
  console.log(`\n📁 Reports saved to: ${outputDir}`)
  
  // Exit with error if any score is below target
  const allPassed = 
    avgPerf >= targets.performance &&
    avgA11y >= targets.accessibility &&
    avgBP >= targets.bestPractices &&
    avgSEO >= targets.seo
  
  if (!allPassed) {
    console.log('\n⚠️  Some scores are below target. Please review the reports and optimize.')
    process.exit(1)
  } else {
    console.log('\n✅ All scores meet or exceed targets!')
    process.exit(0)
  }
}

// Check if lighthouse is installed
const checkLighthouse = spawn('npx', ['lighthouse', '--version'])

checkLighthouse.on('close', (code) => {
  if (code === 0) {
    main().catch((error) => {
      console.error('Error running Lighthouse audits:', error)
      process.exit(1)
    })
  } else {
    console.error('❌ Lighthouse is not installed. Install it with: npm install -g lighthouse')
    process.exit(1)
  }
})
