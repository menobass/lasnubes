const { Client, PrivateKey } = require('@hiveio/dhive');

// Hive API nodes
const client = new Client([
  'https://api.hive.blog',
  'https://api.deathwing.me',
  'https://hive-api.arcange.eu'
]);

const HIVE_USERNAME = process.env.HIVE_USERNAME;
const HIVE_POSTING_KEY = process.env.HIVE_POSTING_KEY;
const CUSTOM_JSON_ID = 'lasnubes_door_event';

/**
 * Post a door activation event to the Hive blockchain
 * @param {string} username - The user who activated the door
 * @returns {Promise<Object>} Transaction result
 */
async function postDoorEvent(username) {
  try {
    const timestamp = new Date().toISOString();
    
    const payload = {
      action: 'door_activated',
      user: username,
      timestamp: timestamp,
      message: `Gate Door Activated by @${username}`
    };

    const json = JSON.stringify(payload);
    const privateKey = PrivateKey.fromString(HIVE_POSTING_KEY);

    const customJson = {
      required_auths: [],
      required_posting_auths: [HIVE_USERNAME],
      id: CUSTOM_JSON_ID,
      json: json
    };

    const result = await client.broadcast.json(customJson, privateKey);
    
    console.log('✓ Posted to Hive blockchain:', result);
    return {
      success: true,
      transactionId: result.id,
      blockNum: result.block_num,
      payload: payload
    };
  } catch (error) {
    console.error('Failed to post to Hive:', error);
    throw error;
  }
}

/**
 * Fetch door event logs from the Hive blockchain
 * @param {number} limit - Maximum number of events to fetch
 * @returns {Promise<Array>} Array of door events
 */
async function getDoorLogs(limit = 50) {
  try {
    let from = -1; // -1 means "most recent"
    let batchSize = 1000;
    let doorEvents = [];

    while (doorEvents.length < limit) {
      const history = await client.call(
        'condenser_api',
        'get_account_history',
        [HIVE_USERNAME, from, batchSize]
      );

      if (!history || history.length === 0) break;

      // Process operations in reverse (newest first)
      for (let i = history.length - 1; i >= 0; i--) {
        const [index, op] = history[i];
        
        // Check if it's a custom_json operation with our ID
        if (op.op[0] === 'custom_json' && op.op[1].id === CUSTOM_JSON_ID) {
          const data = JSON.parse(op.op[1].json);
          doorEvents.push({
            ...data,
            block_num: op.block,
            timestamp: data.timestamp || op.timestamp
          });
          
          if (doorEvents.length >= limit) break;
        }
      }

      // Move backwards for pagination
      from = history[0][0] - 1;
      if (from <= 0) break;
    }

    return doorEvents;
  } catch (error) {
    console.error('Failed to fetch door logs from Hive:', error);
    throw error;
  }
}

module.exports = {
  postDoorEvent,
  getDoorLogs
};
