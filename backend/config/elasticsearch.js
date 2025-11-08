const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

async function initializeIndex() {
  const indexName = 'emails';
  
  try {
    const exists = await client.indices.exists({ index: indexName });
    
    if (!exists) {
      await client.indices.create({
        index: indexName,
        body: {
          mappings: {
            properties: {
              messageId: { type: 'keyword' },
              account: { type: 'keyword' },
              folder: { type: 'keyword' },
              from: { type: 'text' },
              to: { type: 'text' },
              subject: { type: 'text' },
              body: { type: 'text' },
              date: { type: 'date' },
              category: { type: 'keyword' },
              read: { type: 'boolean' },
              starred: { type: 'boolean' }
            }
          }
        }
      });
      console.log('✅ Elasticsearch index created');
    } else {
      console.log('✅ Elasticsearch index already exists');
    }
  } catch (error) {
    console.error('❌ Error initializing Elasticsearch index:', error.message);
  }
}

module.exports = { client, initializeIndex };