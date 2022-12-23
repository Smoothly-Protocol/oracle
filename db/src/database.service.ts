import * as mongoDB from "mongodb";

export const collections: { users?: mongoDB.Collection } = {};

export async function connectToDatabase (DB_CONN_STRING: string, DB_NAME: string, USERS_COLLECTION_NAME: string ) {
	const client: mongoDB.MongoClient = new mongoDB.MongoClient(DB_CONN_STRING);
	await client.connect();
	const db: mongoDB.Db = client.db(DB_NAME);
	const usersCollection: mongoDB.Collection = db.collection(USERS_COLLECTION_NAME);
	collections.users = usersCollection;
	console.log(`Successfully connected to database: ${db.databaseName} and collection: ${usersCollection.collectionName}`);
}
