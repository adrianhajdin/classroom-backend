import { eq } from 'drizzle-orm';
// The 'pool' export will only exist for WebSocket and node-postgres drivers
import { index } from './db';
import { demoUsers } from './db/schema';

async function main() {
  try {
    console.log('Performing CRUD operations...');

    // CREATE: Insert a new user
    const [newUser] = await index
      .insert(demoUsers)
      .values({ name: 'Admin User', email: 'admin@example.com' })
      .returning();

    if (!newUser) {
      throw new Error('Failed to create user');
    }

    console.log('✅ CREATE: New user created:', newUser);

    // READ: Select the user
    const foundUser = await index.select().from(demoUsers).where(eq(demoUsers.id, newUser.id));
    console.log('✅ READ: Found user:', foundUser[0]);

    // UPDATE: Change the user's name
    const [updatedUser] = await index
      .update(demoUsers)
      .set({ name: 'Super Admin' })
      .where(eq(demoUsers.id, newUser.id))
      .returning();

    if (!updatedUser) {
      throw new Error('Failed to update user');
    }

    console.log('✅ UPDATE: User updated:', updatedUser);

    // DELETE: Remove the user
    await index.delete(demoUsers).where(eq(demoUsers.id, newUser.id));
    console.log('✅ DELETE: User deleted.');

    console.log('\nCRUD operations completed successfully.');
  } catch (error) {
    console.error('❌ Error performing CRUD operations:', error);
    process.exit(1);
  } finally {
    // If the pool exists, end it to close the connection
    // @ts-ignore - pool is only available in other drivers
    if (globalThis.pool) {
      // @ts-ignore
      await globalThis.pool.end();
      console.log('Database pool closed.');
    }
  }
}

main();
