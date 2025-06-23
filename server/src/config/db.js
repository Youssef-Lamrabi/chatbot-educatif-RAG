import { CosmosClient } from "@azure/cosmos";
import dotenv from 'dotenv';
dotenv.config();

if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_ENDPOINT.includes("https://localhost")) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    console.warn("--------------------------------------------------------------------------------------");
    console.warn("ATTENTION: NODE_TLS_REJECT_UNAUTHORIZED est mis à '0' pour l'émulateur Cosmos DB.");
    console.warn("         Ceci est UNIQUEMENT pour le développement local et NE DOIT PAS être utilisé en production.");
    console.warn("--------------------------------------------------------------------------------------");
}

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE_ID;
const usersContainerId = process.env.COSMOS_USERS_CONTAINER_ID;
const conversationsContainerId = process.env.COSMOS_CONVERSATIONS_CONTAINER_ID;

let client;
let database;
let usersContainer;
let conversationsContainer;

if (!endpoint || !key || !databaseId || !usersContainerId || !conversationsContainerId) {
  console.error("ERREUR FATALE: Des variables de configuration pour Cosmos DB sont manquantes dans le fichier .env.");
  console.error("Vérifiez COSMOS_ENDPOINT, COSMOS_KEY, COSMOS_DATABASE_ID, COSMOS_USERS_CONTAINER_ID, COSMOS_CONVERSATIONS_CONTAINER_ID.");
  process.exit(1);
}

client = new CosmosClient({ endpoint, key });

const connectDB = async () => {
  try {
    const { database: dbInstance } = await client.databases.createIfNotExists({ id: databaseId });
    database = dbInstance;
    console.log(`Base de données Cosmos DB "${databaseId}" assurée.`);

    const { container: usersCont } = await database.containers.createIfNotExists({
      id: usersContainerId,
      partitionKey: { paths: ["/id"] }
    });
    usersContainer = usersCont;
    console.log(`Conteneur Cosmos DB "${usersContainerId}" assuré.`);

    const { container: convCont } = await database.containers.createIfNotExists({
      id: conversationsContainerId,
      partitionKey: { paths: ["/userId"] }
    });
    conversationsContainer = convCont;
    console.log(`Conteneur Cosmos DB "${conversationsContainerId}" assuré.`);

    console.log('Client Azure Cosmos DB (Émulateur) initialisé et connecté.');

  } catch (err) {
    console.error('Erreur d\'initialisation de Cosmos DB:', err.message);
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        console.error("Assurez-vous que l'émulateur Cosmos DB est démarré et accessible à l'adresse:", endpoint);
    }
    if (err.message && err.message.includes("Self-signed certificate")) {
        console.error("Erreur SSL avec l'émulateur Cosmos DB. Vérifiez que NODE_TLS_REJECT_UNAUTHORIZED='0' est défini.");
    }
    process.exit(1);
  }
};

export { connectDB, usersContainer, conversationsContainer, client, database };