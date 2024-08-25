// for HubSpot API calls
const hubspot = require('@hubspot/api-client');

// Initialize HubSpot API client
exports.main = async (context = {}) => {
  // console.log("Getting Property");
  // console.log(context.parameters);

  const hubspotClient = new hubspot.Client({
    accessToken: process.env['PRIVATE_APP_ACCESS_TOKEN']
  });

  // Extract objectType and propertyName from context.parameters
  const { objectType, propertyName } = context.parameters;

  if (!objectType || !propertyName) {
    throw new Error('Required parameters objectType or propertyName are missing.');
  }

  try {
    const apiResponse = await hubspotClient.crm.properties.coreApi.getByName(objectType, propertyName);
    return apiResponse;
  } catch (error) {
    console.error('Error fetching property details:', error);
    throw error;
  }
};
