import { MongoClient, Db } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = process.env.DATABASE_NAME || 'claim-confidence';

class Database {
  private static instance: Database;
  private client: MongoClient;
  private db: Db | null = null;
  private isConnecting: boolean = false;
  private connectionPromise: Promise<void> = Promise.resolve();

  private constructor() {
    this.client = new MongoClient(MONGODB_URI);
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.db) {
      return; // Already connected
    }

    if (this.isConnecting) {
      // If a connection is in progress, wait for it
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = (async () => {
      try {
        await this.client.connect();
        this.db = this.client.db(DATABASE_NAME);
        console.log('Connected successfully to MongoDB');
      } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        this.isConnecting = false;
        throw error;
      }
      this.isConnecting = false;
    })();

    return this.connectionPromise;
  }

  public async getDb(): Promise<Db> {
    if (!this.db) {
      await this.connect();
    }
    if (!this.db) {
      throw new Error('Failed to establish database connection');
    }
    return this.db;
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.db = null;
      this.isConnecting = false;
      this.connectionPromise = Promise.resolve();
      console.log('Disconnected from MongoDB');
    }
  }
}

export default Database;