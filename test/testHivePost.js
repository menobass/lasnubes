const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { postDoorEvent, getDoorLogs } = require('../hiveService');

async function testHivePost() {
  console.log('🧪 Testing Hive Custom JSON Posting...\n');
  console.log(`Account: @${process.env.HIVE_USERNAME}`);
  console.log(`Custom JSON ID: lasnubes_door_event\n`);

  try {
    // Test posting a door event
    console.log('📝 Posting test event to Hive blockchain...');
    const username = 'testuser';
    const result = await postDoorEvent(username);
    
    console.log('\n✓ Success! Event posted to Hive:');
    console.log('─────────────────────────────────────');
    console.log(`Transaction ID: ${result.transactionId}`);
    console.log(`Block Number: ${result.blockNum}`);
    console.log('\nPayload posted:');
    console.log(JSON.stringify(result.payload, null, 2));
    
    // Wait a few seconds for the transaction to be included
    console.log('\n⏳ Waiting 5 seconds for transaction to be included...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Fetch and display recent logs
    console.log('\n📜 Fetching recent door logs...');
    const logs = await getDoorLogs(5);
    
    console.log(`\n✓ Found ${logs.length} recent events:\n`);
    logs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.message}`);
      console.log(`   Time: ${log.timestamp}`);
      console.log(`   Block: ${log.block_num || 'N/A'}\n`);
    });
    
  } catch (error) {
    console.error('\n✗ Error during test:');
    console.error(error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the test
testHivePost();
