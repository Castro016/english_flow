const { hash, verify } = require('@node-rs/argon2');

async function run() {
  try {
    console.log('Testing Argon2id...');
    const hashed = await hash('FlowAdminSecure#2026!', {
      memoryCost: 65536,
      timeCost: 3,
      outputLen: 32,
      parallelism: 4,
    });
    console.log('Argon2id Hash:', hashed);
    const matched = await verify(hashed, 'FlowAdminSecure#2026!');
    console.log('Argon2id Match:', matched);
  } catch (e) {
    console.error('Argon2id failed:');
    console.error(e);
  }
}

run();
