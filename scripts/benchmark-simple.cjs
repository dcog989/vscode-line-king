// Simple benchmark runner - just activate extension and capture metrics
const tmpdir = require('node:os').tmpdir;
const path = require('node:path');
const { writeFileSync, mkdirSync, existsSync } = require('node:fs');

const filePath = require.main ? require.main.filename : __filename;
const dirName = path.dirname(filePath);

// Results directory
const resultsDir = path.join(filePath, '../.benchmark-results');
if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
}

// Capture console output for metrics
const metrics = {};
const originalLog = console.log;
console.log = (...args) => {
    const message = args.map(a => String(a)).join(' ');
    
    // Check for startup metrics
    const match = message.match(/STARTUP_METRICS:\s*({.*})/);
    if (match && Object.keys(metrics).length === 0) {
        try {
            const parsed = JSON.parse(match[1]);
            Object.assign(metrics, parsed);
            console.log('\n✅ Captured startup metrics');
        } catch (e) {
            console.error('Failed to parse metrics:', e);
        }
    }
    
    originalLog(...args);
};

// Import extension directly to trigger activation
async function runBenchmark() {
    try {
        // Import of extension to trigger activation with benchmark mode
        const extension = await import('../dist/extension.js');
        console.log('\nExtension imported and activated');
        
        // Give a moment for any async initialization
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if metrics were captured
        if (Object.keys(metrics).length > 0) {
            // Save metrics
            const metricsPath = path.join(resultsDir, 'metrics.json');
            writeFileSync(metricsPath, JSON.stringify(metrics, null, 2), 'utf8');
            console.log(`Metrics saved to: ${metricsPath}`);
            
            // Display results
            console.log('\n=== STARTUP METRICS ===');
            console.log(JSON.stringify(metrics, null, 2));
            
            // Calculate statistics
            const values = Object.values(metrics).filter(v => typeof v === 'number');
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            
            console.log(`\nTotal activation time: ${metrics.total}ms`);
            console.log(`Average: ${avg.toFixed(3)}ms`);
            console.log(`Min: ${min.toFixed(3)}ms`);
            console.log(`Max: ${max.toFixed(3)}ms`);
        } else {
            console.error('❌ No metrics captured');
            process.exit(1);
        }
    } catch (e) {
        console.error('Benchmark failed:', e);
        process.exit(1);
    }
}

runBenchmark();
