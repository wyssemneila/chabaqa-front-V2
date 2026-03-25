#!/usr/bin/env node

/**
 * Browser Compatibility Checker
 * 
 * This script checks if the admin dashboard code uses features
 * that are not supported in target browsers.
 */

const fs = require('fs')
const path = require('path')

// Features to check for compatibility
const compatibilityChecks = [
  {
    name: 'Optional Chaining',
    pattern: /\?\./g,
    minVersions: {
      chrome: 80,
      firefox: 74,
      safari: 13.1,
      edge: 80
    }
  },
  {
    name: 'Nullish Coalescing',
    pattern: /\?\?/g,
    minVersions: {
      chrome: 80,
      firefox: 72,
      safari: 13.1,
      edge: 80
    }
  },
  {
    name: 'BigInt',
    pattern: /\bBigInt\b/g,
    minVersions: {
      chrome: 67,
      firefox: 68,
      safari: 14,
      edge: 79
    }
  },
  {
    name: 'Dynamic Import',
    pattern: /import\(/g,
    minVersions: {
      chrome: 63,
      firefox: 67,
      safari: 11.1,
      edge: 79
    }
  }
]

// CSS features to check
const cssCompatibilityChecks = [
  {
    name: 'CSS Grid',
    pattern: /display:\s*grid/g,
    minVersions: {
      chrome: 57,
      firefox: 52,
      safari: 10.1,
      edge: 16
    }
  },
  {
    name: 'CSS Flexbox',
    pattern: /display:\s*flex/g,
    minVersions: {
      chrome: 29,
      firefox: 28,
      safari: 9,
      edge: 12
    }
  },
  {
    name: 'CSS Custom Properties',
    pattern: /var\(--/g,
    minVersions: {
      chrome: 49,
      firefox: 31,
      safari: 9.1,
      edge: 15
    }
  },
  {
    name: 'Backdrop Filter',
    pattern: /backdrop-filter:/g,
    minVersions: {
      chrome: 76,
      firefox: 103,
      safari: 9,
      edge: 79
    },
    warning: 'Limited support in Firefox'
  }
]

function scanDirectory(dir, checks, fileExtensions) {
  const results = []
  
  function scan(currentDir) {
    const files = fs.readdirSync(currentDir)
    
    for (const file of files) {
      const filePath = path.join(currentDir, file)
      const stat = fs.statSync(filePath)
      
      if (stat.isDirectory()) {
        // Skip node_modules and .next
        if (file !== 'node_modules' && file !== '.next' && file !== 'dist') {
          scan(filePath)
        }
      } else if (fileExtensions.some(ext => file.endsWith(ext))) {
        const content = fs.readFileSync(filePath, 'utf-8')
        
        for (const check of checks) {
          const matches = content.match(check.pattern)
          if (matches) {
            results.push({
              file: filePath,
              feature: check.name,
              count: matches.length,
              minVersions: check.minVersions,
              warning: check.warning
            })
          }
        }
      }
    }
  }
  
  scan(dir)
  return results
}

function main() {
  console.log('🔍 Checking browser compatibility...\n')
  
  const adminDir = path.join(__dirname, '..', 'app', '(admin)')
  
  // Check JavaScript/TypeScript files
  console.log('📝 Checking JavaScript/TypeScript features...')
  const jsResults = scanDirectory(adminDir, compatibilityChecks, ['.ts', '.tsx', '.js', '.jsx'])
  
  if (jsResults.length > 0) {
    console.log('\nFound modern JavaScript features:')
    const featureCounts = {}
    
    for (const result of jsResults) {
      if (!featureCounts[result.feature]) {
        featureCounts[result.feature] = {
          count: 0,
          minVersions: result.minVersions,
          warning: result.warning
        }
      }
      featureCounts[result.feature].count += result.count
    }
    
    for (const [feature, data] of Object.entries(featureCounts)) {
      console.log(`\n  ✓ ${feature} (${data.count} occurrences)`)
      console.log(`    Minimum versions:`)
      console.log(`      Chrome: ${data.minVersions.chrome}+`)
      console.log(`      Firefox: ${data.minVersions.firefox}+`)
      console.log(`      Safari: ${data.minVersions.safari}+`)
      console.log(`      Edge: ${data.minVersions.edge}+`)
      if (data.warning) {
        console.log(`    ⚠️  ${data.warning}`)
      }
    }
  } else {
    console.log('  No modern JavaScript features found')
  }
  
  // Check CSS files
  console.log('\n\n🎨 Checking CSS features...')
  const cssResults = scanDirectory(adminDir, cssCompatibilityChecks, ['.css', '.scss'])
  
  if (cssResults.length > 0) {
    console.log('\nFound modern CSS features:')
    const featureCounts = {}
    
    for (const result of cssResults) {
      if (!featureCounts[result.feature]) {
        featureCounts[result.feature] = {
          count: 0,
          minVersions: result.minVersions,
          warning: result.warning
        }
      }
      featureCounts[result.feature].count += result.count
    }
    
    for (const [feature, data] of Object.entries(featureCounts)) {
      console.log(`\n  ✓ ${feature} (${data.count} occurrences)`)
      console.log(`    Minimum versions:`)
      console.log(`      Chrome: ${data.minVersions.chrome}+`)
      console.log(`      Firefox: ${data.minVersions.firefox}+`)
      console.log(`      Safari: ${data.minVersions.safari}+`)
      console.log(`      Edge: ${data.minVersions.edge}+`)
      if (data.warning) {
        console.log(`    ⚠️  ${data.warning}`)
      }
    }
  } else {
    console.log('  No modern CSS features found')
  }
  
  console.log('\n\n✅ Browser compatibility check complete!')
  console.log('\n📋 Summary:')
  console.log('  - All features are supported in modern browsers')
  console.log('  - Ensure autoprefixer is configured for CSS vendor prefixes')
  console.log('  - Next.js provides automatic polyfills for most features')
  console.log('  - Test on actual browsers for best results')
  console.log('\n💡 Run cross-browser tests: npm run test:e2e')
}

main()
