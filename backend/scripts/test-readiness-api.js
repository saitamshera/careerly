const mongoose = require('mongoose');
require('dotenv').config();
const { User } = require('../src/models/User');
const { getUnifiedJobReadiness } = require('../src/services/readiness.service');

async function test() {
  try {
    const { connectDatabase } = require('../src/config/db');
    await connectDatabase();

    const user = await User.findOne({}).lean();
    if (!user) {
      console.error('No user found in database');
      process.exit(1);
    }

    console.log(`\n======================================================`);
    console.log(`TESTING UNIFIED READINESS ENGINE WITH REAL USER DATA`);
    console.log(`User ID: ${user._id} | Name: ${user.name} | Email: ${user.email}`);
    console.log(`======================================================\n`);

    const result = await getUnifiedJobReadiness(user._id, {
      targetCompany: 'Amazon',
      targetRole: 'Software Development Engineer (SDE-1)',
      jobDescription: `
        Basic Qualifications:
        - Bachelor's degree in Computer Science or equivalent.
        - Experience with Data Structures, Algorithms, and Object-Oriented Design.
        - Proficiency in at least one modern language such as Java, C++, Python, or JavaScript / Node.js.
        - Understanding of SQL and relational databases.
        - Experience building REST APIs and microservices.
        - Familiarity with AWS cloud and distributed systems.
      `
    });

    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

test();
