import { Collection, ObjectId, WithId, Filter, UpdateFilter, OptionalUnlessRequiredId, Db, Document } from 'mongodb';
import Database from '../config/database';

export abstract class BaseRepository<T extends Document> {
  protected collection!: Collection<T>;
  protected db!: Db;
  private readonly collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
    this.initializeCollection();
  }

  private async initializeCollection(): Promise<void> {
    this.db = await Database.getInstance().getDb();
    this.collection = this.db.collection<T>(this.collectionName);
  }

  protected async getCollection(): Promise<Collection<T>> {
    if (!this.collection) {
      this.db = await Database.getInstance().getDb();
      this.collection = this.db.collection<T>(this.collectionName);
    }
    return this.collection;
  }

  async findById(id: string): Promise<WithId<T> | null> {
    return this.collection.findOne({ _id: new ObjectId(id) } as Filter<T>);
  }

  async findAll(): Promise<WithId<T>[]> {
    return this.collection.find().toArray();
  }

  async create(data: Omit<T, '_id'>): Promise<WithId<T>> {
    const result = await this.collection.insertOne({ ...data } as OptionalUnlessRequiredId<T>);
    return { ...data, _id: result.insertedId } as WithId<T>;
  }

  async update(id: string, data: Partial<T>): Promise<WithId<T> | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) } as Filter<T>,
      { $set: data } as UpdateFilter<T>,
      { returnDocument: 'after' }
    );
    return result;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id: new ObjectId(id) } as Filter<T>);
    return result.deletedCount > 0;
  }

  async findOne(filter: Filter<T>): Promise<WithId<T> | null> {
    return this.collection.findOne(filter);
  }

  async find(filter: Filter<T>): Promise<WithId<T>[]> {
    return this.collection.find(filter).toArray();
  }
} 