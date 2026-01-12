const jwt = require('jsonwebtoken');
const { PrivateKey, Client } = require('@hiveio/dhive');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = '30d'; // 30 days

// Hive API client
const client = new Client([
  'https://api.hive.blog',
  'https://api.deathwing.me',
  'https://hive-api.arcange.eu'
]);

// Load authorized users from JSON file
function loadAuthorizedUsers() {
  try {
    const filePath = path.join(__dirname, 'authorized-users.json');
    const data = fs.readFileSync(filePath, 'utf8');
    const { authorizedUsers } = JSON.parse(data);
    return authorizedUsers;
  } catch (error) {
    console.error('Error loading authorized users:', error);
    return [];
  }
}

/**
 * Verify if user is authorized
 * @param {string} username - Hive username
 * @returns {boolean}
 */
function isUserAuthorized(username) {
  const authorizedUsers = loadAuthorizedUsers();
  console.log(`🔍 Checking authorization for: "${username}"`);
  console.log(`📋 Authorized users:`, authorizedUsers);
  const isAuthorized = authorizedUsers.includes(username);
  console.log(`✓ Is authorized: ${isAuthorized}`);
  return isAuthorized;
}

/**
 * Validate Hive posting key by verifying it matches the user's account
 * @param {string} username - Hive username
 * @param {string} postingKey - Hive posting key
 * @returns {Promise<boolean>}
 */
async function validateHiveKey(username, postingKey) {
  try {
    // Get the private key object
    const privateKey = PrivateKey.fromString(postingKey);
    
    // Derive the public key from the private key
    const publicKey = privateKey.createPublic().toString();
    
    // Get the user's account from the blockchain
    const accounts = await client.database.getAccounts([username]);
    
    if (!accounts || accounts.length === 0) {
      console.error(`User @${username} not found on Hive blockchain`);
      return false;
    }
    
    const account = accounts[0];
    
    // Check if the public key matches any of the user's posting keys
    const postingKeys = account.posting.key_auths.map(auth => auth[0]);
    const isValid = postingKeys.includes(publicKey);
    
    if (isValid) {
      console.log(`✓ Posting key verified for @${username}`);
    } else {
      console.log(`✗ Posting key does not match @${username}'s account`);
    }
    
    return isValid;
  } catch (error) {
    console.error('Error validating Hive posting key:', error.message);
    return false;
  }
}

/**
 * Generate JWT token for authenticated user
 * @param {string} username - Hive username
 * @returns {string} JWT token
 */
function generateToken(username) {
  return jwt.sign(
    { username },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

/**
 * Verify JWT token and return decoded payload
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload or null if invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Invalid token:', error.message);
    return null;
  }
}

/**
 * Middleware to authenticate requests
 */
function authenticateRequest(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ Auth failed: No token provided');
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const decoded = verifyToken(token);

  if (!decoded) {
    console.log('❌ Auth failed: Invalid or expired token');
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  // Check if user is still authorized (in case whitelist was updated)
  if (!isUserAuthorized(decoded.username)) {
    console.log(`❌ Auth failed: @${decoded.username} no longer in whitelist`);
    return res.status(403).json({
      success: false,
      message: 'User no longer authorized'
    });
  }

  console.log(`✓ Auth successful: @${decoded.username}`);
  // Attach user info to request
  req.user = decoded;
  next();
}

/**
 * Refresh token (issue new token with extended expiry)
 * @param {string} username - Hive username
 * @returns {string} New JWT token
 */
function refreshToken(username) {
  return generateToken(username);
}

module.exports = {
  isUserAuthorized,
  validateHiveKey,
  generateToken,
  verifyToken,
  authenticateRequest,
  refreshToken
};
