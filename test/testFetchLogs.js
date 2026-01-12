const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { getDoorLogs } = require('../hiveService');

async function testFetchLogs() {
  console.log('🧪 Testing Hive Custom JSON Fetching...\n');
  console.log(`Account: @${process.env.HIVE_USERNAME}`);
  console.log(`Custom JSON ID: lasnubes_door_event\n`);

  try {
    console.log('📜 Fetching door logs from Hive blockchain...');
    const logs = await getDoorLogs(20);
    
    if (logs.length === 0) {
      console.log('\n⚠️  No door events found on the blockchain yet.');
      return;
    }
    
    console.log(`\n✓ Found ${logs.length} door events:\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    logs.forEach((log, index) => {
      console.log(`Event #${index + 1}:`);
      console.log(`  Message: ${log.message}`);
      console.log(`  User: @${log.user}`);
      console.log(`  Timestamp: ${log.timestamp}`);
      console.log(`  Action: ${log.action}`);
      if (log.block_num) {
        console.log(`  Block: ${log.block_num}`);
      }
      console.log('');
    });
    
    console.log('═══════════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('\n✗ Error fetching logs:');
    console.error(error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the test
testFetchLogs();
