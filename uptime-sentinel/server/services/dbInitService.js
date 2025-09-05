const mongoose = require('mongoose');

class DatabaseInitService {
  constructor() {
    this.requiredCollections = ['websites'];
    this.indexes = [
      {
        collection: 'websites',
        indexes: [
          { fields: { url: 1 }, options: { unique: true } },
          { fields: { email: 1 }, options: {} },
          { fields: { status: 1 }, options: {} },
          { fields: { lastChecked: -1 }, options: {} },
          { fields: { consecutiveFailures: -1 }, options: {} },
          { fields: { createdAt: -1 }, options: {} }
        ]
      }
    ];
  }

  async initializeDatabase() {
    try {
      console.log('🔧 Initializing database...');
      
      // Get current database name
      const dbName = mongoose.connection.db.databaseName;
      console.log(`📊 Database: ${dbName}`);

      // Check and create collections
      await this.ensureCollections();
      
      // Create indexes for better performance
      await this.createIndexes();
      
      // Verify database structure
      await this.verifyDatabaseStructure();
      
      console.log('✅ Database initialization completed successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      throw error;
    }
  }

  async ensureCollections() {
    try {
      const db = mongoose.connection.db;
      const existingCollections = await db.listCollections().toArray();
      const existingNames = existingCollections.map(col => col.name);
      
      console.log('📋 Existing collections:', existingNames);

      for (const collectionName of this.requiredCollections) {
        if (!existingNames.includes(collectionName)) {
          await db.createCollection(collectionName);
          console.log(`✅ Created collection: ${collectionName}`);
        } else {
          console.log(`✓ Collection exists: ${collectionName}`);
        }
      }
    } catch (error) {
      console.error('❌ Error ensuring collections:', error.message);
      throw error;
    }
  }

  async createIndexes() {
    try {
      console.log('📊 Creating database indexes...');
      
      for (const collectionConfig of this.indexes) {
        const collection = mongoose.connection.db.collection(collectionConfig.collection);
        
        for (const indexConfig of collectionConfig.indexes) {
          try {
            await collection.createIndex(indexConfig.fields, indexConfig.options);
            const indexName = Object.keys(indexConfig.fields).join('_');
            console.log(`✅ Created index on ${collectionConfig.collection}.${indexName}`);
          } catch (error) {
            if (error.code === 85) {
              // Index already exists, which is fine
              console.log(`✓ Index already exists on ${collectionConfig.collection}`);
            } else {
              console.error(`❌ Error creating index on ${collectionConfig.collection}:`, error.message);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error creating indexes:', error.message);
      throw error;
    }
  }

  async verifyDatabaseStructure() {
    try {
      console.log('🔍 Verifying database structure...');
      
      const db = mongoose.connection.db;
      
      // Verify collections
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(col => col.name);
      
      for (const requiredCollection of this.requiredCollections) {
        if (!collectionNames.includes(requiredCollection)) {
          throw new Error(`Required collection '${requiredCollection}' is missing`);
        }
      }
      
      // Verify indexes
      for (const collectionConfig of this.indexes) {
        const collection = db.collection(collectionConfig.collection);
        const indexes = await collection.listIndexes().toArray();
        
        console.log(`📊 Indexes for ${collectionConfig.collection}:`, 
          indexes.map(idx => `${idx.name} (${Object.keys(idx.key).join(', ')})`).join(', ')
        );
      }
      
      // Check database stats
      const stats = await db.stats();
      console.log('📈 Database Statistics:');
      console.log(`   • Collections: ${stats.collections}`);
      console.log(`   • Data Size: ${this.formatBytes(stats.dataSize)}`);
      console.log(`   • Index Size: ${this.formatBytes(stats.indexSize)}`);
      console.log(`   • Storage Size: ${this.formatBytes(stats.storageSize)}`);
      
    } catch (error) {
      console.error('❌ Error verifying database structure:', error.message);
      throw error;
    }
  }

  async getCollectionStats() {
    try {
      const stats = {};
      
      for (const collectionName of this.requiredCollections) {
        const collection = mongoose.connection.db.collection(collectionName);
        const count = await collection.countDocuments();
        stats[collectionName] = count;
      }
      
      return stats;
    } catch (error) {
      console.error('❌ Error getting collection stats:', error.message);
      return {};
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async dropDatabase() {
    try {
      console.warn('⚠️ DROPPING DATABASE - This action cannot be undone!');
      await mongoose.connection.db.dropDatabase();
      console.log('✅ Database dropped successfully');
    } catch (error) {
      console.error('❌ Error dropping database:', error.message);
      throw error;
    }
  }

  async resetCollection(collectionName) {
    try {
      console.warn(`⚠️ RESETTING COLLECTION: ${collectionName}`);
      const collection = mongoose.connection.db.collection(collectionName);
      await collection.deleteMany({});
      console.log(`✅ Collection ${collectionName} reset successfully`);
    } catch (error) {
      console.error(`❌ Error resetting collection ${collectionName}:`, error.message);
      throw error;
    }
  }
}

module.exports = new DatabaseInitService();
