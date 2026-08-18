const { fetchLeetCodeProfile } = require('./src/services/leetcode.service');

async function test() {
  try {
    const profile = await fetchLeetCodeProfile('i_mohit_10');
    console.log('Success:', profile);
  } catch (err) {
    console.log('Failed:', err.message);
  }
}

test();
