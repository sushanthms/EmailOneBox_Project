const { client } = require('../config/elasticsearch');

class ElasticsearchService {
  async indexEmail(email) {
    try {
      await client.index({
        index: 'emails',
        id: email.messageId,
        body: email,
        refresh: true
      });
      return { success: true };
    } catch (error) {
      console.error('Error indexing email:', error.message);
      return { success: false, error: error.message };
    }
  }

  async searchEmails(query, filters = {}) {
    try {
      const must = [];
      
      if (query) {
        must.push({
          multi_match: {
            query: query,
            fields: ['subject^3', 'body', 'from', 'to']
          }
        });
      }

      if (filters.account) {
        must.push({ term: { account: filters.account } });
      }

      if (filters.folder) {
        must.push({ term: { folder: filters.folder } });
      }

      if (filters.category) {
        must.push({ term: { category: filters.category } });
      }

      const result = await client.search({
        index: 'emails',
        body: {
          query: must.length > 0 ? { bool: { must } } : { match_all: {} },
          sort: [{ date: { order: 'desc' } }],
          size: 100
        }
      });

      return result.hits.hits.map(hit => ({
        id: hit._id,
        ...hit._source
      }));
    } catch (error) {
      console.error('Error searching emails:', error.message);
      return [];
    }
  }

  async getEmailById(id) {
    try {
      const result = await client.get({
        index: 'emails',
        id: id
      });
      return result._source;
    } catch (error) {
      console.error('Error getting email:', error.message);
      return null;
    }
  }

  async updateEmail(id, updates) {
    try {
      await client.update({
        index: 'emails',
        id: id,
        body: {
          doc: updates
        }
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating email:', error.message);
      return { success: false, error: error.message };
    }
  }

  async deleteEmail(id) {
    try {
      await client.delete({
        index: 'emails',
        id: id
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting email:', error.message);
      return { success: false, error: error.message };
    }
  }

  async getAccounts() {
    try {
      const result = await client.search({
        index: 'emails',
        body: {
          size: 0,
          aggs: {
            accounts: {
              terms: { field: 'account' }
            }
          }
        }
      });
      return result.aggregations.accounts.buckets.map(b => b.key);
    } catch (error) {
      console.error('Error getting accounts:', error.message);
      return [];
    }
  }

  async getFolders(account) {
    try {
      const query = account ? { term: { account } } : { match_all: {} };
      
      const result = await client.search({
        index: 'emails',
        body: {
          query,
          size: 0,
          aggs: {
            folders: {
              terms: { field: 'folder' }
            }
          }
        }
      });
      return result.aggregations.folders.buckets.map(b => b.key);
    } catch (error) {
      console.error('Error getting folders:', error.message);
      return [];
    }
  }
}

module.exports = new ElasticsearchService();