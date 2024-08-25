// getCurrentValues.js
const hubspot = require('@hubspot/api-client');

exports.main = async (context = {}) => {
  const hubspotClient = new hubspot.Client({
    accessToken: process.env['PRIVATE_APP_ACCESS_TOKEN']
  });

    const { propertyName } = context.parameters;
    const { hs_object_id } = context.propertiesToSend; // Company ID or object ID to update

  if (!hs_object_id) {
    throw new Error('Required parameter hs_object_id is missing.');
  }

  try {
    const apiResponse = await hubspotClient.crm.companies.basicApi.getById(hs_object_id, propertyName); // Replace with actual property names
    return apiResponse;
  } catch (error) {
    console.error('Error fetching current property values:', error);
    throw error;
  }
};
