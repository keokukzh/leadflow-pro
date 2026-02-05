import { WorkflowOrchestrator } from '../src/lib/orchestrator/orchestrator';
import { WorkflowMonitor } from '../src/lib/orchestrator/monitor';
import { WorkflowConfig } from '../src/lib/orchestrator/types';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const workflowPath = args[1];

  if (!command || !workflowPath) {
    console.log('Usage: npx tsx scripts/workflow.ts run <path-to-workflow.json>');
    process.exit(1);
  }

  if (command === 'run') {
    const fullPath = path.resolve(workflowPath);
    if (!fs.existsSync(fullPath)) {
      console.error(`Error: Workflow file not found at ${fullPath}`);
      process.exit(1);
    }

    const config: WorkflowConfig = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    const orchestrator = new WorkflowOrchestrator();
    const monitor = new WorkflowMonitor();

    console.log(`🚀 Starting workflow: ${config.name} (${config.version})`);
    console.log(`📝 Description: ${config.description}`);
    console.log('-----------------------------------');

    const report = await orchestrator.execute(config);
    monitor.recordExecution(report);

    console.log('-----------------------------------');
    console.log(`🏁 Workflow ${report.status === 'completed' ? 'Finished Successfully' : 'Failed'}`);
    console.log(`⏱️ Duration: ${(report.duration / 1000).toFixed(2)}s`);
    
    console.log('\n📊 Task Summary:');
    Object.values(report.tasks).forEach(task => {
      const statusIcon = task.status === 'completed' ? '✅' : task.status === 'failed' ? '❌' : '⏭️';
      console.log(`${statusIcon} ${task.id}: ${task.status} (${((task.duration || 0) / 1000).toFixed(2)}s)`);
      if (task.error) {
        console.log(`   └─ Error: ${task.error}`);
      }
    });

    const health = monitor.getHealthReport();
    console.log('\n📈 Health Report:');
    console.log(`   Success Rate: ${health.overall.successRate}`);
    console.log(`   Total Runs: ${health.overall.totalRuns}`);
  } else {
    console.log(`Unknown command: ${command}`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
